package com.rishikesh.chat.service.sms;

public interface SmsService {
    /**
     * Dispatches an OTP to the specified phone number over telecom network or configured SMS gateway.
     *
     * @param phoneNumber Destination phone number in E.164 format (e.g. +919876543210)
     * @param otp 6-digit numeric OTP code
     */
    void sendOtp(String phoneNumber, String otp);
}
