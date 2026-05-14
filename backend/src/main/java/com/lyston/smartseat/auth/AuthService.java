package com.lyston.smartseat.auth;

import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.user.User;
import com.lyston.smartseat.user.UserMapper;
import com.lyston.smartseat.user.UserResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String SESSION_KEY_PREFIX = "smart-seat:auth:";
    private static final Duration SESSION_TTL = Duration.ofHours(12);

    private final UserMapper userMapper;
    private final StringRedisTemplate redisTemplate;

    public AuthService(UserMapper userMapper, StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.redisTemplate = redisTemplate;
    }

    public LoginResponse login(LoginRequest request) {
        String studentNo = request.studentNo().trim();
        User user = userMapper.findByStudentNo(studentNo);
        if (user == null) {
            throw new BusinessException("USER_NOT_FOUND", "User not found");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(sessionKey(token), String.valueOf(user.getId()), SESSION_TTL);
        return new LoginResponse(
                token,
                UserResponse.from(user),
                LocalDateTime.now().plus(SESSION_TTL)
        );
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            redisTemplate.delete(sessionKey(token));
        }
    }

    public CurrentUser resolveToken(String token) {
        if (token == null || token.isBlank()) {
            throw new AuthException("AUTH_REQUIRED", "Authentication token is required", 401);
        }

        String userIdText = redisTemplate.opsForValue().get(sessionKey(token));
        if (userIdText == null) {
            throw new AuthException("AUTH_INVALID", "Authentication token is invalid or expired", 401);
        }

        User user = userMapper.selectById(Long.valueOf(userIdText));
        if (user == null) {
            throw new AuthException("AUTH_USER_NOT_FOUND", "Authentication user no longer exists", 401);
        }
        return CurrentUser.from(user);
    }

    private String sessionKey(String token) {
        return SESSION_KEY_PREFIX + token;
    }
}
