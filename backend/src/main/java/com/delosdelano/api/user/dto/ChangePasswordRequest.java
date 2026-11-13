package com.delosdelano.api.user.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Strict local binding. No generated toString containing credential values. */
@JsonDeserialize(using = ChangePasswordRequest.Deserializer.class)
public final class ChangePasswordRequest {
    private final String currentPassword;
    private final String newPassword;

    public ChangePasswordRequest(JsonNode input) {
        if (input == null || !input.isObject() || input.size() != 2
                || !input.path("currentPassword").isTextual() || !input.path("newPassword").isTextual()) {
            throw invalid();
        }
        currentPassword = input.get("currentPassword").textValue();
        newPassword = input.get("newPassword").textValue();
        if (currentPassword.isEmpty() || newPassword.isBlank()
                || newPassword.codePointCount(0, newPassword.length()) < 8
                || newPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw invalid();
        }
    }

    public String currentPassword() { return currentPassword; }
    public String newPassword() { return newPassword; }

    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException("Invalid password change");
    }

    public static final class Deserializer extends JsonDeserializer<ChangePasswordRequest> {
        @Override
        public ChangePasswordRequest deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            JsonNode input = parser.getCodec().readTree(parser);
            if (parser.nextToken() != null) throw JsonMappingException.from(parser, "Invalid password change");
            try {
                return new ChangePasswordRequest(input);
            } catch (IllegalArgumentException exception) {
                throw JsonMappingException.from(parser, "Invalid password change");
            }
        }
    }
}
