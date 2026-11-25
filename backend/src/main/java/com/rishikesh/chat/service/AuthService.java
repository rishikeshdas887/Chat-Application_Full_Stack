package com.rishikesh.chat.service;

import com.rishikesh.chat.dto.AuthResponse;
import com.rishikesh.chat.dto.LoginRequest;
import com.rishikesh.chat.dto.OtpRequest;
import com.rishikesh.chat.dto.OtpResponse;
import com.rishikesh.chat.dto.OtpVerifyRequest;
import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.enums.UserStatus;
import com.rishikesh.chat.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final OtpService otpService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService,
                       OtpService otpService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.otpService = otpService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = null;

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            user = userRepository.findByUsername(request.getUsername().trim())
                    .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
        } else if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            user = userRepository.findByPhoneNumber(request.getPhoneNumber().trim())
                    .orElseThrow(() -> new BadCredentialsException("Invalid phone number or password"));
        } else {
            throw new BadCredentialsException("Username or phone number is required");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getHashedPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtTokenService.generateToken(user.getId(), user.getUsername());

        return new AuthResponse(
                token,
                3600L,
                user.getId(),
                user.getUsername()
        );
    }

    public OtpResponse requestOtp(OtpRequest request) {
        return otpService.requestOtp(request.getPhoneNumber().trim());
    }

    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        String phoneNumber = otpService.verifyOtp(request.getChallengeId().trim(), request.getOtp().trim());

        // Find existing user or register new user for verified phone number
        User user = userRepository.findByPhoneNumber(phoneNumber).orElseGet(() -> {
            User newUser = new User();
            String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");
            String baseUsername = "user_" + (digitsOnly.length() > 6 ? digitsOnly.substring(digitsOnly.length() - 6) : digitsOnly);
            String candidateUsername = baseUsername;
            int counter = 1;
            while (userRepository.findByUsername(candidateUsername).isPresent()) {
                candidateUsername = baseUsername + "_" + counter++;
            }
            newUser.setUsername(candidateUsername);
            newUser.setPhoneNumber(phoneNumber);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setStatus(UserStatus.ONLINE);
            // Secure random password hash for OTP-registered user
            newUser.setHashedPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });

        String token = jwtTokenService.generateToken(user.getId(), user.getUsername());

        return new AuthResponse(
                token,
                3600L,
                user.getId(),
                user.getUsername()
        );
    }
}
