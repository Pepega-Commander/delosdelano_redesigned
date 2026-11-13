package com.delosdelano.api.auth;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceConfigurationTest {

    @Test
    void validExternalConfigurationCreatesUsableTokens() {
        JwtService jwt = new JwtService(UUID.randomUUID().toString(), 7);
        UUID userId = UUID.randomUUID();

        assertThat(jwt.extractUserId(jwt.generateToken(userId))).isEqualTo(userId);
    }

    @Test
    void blankSigningSecretFailsClearly() {
        assertThatThrownBy(() -> new JwtService(" ", 7))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("required");
    }

    @Test
    void signingSecretShorterThanHs256MinimumFailsClearly() {
        assertThatThrownBy(() -> new JwtService("short-secret", 7))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("32 UTF-8 bytes");
    }


    @Test
    void nonPositiveLifetimeFailsClearly() {
        assertThatThrownBy(() -> new JwtService(UUID.randomUUID().toString(), 0))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_EXPIRATION_DAYS")
                .hasMessageContaining("positive");
    }

}
