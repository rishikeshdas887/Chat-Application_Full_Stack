package com.rishikesh.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Enter a valid international phone number in E.164 format (e.g. +919876543210)")
    private String phoneNumber;

    public OtpRequest() {
    }

    public OtpRequest(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
