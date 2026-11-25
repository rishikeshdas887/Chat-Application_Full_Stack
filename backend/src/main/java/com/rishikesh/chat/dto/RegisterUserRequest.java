package com.rishikesh.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public class RegisterUserRequest {
    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 40, message = "Username must be 3-40 characters long ")

    private String username; // characters required to save a name

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Enter a valid international phone number")

    private String phoneNumber; // international format

    // password minimm 8 characters
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be 8-72 characters")

    private String password;

    // getters
    public String getUsername() {
        return username;
    }

    public String getPhoneNumber() {
        return phoneNumber;

    }

    public String getPassword() {
        return password;
    }

    // setters

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
