package com.rishikesh.chat.config;

//JAVA BUILT-IN IMPORTS TO DECODE SECRET KEY AND CREATE CYRPTROGRAPHIC SIGNING KEY 
import java.util.Base64; //Base64 converts binary data into readable text
import javax.crypto.SecretKey; //it represents a cryptographic secret key 
import javax.crypto.spec.SecretKeySpec; // created a key object from raw bytes 

//SPRING FRAMEWORK & SPRING SECURITY IMPORTS
import org.springframework.beans.factory.annotation.Value; //reads jwt secret form applciaiton properties and injects into class
import org.springframework.context.annotation.Bean; //tells spring bt to create and manage the object returned by a method 
import org.springframework.context.annotation.Configuration; //tells spring boot that this class contains configuration and bean definitions 
import org.springframework.security.oauth2.jose.jws.MacAlgorithm; //specifies cyrptographic algorithm use to sign JWTs ,here HS256
import org.springframework.security.oauth2.jwt.JwtDecoder;//decode and validate incoming JWTs
import org.springframework.security.oauth2.jwt.JwtEncoder;//spring security used to create and sign jwts 
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;//implementation provider to verify jwt signatures using our secret key
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;//implementation to generate and signs JWTs using our secret key 

@Configuration
public class JwtConfig {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // converts base64 secret into a signing key
    @Bean
    public SecretKey jwtSecretKey() {
        byte[] decodedKey = Base64.getDecoder().decode(jwtSecret);

        if (decodedKey.length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 bytes");
        }

        return new SecretKeySpec(decodedKey, "HmacSHA256");

    }

    // used to generate JWT tokens
    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return NimbusJwtEncoder
                .withSecretKey(jwtSecretKey)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    // used to validate incoming JWT tokens
    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder
                .withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)  //tells Spring which mac algorithm to acccept when verifying an incoming JWT
                .build();
    }

}
