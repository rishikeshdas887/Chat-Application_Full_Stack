package com.rishikesh.chat.exception;

public class SmsDeliveryException extends RuntimeException {
    public SmsDeliveryException(String message) {
        super(message);
    }
}
