package com.rishikesh.chat.exception;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.LinkedHashMap;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateResource(
            DuplicateResourceException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Number Already Present in Database"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenActionException.class)
    public ResponseEntity<Map<String, String>> handleForbiddenAction(
            ForbiddenActionException ex) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error -> errors.putIfAbsent(
                error.getField(),
                error.getDefaultMessage()));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errors);
    } // this handles the error of register user request @NotBlank , @Size , @Pattern

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDatabaseConstraint(
            DataIntegrityViolationException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Database Constraint Violated"));
    }

    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(
            org.springframework.security.authentication.BadCredentialsException ex) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleRateLimitExceeded(
            RateLimitExceededException ex) {

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(SmsDeliveryException.class)
    public ResponseEntity<Map<String, String>> handleSmsDeliveryException(
            SmsDeliveryException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage()));
    }

}
