package com.delosdelano.api.auth;

import com.delosdelano.api.common.ErrorResponse;
import com.delosdelano.api.user.User;
import com.delosdelano.api.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.Filter;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.Ordered;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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
import java.util.concurrent.ConcurrentLinkedQueue;

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
@Import(AuthHttpTest.Probes.class)
class AuthHttpTest {
    private static final String EMAIL = "auth-test@example.invalid";
    private static final String PASSWORD = UUID.randomUUID().toString();
    private static final String SIGNING_KEY = UUID.randomUUID().toString().repeat(2);
    private static final String ALLOWED_ORIGIN = "http://localhost:8080";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final ConcurrentLinkedQueue<String> DISPATCHES = new ConcurrentLinkedQueue<>();

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
        properties.add("app.cors.allowed-origins", () -> ALLOWED_ORIGIN);
    }

    @BeforeEach
    void fixture() {
        DISPATCHES.clear();
        User user = new User();
        user.setId(USER_ID);
        user.setEmail(EMAIL);
        user.setName("Test user");
        user.setPasswordHash(encoder.encode(PASSWORD));
        account = user;
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(users.existsByEmail(EMAIL)).thenReturn(true);
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void allowedOriginKeepsProtectedRequestJson401WithoutToken() throws Exception {
        var response = send("GET", "/api/me", null, null, Map.of("Origin", ALLOWED_ORIGIN));

        assertError(response, 401, ErrorResponse.forStatus(HttpStatus.UNAUTHORIZED).message());
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).contains(ALLOWED_ORIGIN);
        assertThat(response.headers().firstValue("Access-Control-Allow-Credentials")).isEmpty();
    }

    @Test
    void unlistedOriginIsRejectedWithoutCorsPermission() throws Exception {
        var response = send("GET", "/api/me", null, null,
                Map.of("Origin", "http://127.0.0.1:8080"));

        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
    }

    @Test
    void allowedPatchPreflightSucceedsWithoutJwt() throws Exception {
        var response = send("OPTIONS", "/api/me", null, null, Map.of(
                "Origin", ALLOWED_ORIGIN,
                "Access-Control-Request-Method", "PATCH",
                "Access-Control-Request-Headers", "Authorization, Content-Type"));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).contains(ALLOWED_ORIGIN);
        assertThat(response.headers().firstValue("Access-Control-Allow-Methods").orElse("")).contains("PATCH");
        String allowedHeaders = response.headers().firstValue("Access-Control-Allow-Headers").orElse("").toLowerCase();
        assertThat(allowedHeaders).contains("authorization", "content-type");
        assertThat(response.headers().firstValue("Access-Control-Allow-Credentials")).isEmpty();
    }

    @Test
    void incorrectPasswordAndUnknownEmailReturnSame401WithoutErrorDispatch() throws Exception {
        var wrong = post("/api/auth/login", Map.of("email", EMAIL, "password", "wrong-password"));
        assertError(wrong, 401, "Неверная почта или пароль");
        var unknown = post("/api/auth/login", Map.of("email", "unknown@example.invalid", "password", "wrong-password"));
        assertError(unknown, 401, "Неверная почта или пароль");
        assertTrue(wrong.body().equals(unknown.body()), "Both failures must have identical JSON");
        assertThat(DISPATCHES).noneMatch(s -> s.startsWith("ERROR"));
    }

    @Test
    void duplicateRegistrationReturns409() throws Exception {
        assertError(post("/api/auth/register", registration(EMAIL)), 409, "Email уже зарегистрирован");
        verify(users, never()).save(any());
    }

    @Test
    void duplicateRaceReturns409() throws Exception {
        when(users.existsByEmail(EMAIL)).thenReturn(false, true);
        when(users.save(any())).thenThrow(new DataIntegrityViolationException("internal database detail"));
        assertError(post("/api/auth/register", registration(EMAIL)), 409, "Email уже зарегистрирован");
    }

    @Test
    void invalidRegistrationReturns400WithoutSaving() throws Exception {
        for (var input : List.of(
                Map.of("email", "invalid", "password", PASSWORD, "name", "Test"),
                Map.of("email", "new@example.invalid", "password", "short", "name", "Test"),
                Map.of("email", "new@example.invalid", "password", PASSWORD, "name", " "))) {
            assertError(post("/api/auth/register", input), 400, "Некорректные данные запроса");
        }
        verify(users, never()).save(any());
    }

    @Test
    void malformedJsonReturnsSafe400() throws Exception {
        assertError(send("POST", "/api/auth/register", "{broken", null), 400, "Некорректные данные запроса");
    }

    @Test
    void successfulLoginKeeps200AndSafeUserWithValidToken() throws Exception {
        assertSuccess(post("/api/auth/login", Map.of("email", EMAIL, "password", PASSWORD)), USER_ID);
    }

    @Test
    void successfulRegistrationKeeps200AndHashesPassword() throws Exception {
        UUID id = UUID.randomUUID();
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            assertTrue(!PASSWORD.equals(saved.getPasswordHash()), "Password must not be stored in plaintext");
            assertTrue(encoder.matches(PASSWORD, saved.getPasswordHash()), "Stored hash must verify");
            saved.setId(id);
            return saved;
        });
        assertSuccess(post("/api/auth/register", registration("new@example.invalid")), id);
    }

    @Test
    void privateEndpointAndNormalErrorRequestsRemainProtected() throws Exception {
        for (String path : List.of("/test/protected", "/api/private", "/error")) {
            assertError(send("GET", path, null, null), 401, "Неверная почта или пароль");
        }
        assertError(send("GET", "/test/protected", null, "invalid"), 401, "Неверная почта или пароль");
        String expired = expiredToken(USER_ID);
        assertError(send("GET", "/test/protected", null, expired), 401, "Неверная почта или пароль");
        String forged = new JwtService(UUID.randomUUID().toString().repeat(2), 7).generateToken(USER_ID);
        assertError(send("GET", "/test/protected", null, forged), 401, "Неверная почта или пароль");
        assertThat(send("GET", "/test/protected", null, jwt.generateToken(USER_ID)).statusCode()).isEqualTo(200);
    }

    @Test
    void authenticatedAccessDenialReturnsSafe403() throws Exception {
        assertError(send("GET", "/test/forbidden", null, jwt.generateToken(USER_ID)), 403, "Доступ запрещён");
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

    @Test
    void passwordChangeReturnsEmpty204AndUpdatesHashAndLoginWhileKeepingJwtValid() throws Exception {
        account.setAvatar("https://example.com/avatar.png");
        User before = copy(account);
        String next = "New-" + UUID.randomUUID();
        String token = jwt.generateToken(USER_ID);
        assertNoContent(changePassword(PASSWORD, next, token));
        assertTrue(!before.getPasswordHash().equals(account.getPasswordHash()), "Password hash must change");
        assertTrue(!next.equals(account.getPasswordHash()), "Only a hash may be saved");
        assertTrue(encoder.matches(next, account.getPasswordHash()), "New password must verify");
        assertTrue(!encoder.matches(PASSWORD, account.getPasswordHash()), "Old password must no longer verify");
        assertProfileFieldsPreserved(account, before);
        verify(users).save(account);
        assertError(post("/api/auth/login", Map.of("email", EMAIL, "password", PASSWORD)), 401, "Неверная почта или пароль");
        assertSuccess(post("/api/auth/login", Map.of("email", EMAIL, "password", next)), USER_ID);
        assertProfile(send("GET", "/api/me", null, token), USER_ID, before.getName(), EMAIL, before.getAvatar());
    }

    @Test
    void passwordChangePreservesWhitespaceCaseAndUnicodeRepresentation() throws Exception {
        String next = "  Cafe\u0301-" + UUID.randomUUID() + "  ";
        assertNoContent(changePassword(PASSWORD, next, jwt.generateToken(USER_ID)));
        assertTrue(encoder.matches(next, account.getPasswordHash()), "Exact unmodified password must verify");
        assertTrue(!encoder.matches(next.strip(), account.getPasswordHash()), "Whitespace must not be stripped");
        assertTrue(!encoder.matches(next.toLowerCase(java.util.Locale.ROOT), account.getPasswordHash()), "Case must not be folded");
        assertTrue(!encoder.matches(java.text.Normalizer.normalize(next, java.text.Normalizer.Form.NFC), account.getPasswordHash()),
                "Unicode must not be normalized");
    }

    @Test
    void legacyCurrentPasswordsDoNotUseNewPasswordPolicy() throws Exception {
        String token = jwt.generateToken(USER_ID);
        for (String current : List.of("x", " ", "x".repeat(80))) {
            // Older BCrypt versions allowed >72-byte inputs and used their first 72 bytes.
            account.setPasswordHash(encoder.encode(current.length() > 72 ? current.substring(0, 72) : current));
            String next = "New-" + UUID.randomUUID();
            assertNoContent(changePassword(current, next, token));
            assertTrue(encoder.matches(next, account.getPasswordHash()), "Valid legacy credential must allow changing password");
        }
    }

    @Test
    void incorrectCurrentPasswordReturns400WithoutChanges() throws Exception {
        User before = copy(account);
        for (String current : List.of("wrong", "wrong-".repeat(20))) {
            assertError(changePassword(current, "New-" + UUID.randomUUID(), jwt.generateToken(USER_ID)), 400, "Некорректные данные запроса");
            assertUnrelatedFields(account, before);
            assertProfileFieldsPreserved(account, before);
        }
        verify(users, never()).save(any());
    }

    @Test
    void reusingStoredPasswordIsRejectedWithoutRehashing() throws Exception {
        User before = copy(account);
        assertError(changePassword(PASSWORD, PASSWORD, jwt.generateToken(USER_ID)), 400, "Некорректные данные запроса");
        assertUnrelatedFields(account, before);
        verify(users, never()).save(any());
    }

    @Test
    void invalidNewPasswordPolicyRejectsBeforeLookupOrMutation() throws Exception {
        User before = copy(account);
        for (String next : List.of("", "        ", "short12", "a".repeat(73), "я".repeat(37), "€".repeat(25), "😀".repeat(19), "😀".repeat(7))) {
            assertError(changePassword(PASSWORD, next, jwt.generateToken(USER_ID)), 400, "Некорректные данные запроса");
            assertUnrelatedFields(account, before);
            assertProfileFieldsPreserved(account, before);
        }
        verify(users, never()).findById(any());
        verify(users, never()).save(any());
    }

    @Test
    void newPasswordsAtUtf8ByteAndCharacterBoundariesAreAcceptedExactly() throws Exception {
        String token = jwt.generateToken(USER_ID);
        for (String next : List.of("a".repeat(8), "a".repeat(72), "я".repeat(36), "€".repeat(24), "😀".repeat(18))) {
            account.setPasswordHash(encoder.encode(PASSWORD));
            assertNoContent(changePassword(PASSWORD, next, token));
            assertTrue(encoder.matches(next, account.getPasswordHash()), "Boundary password must verify without truncation");
        }
    }

    @Test
    void malformedAndUnknownPasswordFieldsReturnSafe400WithoutChanges() throws Exception {
        User before = copy(account);
        String currentJson = json.writeValueAsString(PASSWORD);
        String nextJson = json.writeValueAsString("New-" + UUID.randomUUID());
        List<String> invalid = new ArrayList<>(List.of("", "null", "[]", "true", "12", "\"text\"", "{broken", "{}",
                "{\"currentPassword\":" + currentJson + "}", "{\"newPassword\":" + nextJson + "}",
                "{\"currentPassword\":\"\",\"newPassword\":" + nextJson + "}"));
        for (String value : List.of("null", "12", "true", "{}", "[]")) {
            invalid.add("{\"currentPassword\":" + value + ",\"newPassword\":" + nextJson + "}");
            invalid.add("{\"currentPassword\":" + currentJson + ",\"newPassword\":" + value + "}");
        }
        String valid = "{\"currentPassword\":" + currentJson + ",\"newPassword\":" + nextJson + "}";
        invalid.add(valid + " {}");
        invalid.add(valid + " trailing");
        for (String field : List.of("id", "userId", "email", "name", "avatar", "password", "passwordHash")) {
            invalid.add(valid.substring(0, valid.length() - 1) + ",\"" + field + "\":null}");
        }
        for (String body : invalid) {
            assertError(send("PATCH", "/api/me/password", body, jwt.generateToken(USER_ID)), 400, "Некорректные данные запроса");
            assertUnrelatedFields(account, before);
            assertProfileFieldsPreserved(account, before);
        }
        verify(users, never()).findById(any());
        verify(users, never()).save(any());
    }

    @Test
    void passwordChangeRejectsMissingMalformedExpiredAndForgedTokens() throws Exception {
        assertError(changePassword(PASSWORD, "New-" + UUID.randomUUID(), null), 401, "Неверная почта или пароль");
        for (String token : List.of("", "invalid", "not.a.jwt", expiredToken(USER_ID),
                new JwtService(UUID.randomUUID().toString().repeat(2), 7).generateToken(USER_ID))) {
            assertError(changePassword(PASSWORD, "New-" + UUID.randomUUID(), token), 401, "Неверная почта или пароль");
        }
        verify(users, never()).findById(any());
        verify(users, never()).save(any());
    }

    @Test
    void passwordChangeForAbsentUserReturnsSafe401() throws Exception {
        UUID absentId = UUID.randomUUID();
        assertError(changePassword(PASSWORD, "New-" + UUID.randomUUID(), jwt.generateToken(absentId)), 401, "Неверная почта или пароль");
        verify(users).findById(absentId);
        verify(users, never()).save(any());
    }

    @Test
    void passwordChangeOwnershipIgnoresQueryIdentityForBothAccounts() throws Exception {
        UUID otherId = UUID.randomUUID();
        String otherPassword = "Other-" + UUID.randomUUID();
        User other = profileRow(otherId, "Other user", "other@example.invalid", "https://example.com/other.png");
        other.setPasswordHash(encoder.encode(otherPassword));
        when(users.findById(otherId)).thenReturn(Optional.of(other));
        User before = copy(account);
        User otherBefore = copy(other);
        String next = "New-" + UUID.randomUUID();
        String token = jwt.generateToken(USER_ID);
        assertError(patch("/api/me/password?userId=" + otherId,
                Map.of("currentPassword", otherPassword, "newPassword", next), token), 400, "Некорректные данные запроса");
        assertNoContent(patch("/api/me/password?userId=" + otherId,
                Map.of("currentPassword", PASSWORD, "newPassword", next), token));
        assertTrue(encoder.matches(next, account.getPasswordHash()), "Only authenticated account must change");
        assertUnrelatedFields(other, otherBefore);
        String firstHash = account.getPasswordHash();
        String otherNext = "New-" + UUID.randomUUID();
        assertNoContent(patch("/api/me/password?userId=" + USER_ID,
                Map.of("currentPassword", otherPassword, "newPassword", otherNext), jwt.generateToken(otherId)));
        assertTrue(encoder.matches(otherNext, other.getPasswordHash()), "Second account must change its own password");
        assertTrue(firstHash.equals(account.getPasswordHash()), "Second account cannot change the first account");
        assertProfileFieldsPreserved(account, before);
        assertProfileFieldsPreserved(other, otherBefore);
        verify(users).save(account);
        verify(users).save(other);
    }

    private HttpResponse<String> changePassword(String current, String next, String token) throws Exception {
        return patch("/api/me/password", Map.of("currentPassword", current, "newPassword", next), token);
    }

    private void assertNoContent(HttpResponse<String> response) {
        assertThat(response.statusCode()).isEqualTo(204);
        assertTrue(response.body().isEmpty(), "Password change must return no body, hash, or replacement token");
    }

    private void assertProfileFieldsPreserved(User actual, User before) {
        assertTrue(before.getId().equals(actual.getId()), "UUID must be preserved");
        assertTrue(before.getName().equals(actual.getName()), "Name must be preserved");
        assertTrue(before.getEmail().equals(actual.getEmail()), "Email must be preserved");
        assertTrue(java.util.Objects.equals(before.getAvatar(), actual.getAvatar()), "Avatar must be preserved");
        assertTrue(before.getCreatedAt().equals(actual.getCreatedAt()), "Creation time must be preserved");
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

    private Map<String, String> registration(String email) {
        return Map.of("email", email, "password", PASSWORD, "name", "Test user");
    }

    private HttpResponse<String> post(String path, Object body) throws Exception {
        return send("POST", path, json.writeValueAsString(body), null);
    }

    private HttpResponse<String> send(String method, String path, String body, String token) throws Exception {
        return send(method, path, body, token, Map.of());
    }

    private HttpResponse<String> send(String method, String path, String body, String token,
                                      Map<String, String> headers) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        headers.forEach(request::header);
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private void assertError(HttpResponse<String> response, int status, String message) throws Exception {
        assertThat(response.statusCode()).as("Servlet dispatches: %s", DISPATCHES).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type").orElse("")).startsWith("application/json");
        JsonNode body = json.readTree(response.body());
        assertThat(body.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("status", "message");
        assertThat(body.path("status").asInt()).isEqualTo(status);
        assertTrue(message.equals(body.path("message").asText()), "Error must contain only the agreed safe message");
    }

    private void assertSuccess(HttpResponse<String> response, UUID id) throws Exception {
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode body = json.readTree(response.body());
        assertThat(body.properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("token", "user");
        assertThat(body.path("user").properties()).extracting(Map.Entry::getKey).containsExactlyInAnyOrder("id", "email", "name");
        assertTrue(id.toString().equals(body.path("user").path("id").asText()), "Expected user id");
        assertTrue(id.equals(jwt.extractUserId(body.path("token").asText())), "JWT must identify saved user");
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class Probes {
        @Bean
        FilterRegistrationBean<Filter> dispatchRecorder() {
            FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<>((request, response, chain) -> {
                HttpServletRequest http = (HttpServletRequest) request;
                DISPATCHES.add(http.getDispatcherType() + " " + http.getRequestURI()
                        + " originalStatus=" + http.getAttribute(RequestDispatcher.ERROR_STATUS_CODE));
                chain.doFilter(request, response);
            });
            bean.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ERROR);
            bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
            return bean;
        }

        @Bean ProtectedProbe protectedProbe() { return new ProtectedProbe(); }
    }

    @RestController
    static class ProtectedProbe {
        @GetMapping("/test/protected")
        Map<String, Boolean> protectedResource() { return Map.of("ok", true); }

        @GetMapping("/test/forbidden")
        void forbiddenResource() { throw new AccessDeniedException("internal authorization detail"); }
    }
}
