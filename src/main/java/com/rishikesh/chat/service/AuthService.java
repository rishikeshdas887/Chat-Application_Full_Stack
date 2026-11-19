package com.rishikesh.chat.service;

import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.dto.LoginRequest;
import com.rishikesh.chat.dto.AuthResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService) {

        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public AuthResponse login(LoginRequest request) {

        User user = userService.getUserByPhoneNumber(request.getPhoneNumber());

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getHashedPassword())) {
            throw new BadCredentialsException("Invalid phone number or password");
        }

        String token = jwtTokenService.generateToken(
                user.getId(),
                user.getUsername());

        return new AuthResponse(
                token,
                3600L,
                user.getId(),
                user.getUsername());

    }
}
