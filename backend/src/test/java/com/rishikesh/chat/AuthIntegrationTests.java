package com.rishikesh.chat;

import com.rishikesh.chat.dto.AuthResponse;
import com.rishikesh.chat.dto.LoginRequest;
import com.rishikesh.chat.dto.OtpRequest;
import com.rishikesh.chat.dto.OtpResponse;
import com.rishikesh.chat.dto.OtpVerifyRequest;
import com.rishikesh.chat.entity.OtpChallenge;
import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.enums.UserStatus;
import com.rishikesh.chat.exception.RateLimitExceededException;
import com.rishikesh.chat.repository.OtpChallengeRepository;
import com.rishikesh.chat.repository.UserRepository;
import com.rishikesh.chat.service.AuthService;
import com.rishikesh.chat.service.JwtTokenService;
import com.rishikesh.chat.service.OtpService;
import com.rishikesh.chat.service.totp.TotpService;
import com.rishikesh.chat.service.UserService;
import com.rishikesh.chat.service.sms.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthIntegrationTests {

    @Mock
    private OtpChallengeRepository otpChallengeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenService jwtTokenService;

    private PasswordEncoder passwordEncoder;
    private TotpService totpService;
    private OtpService otpService;
    private AuthService authService;

    private final String TEST_PHONE = "+919876543210";
    private final String TEST_USERNAME = "testuser";
    private final String TEST_PASSWORD = "Password@123";

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        totpService = new TotpService();
        otpService = new OtpService(otpChallengeRepository, userRepository, totpService, passwordEncoder);
        authService = new AuthService(userService, userRepository, passwordEncoder, jwtTokenService, otpService);
    }

    @Test
    @DisplayName("1. Request OTP successfully and verify 10-minute validity and 60-second cooldown")
    void testRequestOtp_Success() {
        when(otpChallengeRepository.findByPhoneNumberAndUsedFalse(TEST_PHONE)).thenReturn(Collections.emptyList());

        User mockUser = new User();
        mockUser.setPhoneNumber(TEST_PHONE);
        mockUser.setUsername(TEST_USERNAME);
        mockUser.setTotpSecret("JBSWY3DPEHPK3PXP");
        when(userRepository.findByPhoneNumber(TEST_PHONE)).thenReturn(Optional.of(mockUser));

        ArgumentCaptor<OtpChallenge> challengeCaptor = ArgumentCaptor.forClass(OtpChallenge.class);

        OtpRequest request = new OtpRequest(TEST_PHONE);
        OtpResponse response = authService.requestOtp(request);

        assertNotNull(response.getChallengeId());
        assertEquals(600L, response.getExpiresIn());
        assertEquals(60L, response.getResendAfter());
        assertEquals("OTP request accepted", response.getMessage());
        assertNotNull(response.getTotpSecret());

        verify(otpChallengeRepository).save(challengeCaptor.capture());

        OtpChallenge savedChallenge = challengeCaptor.getValue();
        assertEquals(TEST_PHONE, savedChallenge.getPhoneNumber());
        assertFalse(savedChallenge.isUsed());
        assertEquals(0, savedChallenge.getAttempts());
        assertEquals(5, savedChallenge.getMaxAttempts());
        assertNotNull(savedChallenge.getHashedOtp());
    }

    @Test
    @DisplayName("2. Enforce 60-second cooldown rate limiting on resend")
    void testRequestOtp_RateLimitCooldown() {
        OtpChallenge activeChallenge = new OtpChallenge(
                "active-123",
                TEST_PHONE,
                "hashed",
                LocalDateTime.now().plusMinutes(9),
                LocalDateTime.now().plusSeconds(45) // 45 seconds cooldown remaining
        );

        when(otpChallengeRepository.findByPhoneNumberAndUsedFalse(TEST_PHONE))
                .thenReturn(List.of(activeChallenge));

        OtpRequest request = new OtpRequest(TEST_PHONE);
        RateLimitExceededException ex = assertThrows(
                RateLimitExceededException.class,
                () -> authService.requestOtp(request)
        );

        assertTrue(ex.getMessage().contains("Please wait"));
    }

    @Test
    @DisplayName("3. Verify OTP successfully, consume challenge (single-use), and issue JWT")
    void testVerifyOtp_Success() {
        String rawOtp = "482910";
        String hashedOtp = passwordEncoder.encode(rawOtp);
        OtpChallenge challenge = new OtpChallenge(
                "ch-123",
                TEST_PHONE,
                hashedOtp,
                LocalDateTime.now().plusMinutes(10),
                LocalDateTime.now().plusSeconds(60)
        );

        when(otpChallengeRepository.findByChallengeId("ch-123")).thenReturn(Optional.of(challenge));

        User existingUser = new User();
        existingUser.setUsername("existing_user");
        existingUser.setPhoneNumber(TEST_PHONE);
        when(userRepository.findByPhoneNumber(TEST_PHONE)).thenReturn(Optional.of(existingUser));
        when(jwtTokenService.generateToken(any(), eq("existing_user"))).thenReturn("mocked.jwt.token");

        OtpVerifyRequest verifyRequest = new OtpVerifyRequest("ch-123", rawOtp);
        AuthResponse authResponse = authService.verifyOtp(verifyRequest);

        assertNotNull(authResponse);
        assertEquals("mocked.jwt.token", authResponse.getAccessToken());
        assertEquals("existing_user", authResponse.getUsername());
        assertTrue(challenge.isUsed(), "Challenge must be marked as used (single-use)");
        verify(otpChallengeRepository).save(challenge);
    }

    @Test
    @DisplayName("4. Reject incorrect OTP and enforce maximum attempts (max 5)")
    void testVerifyOtp_IncorrectOtpAndMaxAttempts() {
        String correctOtp = "123456";
        String hashedOtp = passwordEncoder.encode(correctOtp);
        OtpChallenge challenge = new OtpChallenge(
                "ch-fail",
                TEST_PHONE,
                hashedOtp,
                LocalDateTime.now().plusMinutes(10),
                LocalDateTime.now().plusSeconds(60)
        );
        challenge.setAttempts(4); // 4 attempts already made

        when(otpChallengeRepository.findByChallengeId("ch-fail")).thenReturn(Optional.of(challenge));

        OtpVerifyRequest wrongOtpRequest = new OtpVerifyRequest("ch-fail", "999999");
        BadCredentialsException ex = assertThrows(
                BadCredentialsException.class,
                () -> authService.verifyOtp(wrongOtpRequest)
        );

        assertTrue(ex.getMessage().contains("Maximum verification attempts exceeded"));
        assertEquals(5, challenge.getAttempts());
        assertFalse(challenge.isUsed());
    }

    @Test
    @DisplayName("5. Reject expired OTP (> 10 minutes)")
    void testVerifyOtp_Expired() {
        OtpChallenge expiredChallenge = new OtpChallenge(
                "ch-expired",
                TEST_PHONE,
                passwordEncoder.encode("123456"),
                LocalDateTime.now().minusMinutes(1), // Expired 1 minute ago
                LocalDateTime.now().minusMinutes(9)
        );

        when(otpChallengeRepository.findByChallengeId("ch-expired")).thenReturn(Optional.of(expiredChallenge));

        OtpVerifyRequest request = new OtpVerifyRequest("ch-expired", "123456");
        BadCredentialsException ex = assertThrows(
                BadCredentialsException.class,
                () -> authService.verifyOtp(request)
        );

        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("6. Option B: Username & Password login success and failure")
    void testUsernamePasswordLogin() {
        User user = new User();
        user.setUsername(TEST_USERNAME);
        user.setHashedPassword(passwordEncoder.encode(TEST_PASSWORD));

        when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(user));
        when(jwtTokenService.generateToken(any(), eq(TEST_USERNAME))).thenReturn("jwt.option.b");

        // Successful login
        LoginRequest validRequest = new LoginRequest(TEST_USERNAME, null, TEST_PASSWORD);
        AuthResponse response = authService.login(validRequest);
        assertEquals("jwt.option.b", response.getAccessToken());
        assertEquals(TEST_USERNAME, response.getUsername());

        // Failed login (wrong password)
        LoginRequest wrongPasswordRequest = new LoginRequest(TEST_USERNAME, null, "WrongPass!");
        assertThrows(BadCredentialsException.class, () -> authService.login(wrongPasswordRequest));
    }
}
