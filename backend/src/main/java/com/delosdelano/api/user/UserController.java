package com.delosdelano.api.user;

import com.delosdelano.api.user.dto.UserProfileResponse;
import com.delosdelano.api.user.dto.UpdateProfileRequest;
import com.delosdelano.api.user.dto.ChangePasswordRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserProfileResponse me(@AuthenticationPrincipal UUID userId) {
        return userService.getProfile(userId);
    }

    @PatchMapping
    public UserProfileResponse updateMe(@AuthenticationPrincipal UUID userId,
            @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(userId, request);
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal UUID userId,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
    }
}
