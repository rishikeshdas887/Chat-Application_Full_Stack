
//this file used the bean provided  JWT encoder fro jwtCONfig 
package com.rishikesh.chat.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.jwt.JwtEncoder;//defines JWT header information and includes the signing algorithm inside it 
import org.springframework.security.oauth2.jose.jws.MacAlgorithm; //specifying the signing algorithm
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;//defines JWT payload containing user ID,username , issue time, expiry team
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;//Combines the JWT header and claims and passes them to JwtEncoder for token generation.

@Service
public class JwtTokenService {
    private final JwtEncoder jwtEncoder;

    public JwtTokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    private static final long EXPIRATION_SECONDS = 3600;

    public String generateToken(Long userId, String username) {

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(EXPIRATION_SECONDS))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        JwtEncoderParameters parameters = JwtEncoderParameters.from(header, claims);

        return jwtEncoder.encode(parameters).getTokenValue();
    }
}
