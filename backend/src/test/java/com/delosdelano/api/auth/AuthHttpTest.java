package com.delosdelano.api.auth;

import com.delosdelano.api.user.User;
import com.delosdelano.api.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Real embedded Tomcat and HTTP, real auth/security/JWT; only persistence is mocked.
// No database connections or migrations, and no credentials/tokens in test output.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration",
        "spring.main.banner-mode=off", "debug=false", "trace=false",
        "logging.level.root=OFF", "logging.level.org.springframework=OFF"
})
class AuthHttpTest {
    private static final String EMAIL = "auth-test@example.invalid";
    private static final String PASSWORD = UUID.randomUUID().toString();
    private static final String SIGNING_KEY = UUID.randomUUID().toString().repeat(2);
    private static final UUID USER_ID = UUID.randomUUID();

    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @MockitoBean UserRepository users;
    private User account;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @DynamicPropertySource
    static void configuration(DynamicPropertyRegistry properties) {
        properties.add("jwt.secret", () -> SIGNING_KEY);
        properties.add("jwt.expiration-days", () -> 7);
    }

    @BeforeEach
    void fixture() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail(EMAIL);
        user.setName("Test user");
        user.setPasswordHash(encoder.encode(PASSWORD));
        account = user;
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void currentProfileReturnsOnlySafeFieldsIncludingNullAvatar() throws Exception {
        assertProfile(send("GET", "/api/me", null, jwt.generateToken(USER_ID)),
                USER_ID, "Test user", EMAIL, null);
        verify(users).findById(USER_ID);
    }

    @Test
    void twoAccountsReceiveTheirOwnProfiles() throws Exception {
        UUID otherId = UUID.randomUUID();
        when(users.findById(otherId)).thenReturn(Optional.of(profileRow(otherId, "Other user", "other@example.invalid", "avatar-reference")));
        assertProfile(send("GET", "/api/me", null, jwt.generateToken(USER_ID)),
                USER_ID, "Test user", EMAIL, null);
        assertProfile(send("GET", "/api/me", null, jwt.generateToken(otherId)),
                otherId, "Other user", "other@example.invalid", "avatar-reference");
    }

    @Test
    void currentProfileRejectsMissingMalformedExpiredAndForgedTokens() throws Exception {
        assertError(send("GET", "/api/me", null, null), 401, "Неверная почта или пароль");
        for (String token : List.of("", "invalid", "not.a.jwt",
                expiredToken(USER_ID),
                new JwtService(UUID.randomUUID().toString().repeat(2), 7).generateToken(USER_ID))) {
            assertError(send("GET", "/api/me", null, token), 401, "Неверная почта или пароль");
        }
        verify(users, never()).findById(any());
    }

    @Test
    void validTokenForAbsentUserReturnsSafe401() throws Exception {
        UUID absentId = UUID.randomUUID();
        assertError(send("GET", "/api/me", null, jwt.generateToken(absentId)), 401, "Неверная почта или пароль");
        verify(users).findById(absentId);
    }

    @Test
    void queryParameterCannotSelectAnotherAccount() throws Exception {
        UUID otherId = UUID.randomUUID();
        assertProfile(send("GET", "/api/me?userId=" + otherId, null, jwt.generateToken(USER_ID)),
                USER_ID, "Test user", EMAIL, null);
        verify(users).findById(USER_ID);
        verify(users, never()).findById(otherId);
    }

    @Test
    void sameTokenReturnsCurrentRepositoryValuesOnEveryRequest() throws Exception {
        String token = jwt.generateToken(USER_ID);
        assertProfile(send("GET", "/api/me", null, token), USER_ID, "Test user", EMAIL, null);
        when(users.findById(USER_ID)).thenReturn(Optional.of(profileRow(USER_ID,
                "Updated profile", "updated@example.invalid", "updated-avatar")));
        assertProfile(send("GET", "/api/me", null, token), USER_ID,
                "Updated profile", "updated@example.invalid", "updated-avatar");
        verify(users, times(2)).findById(USER_ID);
    }

    @Test
    void patchNameTrimsAndPreservesOmittedAvatarAndUnrelatedFields() throws Exception {
        account.setAvatar("https://example.com/original.png");
        User before = copy(account);
        assertProfile(patch("/api/me", Map.of("name", "  Updated Name  "), jwt.generateToken(USER_ID)),
                USER_ID, "Updated Name", EMAIL, before.getAvatar());
        assertUnrelatedFields(account, before);
        verify(users).save(account);
        assertProfile(send("GET", "/api/me", null, jwt.generateToken(USER_ID)),
                USER_ID, "Updated Name", EMAIL, before.getAvatar());
    }

    @Test
    void patchAvatarPreservesOmittedNameAndUnrelatedFields() throws Exception {
        User before = copy(account);
        String avatar = "https://avatars.example.invalid/image?id=123";
        assertProfile(patch("/api/me", Map.of("avatar", avatar), jwt.generateToken(USER_ID)),
                USER_ID, before.getName(), EMAIL, avatar);
        assertUnrelatedFields(account, before);
        verify(users).save(account);
    }

    @Test
    void explicitNullAvatarRemovesIt() throws Exception {
        account.setAvatar("https://example.com/original.png");
        User before = copy(account);
        assertProfile(send("PATCH", "/api/me", "{\"avatar\":null}", jwt.generateToken(USER_ID)),
                USER_ID, before.getName(), EMAIL, null);
        assertUnrelatedFields(account, before);
        verify(users).save(account);
    }

    @Test
    void emptyPatchPreservesAllFieldsWithoutSaving() throws Exception {
        // Even an existing legacy representation is preserved when omitted.
        account.setAvatar("legacy-avatar-reference");
        User before = copy(account);
        assertProfile(patch("/api/me", Map.of(), jwt.generateToken(USER_ID)),
                USER_ID, before.getName(), EMAIL, before.getAvatar());
        assertUnrelatedFields(account, before);
        verify(users, never()).save(any());
    }

    @Test
    void patchAcceptsBothFieldsAtTheirLimits() throws Exception {
        String name = "n".repeat(60);
        String prefix = "https://example.com/";
        String avatar = prefix + "a".repeat(2048 - prefix.length());
        User before = copy(account);
        assertProfile(patch("/api/me", Map.of("name", " " + name + " ", "avatar", avatar), jwt.generateToken(USER_ID)),
                USER_ID, name, EMAIL, avatar);
        assertUnrelatedFields(account, before);
    }

    @Test
    void invalidPatchInputsRejectEntireUpdateBeforeLookupOrMutation() throws Exception {
        account.setAvatar("https://example.com/original.png");
        User before = copy(account);
        List<String> invalid = new ArrayList<>(List.of("{broken", "[]", "null", "true", "12", "\"text\"", "",
                "{} {}", "{\"name\":\"Should not be saved\"} trailing"));
        for (String name : List.of("null", "\"\"", "\"   \"", "\"\\u2003\"", "12", "true", "{}", "[]",
                json.writeValueAsString("n".repeat(61)))) {
            invalid.add("{\"name\":" + name + ",\"avatar\":\"https://example.com/valid.png\"}");
        }
        for (String avatar : List.of("", "   ", "http://example.com/a.png", "//example.com/a.png", "image.png",
                "javascript:alert(1)", "file:///tmp/image.png", "data:image/png;base64,AAAA", "ftp://example.com/a.png",
                "https://", "https:///a.png", "https://example.com/a b.png", " https://example.com/a.png",
                "https://user:password@example.com/a.png", "https://@example.com/a.png", "https://example.com:65536/a.png",
                "https://example.com/" + "a".repeat(2048))) {
            invalid.add(json.writeValueAsString(Map.of("name", "Should not be saved", "avatar", avatar)));
        }
        for (String avatar : List.of("12", "true", "{}", "[]")) {
            invalid.add("{\"name\":\"Should not be saved\",\"avatar\":" + avatar + "}");
        }
        for (String field : List.of("id", "userId", "email", "password", "passwordHash", "extra")) {
            invalid.add("{\"name\":\"Should not be saved\",\"avatar\":null,\"" + field + "\":null}");
        }
        String token = jwt.generateToken(USER_ID);
        for (String body : invalid) {
            assertError(send("PATCH", "/api/me", body, token), 400, "Некорректные данные запроса");
            assertTrue(before.getName().equals(account.getName()), "Invalid request must not partially change name");
            assertTrue(before.getAvatar().equals(account.getAvatar()), "Invalid request must not partially change avatar");
            assertUnrelatedFields(account, before);
        }
        verify(users, never()).findById(any());
        verify(users, never()).save(any());
    }

    @Test
    void patchOwnershipIgnoresQueryIdentityForBothAccounts() throws Exception {
        UUID otherId = UUID.randomUUID();
        User other = profileRow(otherId, "Other user", "other@example.invalid", "https://example.com/other.png");
        User before = copy(account);
        User otherBefore = copy(other);
        when(users.findById(otherId)).thenReturn(Optional.of(other));
        assertProfile(patch("/api/me?userId=" + otherId, Map.of("name", "First updated"), jwt.generateToken(USER_ID)),
                USER_ID, "First updated", EMAIL, null);
        assertTrue(otherBefore.getName().equals(other.getName()), "First account cannot change the other account");
        assertProfile(patch("/api/me?userId=" + USER_ID, Map.of("name", "Second updated"), jwt.generateToken(otherId)),
                otherId, "Second updated", other.getEmail(), other.getAvatar());
        assertTrue("First updated".equals(account.getName()), "Second account cannot change the first account");
        assertUnrelatedFields(account, before);
        assertUnrelatedFields(other, otherBefore);
        verify(users).save(account);
        verify(users).save(other);
    }

    @Test
    void patchRejectsMissingMalformedExpiredAndForgedCredentialsWithoutWriting() throws Exception {
        assertError(patch("/api/me", Map.of("name", "Updated"), null), 401, "Неверная почта или пароль");
        for (String token : List.of("", "invalid", "not.a.jwt",
                expiredToken(USER_ID),
                new JwtService(UUID.randomUUID().toString().repeat(2), 7).generateToken(USER_ID))) {
            assertError(patch("/api/me", Map.of("name", "Updated"), token), 401, "Неверная почта или пароль");
        }
        verify(users, never()).findById(any());
        verify(users, never()).save(any());
    }

    @Test
    void patchForAbsentAuthenticatedUserReturnsSafe401() throws Exception {
        UUID absentId = UUID.randomUUID();
        assertError(patch("/api/me", Map.of("name", "Updated"), jwt.generateToken(absentId)), 401, "Неверная почта или пароль");
        verify(users).findById(absentId);
        verify(users, never()).save(any());
    }

    private HttpResponse<String> patch(String path, Object body, String token) throws Exception {
        return send("PATCH", path, json.writeValueAsString(body), token);
    }

    private String expiredToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(Date.from(now.minus(Duration.ofDays(2))))
                .expiration(Date.from(now.minus(Duration.ofDays(1))))
                .signWith(Keys.hmacShaKeyFor(SIGNING_KEY.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private User copy(User source) {
        User copy = profileRow(source.getId(), source.getName(), source.getEmail(), source.getAvatar());
        copy.setPasswordHash(source.getPasswordHash());
        copy.setCreatedAt(source.getCreatedAt());
        return copy;
    }

    private void assertUnrelatedFields(User actual, User before) {
        assertTrue(before.getId().equals(actual.getId()), "UUID must be preserved");
        assertTrue(before.getEmail().equals(actual.getEmail()), "Email must be preserved");
        assertTrue(before.getPasswordHash().equals(actual.getPasswordHash()), "Password hash must be preserved");
        assertTrue(before.getCreatedAt().equals(actual.getCreatedAt()), "Creation time must be preserved");
    }

    private User profileRow(UUID id, String name, String email, String avatar) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(email);
        user.setAvatar(avatar);
        user.setPasswordHash("must-never-appear-in-profile");
        return user;
    }

    private void assertProfile(HttpResponse<String> response, UUID id, String name, String email, String avatar) throws Exception {
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type").orElse("")).startsWith("application/json");
        JsonNode body = json.readTree(response.body());
        assertThat(body.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("id", "name", "email", "avatar");
        assertTrue(id.toString().equals(body.path("id").asText()), "Profile must belong to authenticated user");
        assertTrue(name.equals(body.path("name").asText()), "Profile must use repository name");
        assertTrue(email.equals(body.path("email").asText()), "Profile must use repository email");
        if (avatar == null) {
            assertTrue(body.path("avatar").isNull(), "Missing avatar must be explicit JSON null");
        } else {
            assertTrue(avatar.equals(body.path("avatar").asText()), "Profile must use repository avatar");
        }
    }

    private HttpResponse<String> send(String method, String path, String body, String token) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private void assertError(HttpResponse<String> response, int status, String message) throws Exception {
        assertThat(response.statusCode()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type").orElse("")).startsWith("application/json");
        JsonNode body = json.readTree(response.body());
        assertThat(body.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("status", "message");
        assertThat(body.path("status").asInt()).isEqualTo(status);
        assertTrue(message.equals(body.path("message").asText()), "Error must contain only the agreed safe message");
    }


}

}
