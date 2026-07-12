package com.medichain.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", "test_secret_key_that_is_at_least_256_bits_long_for_testing_purposes_only");
        ReflectionTestUtils.setField(tokenProvider, "jwtExpiryMs", 86400000L);
        ReflectionTestUtils.setField(tokenProvider, "refreshExpiryMs", 604800000L);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        String token = tokenProvider.generateToken(userId, "addr1qx_test", "PATIENT");
        assertThat(tokenProvider.isTokenValid(token)).isTrue();
        assertThat(tokenProvider.extractUserId(token)).isEqualTo(userId.toString());
        assertThat(tokenProvider.extractRole(token)).isEqualTo("PATIENT");
        assertThat(tokenProvider.extractWalletAddress(token)).isEqualTo("addr1qx_test");
    }

    @Test
    void shouldRejectInvalidToken() {
        assertThat(tokenProvider.isTokenValid("invalid.token.here")).isFalse();
        assertThat(tokenProvider.isTokenValid("")).isFalse();
        assertThat(tokenProvider.isTokenValid(null)).isFalse();
    }

    @Test
    void shouldGenerateRefreshToken() {
        String refreshToken = tokenProvider.generateRefreshToken(userId);
        assertThat(tokenProvider.isTokenValid(refreshToken)).isTrue();
        assertThat(tokenProvider.extractUserId(refreshToken)).isEqualTo(userId.toString());
    }
}
