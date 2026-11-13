package com.delosdelano.api.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

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

/** Opt-in: changes only a newly created disposable account, which is retained. */
@EnabledIfSystemProperty(named = "verify.postgres.password", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=validate",
        "spring.main.banner-mode=off", "debug=false", "trace=false",
        "logging.level.root=OFF", "logging.level.org.springframework=OFF", "logging.level.org.hibernate=OFF"
})
class UserPasswordPostgresTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired DataSource dataSource;

    @Test
    void disposableAccountPasswordChangePersistsAndOldJwtRemainsValid() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("PostgreSQL");
        }
        String email = "password-verification-" + UUID.randomUUID() + "@example.invalid";
        String oldPassword = UUID.randomUUID().toString();
        String newPassword = " New-" + UUID.randomUUID() + " ";
        try (HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var registration = send(http, "POST", "/api/auth/register", Map.of(
                    "email", email, "password", oldPassword, "name", "Disposable password verification"), null);
            assertThat(registration.statusCode()).isEqualTo(200);
            JsonNode registered = json.readTree(registration.body());
            UUID id = UUID.fromString(registered.path("user").path("id").asText());
            String oldToken = registered.path("token").asText();
            User before = users.findById(id).orElseThrow();
            var wrongCurrent = send(http, "PATCH", "/api/me/password", Map.of(
                    "currentPassword", "incorrect", "newPassword", newPassword), oldToken);
            assertError(wrongCurrent, 400);
            assertTrue(before.getPasswordHash().equals(users.findById(id).orElseThrow().getPasswordHash()),
                    "Rejected change must preserve the stored hash");

            var changed = send(http, "PATCH", "/api/me/password?userId=" + UUID.randomUUID(), Map.of(
                    "currentPassword", oldPassword, "newPassword", newPassword), oldToken);
            assertThat(changed.statusCode()).isEqualTo(204);
            assertTrue(changed.body().isEmpty(), "Success must not return credentials, hashes, or a token");
            User after = users.findById(id).orElseThrow();
            assertTrue(after.getPasswordHash().matches("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}"), "Database must contain a BCrypt hash");
            assertTrue(!newPassword.equals(after.getPasswordHash()), "Plaintext must not be stored");
            assertTrue(encoder.matches(newPassword, after.getPasswordHash()), "Exact new password must verify");
            assertTrue(!encoder.matches(oldPassword, after.getPasswordHash()), "Old password must no longer verify");
            assertTrue(before.getId().equals(after.getId()) && before.getEmail().equals(after.getEmail())
                    && before.getName().equals(after.getName()) && Objects.equals(before.getAvatar(), after.getAvatar())
                    && before.getCreatedAt().equals(after.getCreatedAt()), "Unrelated profile fields must remain unchanged");

            assertError(send(http, "POST", "/api/auth/login", Map.of("email", email, "password", oldPassword), null), 401);
            var login = send(http, "POST", "/api/auth/login", Map.of("email", email, "password", newPassword), null);
            assertThat(login.statusCode()).isEqualTo(200);
            JsonNode loggedIn = json.readTree(login.body());
            assertTrue(id.toString().equals(loggedIn.path("user").path("id").asText())
                    && !loggedIn.path("token").asText().isEmpty(), "New credentials must log into the same account");

            var profile = send(http, "GET", "/api/me", null, oldToken);
            assertThat(profile.statusCode()).isEqualTo(200);
            assertTrue(id.toString().equals(json.readTree(profile.body()).path("id").asText()),
                    "Previously issued JWT must remain valid after password change");
            assertError(send(http, "PATCH", "/api/me/password", Map.of(
                    "currentPassword", newPassword, "newPassword", newPassword), oldToken), 400);
            assertTrue(after.getPasswordHash().equals(users.findById(id).orElseThrow().getPasswordHash()),
                    "Unchanged password rejection must preserve the new hash");
        }
    }

    private void assertError(HttpResponse<String> response, int status) throws Exception {
        assertThat(response.statusCode()).isEqualTo(status);
        JsonNode error = json.readTree(response.body());
        assertThat(error.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("status", "message");
        String message = status == 400 ? "Некорректные данные запроса" : "Неверная почта или пароль";
        assertTrue(error.path("status").asInt() == status && message.equals(error.path("message").asText()), "Expected safe error JSON");
    }

    private HttpResponse<String> send(HttpClient http, String method, String path, Object body, String token) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
