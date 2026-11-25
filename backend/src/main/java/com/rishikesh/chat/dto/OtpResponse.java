package com.rishikesh.chat.dto;

public class OtpResponse {

    private String challengeId;
    private long expiresIn;
    private long resendAfter;
    private String message;
    private String totpSecret;
    private String qrUri;
    private boolean isNewSetup;

    public OtpResponse() {
    }

    public OtpResponse(String challengeId, long expiresIn, long resendAfter, String message) {
        this.challengeId = challengeId;
        this.expiresIn = expiresIn;
        this.resendAfter = resendAfter;
        this.message = message;
    }

    public OtpResponse(String challengeId, long expiresIn, long resendAfter, String message,
                       String totpSecret, String qrUri, boolean isNewSetup) {
        this.challengeId = challengeId;
        this.expiresIn = expiresIn;
        this.resendAfter = resendAfter;
        this.message = message;
        this.totpSecret = totpSecret;
        this.qrUri = qrUri;
        this.isNewSetup = isNewSetup;
    }

    public String getTotpSecret() {
        return totpSecret;
    }

    public void setTotpSecret(String totpSecret) {
        this.totpSecret = totpSecret;
    }

    public String getQrUri() {
        return qrUri;
    }

    public void setQrUri(String qrUri) {
        this.qrUri = qrUri;
    }

    public boolean isNewSetup() {
        return isNewSetup;
    }

    public void setNewSetup(boolean newSetup) {
        isNewSetup = newSetup;
    }

    public String getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(String challengeId) {
        this.challengeId = challengeId;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public long getResendAfter() {
        return resendAfter;
    }

    public void setResendAfter(long resendAfter) {
        this.resendAfter = resendAfter;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
