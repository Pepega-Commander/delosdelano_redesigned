package com.delosdelano.api.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record UserProfileResponse(UUID id, String name, String email, String avatar) {
}
