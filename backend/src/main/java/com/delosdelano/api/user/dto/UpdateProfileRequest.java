package com.delosdelano.api.user.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/** Validated at the JSON boundary; presence flags distinguish omission from null. */
@JsonDeserialize(using = UpdateProfileRequest.Deserializer.class)
public final class UpdateProfileRequest {
    private final boolean nameProvided;
    private final boolean avatarProvided;
    private final String name;
    private final String avatar;

    public UpdateProfileRequest(JsonNode input) {
        if (input == null || !input.isObject()) throw invalid();
        input.fieldNames().forEachRemaining(field -> {
            if (!field.equals("name") && !field.equals("avatar")) throw invalid();
        });
        nameProvided = input.has("name");
        avatarProvided = input.has("avatar");

        String normalizedName = null;
        if (nameProvided) {
            if (!input.get("name").isTextual()) throw invalid();
            normalizedName = input.get("name").textValue().strip();
            if (normalizedName.isEmpty() || normalizedName.length() > 60) throw invalid();
        }
        name = normalizedName;

        String reference = null;
        if (avatarProvided && !input.get("avatar").isNull()) {
            if (!input.get("avatar").isTextual()) throw invalid();
            reference = input.get("avatar").textValue();
            if (!isValidAvatarReference(reference)) throw invalid();
        }
        avatar = reference;
    }

    public boolean nameProvided() { return nameProvided; }
    public boolean avatarProvided() { return avatarProvided; }
    public String name() { return name; }
    public String avatar() { return avatar; }

    private static boolean isValidAvatarReference(String reference) {
        if (reference.isBlank() || reference.length() > 2048) return false;
        try {
            URI uri = new URI(reference);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null
                    && uri.getRawUserInfo() == null && uri.getPort() <= 65535;
        } catch (URISyntaxException exception) {
            return false;
        }
    }

    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException("Invalid profile update");
    }

    /** Strict binding for this request only, including trailing JSON tokens. */
    public static final class Deserializer extends JsonDeserializer<UpdateProfileRequest> {
        @Override
        public UpdateProfileRequest deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            JsonNode input = parser.getCodec().readTree(parser);
            if (parser.nextToken() != null) throw JsonMappingException.from(parser, "Invalid profile update");
            try {
                return new UpdateProfileRequest(input);
            } catch (IllegalArgumentException exception) {
                throw JsonMappingException.from(parser, "Invalid profile update");
            }
        }
    }
}
