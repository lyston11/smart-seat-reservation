package com.lyston.smartseat.auth;

import com.lyston.smartseat.user.UserResponse;
import java.time.LocalDateTime;

public record LoginResponse(
        String token,
        UserResponse user,
        LocalDateTime expiresAt
) {
}
