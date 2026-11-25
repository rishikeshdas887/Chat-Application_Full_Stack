package com.rishikesh.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_challenges", indexes = {
    @Index(name = "idx_otp_phone", columnList = "phone_number"),
    @Index(name = "idx_otp_challenge_id", columnList = "challenge_id")
})
public class OtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", unique = true, nullable = false, length = 64)
    private String challengeId;

    @Column(name = "phone_number", nullable = false, length = 32)
    private String phoneNumber;

    @Column(name = "hashed_otp", nullable = false, length = 128)
    private String hashedOtp;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "resend_available_at", nullable = false)
    private LocalDateTime resendAvailableAt;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public OtpChallenge() {
    }

    public OtpChallenge(String challengeId, String phoneNumber, String hashedOtp,
                        LocalDateTime expiresAt, LocalDateTime resendAvailableAt) {
        this.challengeId = challengeId;
        this.phoneNumber = phoneNumber;
        this.hashedOtp = hashedOtp;
        this.expiresAt = expiresAt;
        this.resendAvailableAt = resendAvailableAt;
        this.attempts = 0;
        this.maxAttempts = 5;
        this.used = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(String challengeId) {
        this.challengeId = challengeId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getHashedOtp() {
        return hashedOtp;
    }

    public void setHashedOtp(String hashedOtp) {
        this.hashedOtp = hashedOtp;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getResendAvailableAt() {
        return resendAvailableAt;
    }

    public void setResendAvailableAt(LocalDateTime resendAvailableAt) {
        this.resendAvailableAt = resendAvailableAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
