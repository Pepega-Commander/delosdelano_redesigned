package com.delosdelano.api.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationDays;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-days}") long expirationDays) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is required and must not be blank");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 UTF-8 bytes for HMAC-SHA JWT signing");
        }
        if (expirationDays <= 0) {
            throw new IllegalStateException("JWT_EXPIRATION_DAYS must be a positive number of days");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationDays = expirationDays;
    }

    public String generateToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + Duration.ofDays(expirationDays).toMillis());
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        String subject = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return UUID.fromString(subject);
    }
}