package com.rishikesh.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpVerifyRequest {

    @NotBlank(message = "Challenge ID is required")
    private String challengeId;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be a 6-digit numeric code")
    private String otp;

    public OtpVerifyRequest() {
    }

    public OtpVerifyRequest(String challengeId, String otp) {
        this.challengeId = challengeId;
        this.otp = otp;
    }

    public String getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(String challengeId) {
        this.challengeId = challengeId;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
