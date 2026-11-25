package com.rishikesh.chat.controller;

import com.rishikesh.chat.dto.AuthResponse;
import com.rishikesh.chat.dto.LoginRequest;
import com.rishikesh.chat.dto.OtpRequest;
import com.rishikesh.chat.dto.OtpResponse;
import com.rishikesh.chat.dto.OtpVerifyRequest;
import com.rishikesh.chat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/otp/request")
    public OtpResponse requestOtp(@Valid @RequestBody OtpRequest request) {
        return authService.requestOtp(request);
    }

    @PostMapping("/otp/verify")
    public AuthResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return authService.verifyOtp(request);
    }
}
