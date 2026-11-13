package com.delosdelano.api.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import javax.sql.DataSource;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Opt-in: creates and retains one disposable account; never updates existing accounts. */
@EnabledIfSystemProperty(named = "verify.postgres.patch", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=validate",
        "spring.main.banner-mode=off", "debug=false", "trace=false",
        "logging.level.root=OFF", "logging.level.org.springframework=OFF", "logging.level.org.hibernate=OFF"
})
class UserProfilePatchPostgresTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired DataSource dataSource;

    @Test
    void disposableAccountPatchPersistsAndInvalidPatchLeavesItUnchanged() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("PostgreSQL");
        }
        try (HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var registration = send(http, "POST", "/api/auth/register", json.writeValueAsString(Map.of(
                    "email", "patch-verification-" + UUID.randomUUID() + "@example.invalid",
                    "password", UUID.randomUUID().toString(), "name", "Disposable PATCH verification")), null);
            assertThat(registration.statusCode()).isEqualTo(200);
            JsonNode registered = json.readTree(registration.body());
            UUID id = UUID.fromString(registered.path("user").path("id").asText());
            String token = registered.path("token").asText();
            User before = users.findById(id).orElseThrow();

            String update = json.writeValueAsString(Map.of("name", "  Updated disposable account  ",
                    "avatar", "https://example.com/avatar.png"));
            var patched = send(http, "PATCH", "/api/me?userId=" + UUID.randomUUID(), update, token);
            assertThat(patched.statusCode()).isEqualTo(200);
            JsonNode profile = safeProfile(patched);
            assertTrue(id.toString().equals(profile.path("id").asText()), "PATCH must select only the authenticated fixture");
            assertTrue("Updated disposable account".equals(profile.path("name").asText()), "Name must be trimmed");
            assertTrue("https://example.com/avatar.png".equals(profile.path("avatar").asText()), "Avatar reference must be saved");
            assertTrue(profile.equals(safeProfile(send(http, "GET", "/api/me", null, token))), "GET must reflect committed PATCH");
            User after = users.findById(id).orElseThrow();
            assertTrue(after.getName().equals(profile.path("name").asText()), "PostgreSQL name must match PATCH");
            assertTrue(after.getAvatar().equals(profile.path("avatar").asText()), "PostgreSQL avatar must match PATCH");
            assertUnrelatedFields(after, before);

            var invalid = send(http, "PATCH", "/api/me", "{\"name\":\"Must not be saved\",\"avatar\":\"data:image/png;base64,AAAA\"}", token);
            assertThat(invalid.statusCode()).isEqualTo(400);
            JsonNode error = json.readTree(invalid.body());
            assertThat(error.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("status", "message");
            assertTrue(error.path("status").asInt() == 400
                    && "Некорректные данные запроса".equals(error.path("message").asText()), "Expected safe 400 JSON");
            assertTrue(profile.equals(safeProfile(send(http, "GET", "/api/me", null, token))), "Invalid PATCH must not persist partial changes");

            var removed = safeProfile(send(http, "PATCH", "/api/me", "{\"avatar\":null}", token));
            assertTrue(removed.path("avatar").isNull(), "Explicit null must remove avatar");
            assertTrue(profile.path("name").equals(removed.path("name")), "Omitted name must be preserved");
            assertTrue(removed.equals(safeProfile(send(http, "GET", "/api/me", null, token))), "Avatar removal must persist");
            assertTrue(removed.equals(safeProfile(send(http, "PATCH", "/api/me", "{}", token))), "Empty PATCH must preserve profile");
            User finalRow = users.findById(id).orElseThrow();
            assertTrue(finalRow.getAvatar() == null, "PostgreSQL avatar must be null after removal");
            assertUnrelatedFields(finalRow, before);
        }
    }

    private void assertUnrelatedFields(User actual, User before) {
        assertTrue(before.getId().equals(actual.getId()), "UUID must be preserved");
        assertTrue(before.getEmail().equals(actual.getEmail()), "Email must be preserved");
        assertTrue(before.getPasswordHash().equals(actual.getPasswordHash()), "Password hash must be preserved");
        assertTrue(before.getCreatedAt().equals(actual.getCreatedAt()), "Creation time must be preserved");
    }

    private JsonNode safeProfile(HttpResponse<String> response) throws Exception {
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type").orElse("")).startsWith("application/json");
        JsonNode profile = json.readTree(response.body());
        assertThat(profile.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("id", "name", "email", "avatar");
        return profile;
    }

    private HttpResponse<String> send(HttpClient http, String method, String path, String body, String token) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
