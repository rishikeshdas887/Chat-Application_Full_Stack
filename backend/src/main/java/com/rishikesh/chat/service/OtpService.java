package com.rishikesh.chat.service;

import com.rishikesh.chat.dto.OtpResponse;
import com.rishikesh.chat.entity.OtpChallenge;
import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.enums.UserStatus;
import com.rishikesh.chat.exception.RateLimitExceededException;
import com.rishikesh.chat.repository.OtpChallengeRepository;
import com.rishikesh.chat.repository.UserRepository;
import com.rishikesh.chat.service.totp.TotpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final long OTP_VALIDITY_SECONDS = 600L; // 10 minutes
    private static final long RESEND_COOLDOWN_SECONDS = 60L; // 60 seconds
    private static final int MAX_ATTEMPTS = 5;

    private final OtpChallengeRepository otpChallengeRepository;
    private final UserRepository userRepository;
    private final TotpService totpService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpChallengeRepository otpChallengeRepository,
                      UserRepository userRepository,
                      TotpService totpService,
                      PasswordEncoder passwordEncoder) {
        this.otpChallengeRepository = otpChallengeRepository;
        this.userRepository = userRepository;
        this.totpService = totpService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public OtpResponse requestOtp(String phoneNumber) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Rate-limit check: Resend cooldown (15 seconds)
        List<OtpChallenge> activeChallenges = otpChallengeRepository.findByPhoneNumberAndUsedFalse(phoneNumber);
        for (OtpChallenge challenge : activeChallenges) {
            if (challenge.getResendAvailableAt().isAfter(now)) {
                long remainingSeconds = Duration.between(now, challenge.getResendAvailableAt()).getSeconds();
                throw new RateLimitExceededException("Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting a new OTP.");
            }
        }

        // 2. Find or create user to get persistent TOTP secret
        User user = userRepository.findByPhoneNumber(phoneNumber).orElseGet(() -> {
            User newUser = new User();
            newUser.setPhoneNumber(phoneNumber);
            // Default username from phone number
            String defaultUsername = "User" + phoneNumber.replaceAll("[^0-9]", "");
            if (defaultUsername.length() > 14) {
                defaultUsername = defaultUsername.substring(defaultUsername.length() - 10);
            }
            newUser.setUsername(defaultUsername);
            newUser.setStatus(UserStatus.ONLINE);
            newUser.setCreatedAt(now);
            return userRepository.save(newUser);
        });

        boolean isNewSetup = false;
        String totpSecret = user.getTotpSecret();
        if (totpSecret == null || totpSecret.trim().isEmpty()) {
            totpSecret = totpService.generateSecret();
            user.setTotpSecret(totpSecret);
            userRepository.save(user);
            isNewSetup = true;
        }

        String qrUri = totpService.generateTotpUri(totpSecret, user.getUsername() != null ? user.getUsername() : phoneNumber);

        // 3. Create Challenge
        String challengeId = UUID.randomUUID().toString();
        LocalDateTime expiresAt = now.plusSeconds(OTP_VALIDITY_SECONDS);
        LocalDateTime resendAvailableAt = now.plusSeconds(RESEND_COOLDOWN_SECONDS);

        // CSPRNG fallback code hashed with BCrypt
        int numericOtp = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(numericOtp);
        String hashedOtp = passwordEncoder.encode(rawOtp);

        OtpChallenge challenge = new OtpChallenge(
                challengeId,
                phoneNumber,
                hashedOtp,
                expiresAt,
                resendAvailableAt
        );
        challenge.setMaxAttempts(MAX_ATTEMPTS);
        otpChallengeRepository.save(challenge);

        logger.info("================================================================================");
        logger.info("[TOTP AUTHENTICATOR] Authenticator session initialized for: {}", phoneNumber);
        logger.info("[TOTP AUTHENTICATOR] Secret Key (Google Authenticator): {}", totpSecret);
        logger.info("[TOTP AUTHENTICATOR] Scan URI: {}", qrUri);
        logger.info("[TOTP AUTHENTICATOR] Dev Bypass Code: 123456 or Dynamic OTP: {}", rawOtp);
        logger.info("================================================================================");

        return new OtpResponse(
                challengeId,
                OTP_VALIDITY_SECONDS,
                RESEND_COOLDOWN_SECONDS,
                "OTP request accepted",
                totpSecret,
                qrUri,
                isNewSetup
        );
    }

    @Transactional
    public String verifyOtp(String challengeId, String rawOtp) {
        OtpChallenge challenge = otpChallengeRepository.findByChallengeId(challengeId)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired OTP challenge"));

        LocalDateTime now = LocalDateTime.now();

        // 1. Check if single-use already consumed
        if (challenge.isUsed()) {
            throw new BadCredentialsException("This OTP has already been used");
        }

        // 2. Check 10-minute expiration
        if (challenge.getExpiresAt().isBefore(now)) {
            throw new BadCredentialsException("OTP has expired. Please request a new code.");
        }

        // 3. Check attempt limit
        if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
            throw new BadCredentialsException("Maximum OTP verification attempts exceeded. Please request a new code.");
        }

        // 4. Increment attempts
        challenge.setAttempts(challenge.getAttempts() + 1);

        // 5. Look up user's TOTP secret
        User user = userRepository.findByPhoneNumber(challenge.getPhoneNumber()).orElse(null);
        String totpSecret = (user != null) ? user.getTotpSecret() : null;

        // 6. Verify against TOTP Authenticator App OR standard BCrypt/Bypass
        boolean isValidTotp = (totpSecret != null) && totpService.verifyTotp(totpSecret, rawOtp);
        boolean isBcryptMatch = passwordEncoder.matches(rawOtp, challenge.getHashedOtp());
        boolean isDevBypass = "123456".equals(rawOtp);

        if (!isValidTotp && !isBcryptMatch && !isDevBypass) {
            otpChallengeRepository.save(challenge);
            int remaining = challenge.getMaxAttempts() - challenge.getAttempts();
            if (remaining <= 0) {
                throw new BadCredentialsException("Maximum verification attempts exceeded. Please request a new code.");
            }
            throw new BadCredentialsException("Invalid Authenticator OTP. " + remaining + " attempts remaining.");
        }

        // 7. Mark challenge consumed
        challenge.setUsed(true);
        otpChallengeRepository.save(challenge);

        return challenge.getPhoneNumber();
    }
}
