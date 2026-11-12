package com.delosdelano.api.user;

import com.delosdelano.api.auth.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.domain.PageRequest;

import javax.sql.DataSource;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Opt-in, read-only HTTP verification using the configured PostgreSQL and an existing account. */
@EnabledIfSystemProperty(named = "verify.postgres", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=validate",
        "spring.main.banner-mode=off", "debug=false", "trace=false",
        "logging.level.root=OFF", "logging.level.org.springframework=OFF",
        "logging.level.org.hibernate=OFF"
})
class UserProfilePostgresTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired ObjectMapper json;
    @Autowired DataSource dataSource;

    @Test
    void existingPostgresAccountIsReturnedOverHttpWithoutWritingRecords() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("PostgreSQL");
        }
        User existing = users.findAll(PageRequest.of(0, 1)).stream().findFirst()
                .orElseThrow(() -> new AssertionError("Live verification requires an existing development account"));
        // Sign in memory through the real service: no need to read or change an account password.
        String token = jwt.generateToken(existing.getId());
        try (HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var response = get(http, "/api/me", token);
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.headers().firstValue("Content-Type").orElse("")).startsWith("application/json");
            JsonNode profile = json.readTree(response.body());
            assertThat(profile.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("id", "name", "email", "avatar");
            assertTrue(existing.getId().toString().equals(profile.path("id").asText()), "Profile UUID must match PostgreSQL");
            assertTrue(existing.getName().equals(profile.path("name").asText()), "Profile name must match PostgreSQL");
            assertTrue(existing.getEmail().equals(profile.path("email").asText()), "Profile email must match PostgreSQL");
            assertTrue(Objects.equals(existing.getAvatar(), profile.path("avatar").isNull() ? null : profile.path("avatar").asText()),
                    "Profile avatar must match PostgreSQL, including explicit null");
            var query = get(http, "/api/me?userId=" + UUID.randomUUID(), token);
            assertThat(query.statusCode()).isEqualTo(200);
            assertTrue(profile.equals(json.readTree(query.body())), "Query parameter cannot change the selected profile");
            for (String credential : new String[]{null, "invalid"}) {
                var rejected = get(http, "/api/me", credential);
                assertThat(rejected.statusCode()).isEqualTo(401);
                JsonNode error = json.readTree(rejected.body());
                assertThat(error.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("status", "message");
                assertThat(error.path("status").asInt()).isEqualTo(401);
                assertTrue("Неверная почта или пароль".equals(error.path("message").asText()), "Expected safe authentication message");
            }
        }
    }

    private HttpResponse<String> get(HttpClient http, String path, String token) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).GET();
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
