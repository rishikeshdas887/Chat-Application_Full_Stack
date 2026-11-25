package com.rishikesh.chat.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    private String username;
    private String phoneNumber;

    @NotBlank(message = "Password cannot be empty")
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String username, String phoneNumber, String password) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
