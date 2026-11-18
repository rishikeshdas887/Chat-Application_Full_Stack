package com.rishikesh.chat.dto;

public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private Long expiresIn;
    private Long userId;
    private String username;

    public AuthResponse(String accessToken, Long expiresIn, Long userId, String username) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.username = username;
    }

    // Getters
    public String getAccessToken() {
        return accessToken;
    }

    public String getTokenType() {
        return tokenType;

    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }
}
