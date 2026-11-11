package com.rishikesh.chat.dto;

public class RegisterUserRequest {
    private String username;
    private String phoneNumber;
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

}
