package com.rishikesh.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LoginRequest {
    @NotBlank(message = "Phone Number cannot be empty")
    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Enter a valid international phone number")

    private String phoneNumber;

    @NotBlank(message = "Password cannot be empty")
    private String password;

    // getters
    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getPassword() {
        return password;
    }

    // Setters
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
