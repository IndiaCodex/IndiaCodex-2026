package com.medichain.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${medichain.jwt.secret}")
    private String jwtSecret;

    @Value("${medichain.jwt.expiry-ms}")
    private long jwtExpiryMs;

    @Value("${medichain.jwt.refresh-expiry-ms}")
    private long refreshExpiryMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String walletAddress, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                    "walletAddress", walletAddress,
                    "role", role,
                    "type", "ACCESS"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiryMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of("type", "REFRESH"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiryMs))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims validateAndExtract(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndExtract(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String extractUserId(String token) {
        return validateAndExtract(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) validateAndExtract(token).get("role");
    }

    public String extractWalletAddress(String token) {
        return (String) validateAndExtract(token).get("walletAddress");
    }
}
