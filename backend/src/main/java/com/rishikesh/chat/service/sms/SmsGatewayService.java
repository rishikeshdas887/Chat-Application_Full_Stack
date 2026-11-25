package com.rishikesh.chat.service.sms;

import com.rishikesh.chat.exception.SmsDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class SmsGatewayService implements SmsService {

    private static final Logger logger = LoggerFactory.getLogger(SmsGatewayService.class);
    private final HttpClient httpClient;

    @Value("${app.sms.twilio.account-sid:${TWILIO_ACCOUNT_SID:}}")
    private String twilioAccountSid;

    @Value("${app.sms.twilio.auth-token:${TWILIO_AUTH_TOKEN:}}")
    private String twilioAuthToken;

    @Value("${app.sms.twilio.phone-number:${TWILIO_PHONE_NUMBER:}}")
    private String twilioPhoneNumber;

    public SmsGatewayService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public SmsGatewayService(HttpClient httpClient, String twilioAccountSid,
                             String twilioAuthToken, String twilioPhoneNumber) {
        this.httpClient = httpClient;
        this.twilioAccountSid = twilioAccountSid;
        this.twilioAuthToken = twilioAuthToken;
        this.twilioPhoneNumber = twilioPhoneNumber;
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        String maskedPhone = maskPhoneNumber(phoneNumber);

        // Twilio Integration (Optional)
        if (twilioAccountSid != null && !twilioAccountSid.trim().isEmpty() &&
            twilioAuthToken != null && !twilioAuthToken.trim().isEmpty() &&
            twilioPhoneNumber != null && !twilioPhoneNumber.trim().isEmpty()) {
            sendViaTwilio(phoneNumber, otp, maskedPhone);
            return;
        }

        logger.info("[Authenticator Gateway] Primary authentication is TOTP Authenticator (RFC 6238). Generated code for {}: {}", maskedPhone, otp);
    }

    private void sendViaTwilio(String phoneNumber, String otp, String maskedPhone) {
        try {
            String twilioUrl = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
                    twilioAccountSid.trim());

            String messageBody = "Your SyncPulse verification code is: " + otp + ". Valid for 10 minutes.";
            String formData = "To=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8) +
                    "&From=" + URLEncoder.encode(twilioPhoneNumber.trim(), StandardCharsets.UTF_8) +
                    "&Body=" + URLEncoder.encode(messageBody, StandardCharsets.UTF_8);

            String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                    (twilioAccountSid.trim() + ":" + twilioAuthToken.trim()).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(twilioUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formData))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("[SMS Gateway] Successfully dispatched OTP via Twilio to {}", maskedPhone);
            } else {
                logger.error("[SMS Gateway] Twilio returned status {}: {}", response.statusCode(), response.body());
                throw new SmsDeliveryException("Twilio SMS delivery failed with status " + response.statusCode());
            }
        } catch (SmsDeliveryException e) {
            throw e;
        } catch (Exception e) {
            logger.error("[SMS Gateway] Exception during Twilio dispatch to {}: {}", maskedPhone, e.getMessage());
            throw new SmsDeliveryException("Twilio SMS transmission failed: " + e.getMessage());
        }
    }

    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 6) {
            return "***";
        }
        int len = phoneNumber.length();
        String prefix = phoneNumber.substring(0, Math.min(3, len));
        String suffix = phoneNumber.substring(Math.max(0, len - 4));
        return prefix + "*****" + suffix;
    }
}
