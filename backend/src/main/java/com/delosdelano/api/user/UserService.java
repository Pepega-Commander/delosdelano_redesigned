package com.delosdelano.api.user;

import com.delosdelano.api.user.dto.UserProfileResponse;
import com.delosdelano.api.user.dto.UpdateProfileRequest;
import com.delosdelano.api.user.dto.ChangePasswordRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        return toProfile(findUser(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        if (request.nameProvided()) user.setName(request.name());
        if (request.avatarProvided()) user.setAvatar(request.avatar());
        if (request.nameProvided() || request.avatarProvided()) userRepository.save(user);
        return toProfile(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        String storedHash = user.getPasswordHash();
        if (!passwordEncoder.matches(request.currentPassword(), storedHash)
                || passwordEncoder.matches(request.newPassword(), storedHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getAvatar());
    }
}
