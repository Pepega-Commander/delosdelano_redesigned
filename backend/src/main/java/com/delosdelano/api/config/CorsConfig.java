package com.delosdelano.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String configuredOrigins) {
        List<String> origins = Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .map(this::validateOrigin)
                .distinct()
                .toList();
        if (origins.isEmpty()) {
            throw new IllegalStateException("APP_CORS_ALLOWED_ORIGINS must contain at least one exact origin");
        }

        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(origins);
        cors.setAllowedMethods(List.of("GET", "POST", "PATCH", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setAllowCredentials(false);
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    private String validateOrigin(String origin) {
        if (origin.contains("*")) {
            throw new IllegalStateException("APP_CORS_ALLOWED_ORIGINS must use exact origins, not wildcards");
        }
        try {
            URI uri = URI.create(origin);
            boolean http = "http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme());
            boolean originOnly = uri.getHost() != null
                    && (uri.getRawPath() == null || uri.getRawPath().isEmpty())
                    && uri.getRawQuery() == null
                    && uri.getRawFragment() == null
                    && uri.getUserInfo() == null;
            if (!http || !originOnly) {
                throw new IllegalArgumentException();
            }
            return origin;
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "APP_CORS_ALLOWED_ORIGINS entries must be exact http(s) origins without paths", exception);
        }
    }
}
