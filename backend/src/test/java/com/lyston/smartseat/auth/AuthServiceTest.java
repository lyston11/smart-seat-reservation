package com.lyston.smartseat.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.user.User;
import com.lyston.smartseat.user.UserMapper;
import com.lyston.smartseat.user.UserRole;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class AuthServiceTest {

    private UserMapperFake userMapper;
    private StringRedisTemplateFake redisTemplate;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapperFake();
        redisTemplate = new StringRedisTemplateFake();
        authService = new AuthService(userMapper.proxy(), redisTemplate);
    }

    @Test
    void loginShouldCreateSessionWhenPasswordMatches() {
        userMapper.user = user("20260001", UserRole.STUDENT, "123456");

        LoginResponse response = authService.login(new LoginRequest("20260001", "123456"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().studentNo()).isEqualTo("20260001");
        assertThat(redisTemplate.valueOperations.setKey).startsWith("smart-seat:auth:");
        assertThat(redisTemplate.valueOperations.setValue).isEqualTo("1");
        assertThat(redisTemplate.valueOperations.setTtl).isEqualTo(Duration.ofHours(12));
    }

    @Test
    void loginShouldRejectWrongPassword() {
        userMapper.user = user("20260001", UserRole.STUDENT, "123456");

        assertThatThrownBy(() -> authService.login(new LoginRequest("20260001", "bad-password")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid student number or password");
        assertThat(redisTemplate.valueOperations.setKey).isNull();
    }

    private User user(String studentNo, String role, String password) {
        User user = new User();
        user.setId(1L);
        user.setName("Demo");
        user.setStudentNo(studentNo);
        user.setRole(role);
        user.setPasswordHash(switch (password) {
            case "123456" -> "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
            case "admin" -> "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
            default -> password;
        });
        return user;
    }

    private static final class UserMapperFake {
        private User user;

        UserMapper proxy() {
            return AuthServiceTest.proxy(UserMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "findByStudentNo" -> user;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class StringRedisTemplateFake extends StringRedisTemplate {
        private final ValueOperationsFake valueOperations = new ValueOperationsFake();

        @Override
        public ValueOperations<String, String> opsForValue() {
            return valueOperations.proxy();
        }
    }

    private static final class ValueOperationsFake {
        private String setKey;
        private String setValue;
        private Duration setTtl;

        ValueOperations<String, String> proxy() {
            return AuthServiceTest.proxy(ValueOperations.class, (unused, method, args) -> {
                if ("set".equals(method.getName()) && args.length == 3) {
                    setKey = (String) args[0];
                    setValue = (String) args[1];
                    setTtl = (Duration) args[2];
                    return null;
                }
                return defaultValue(method.getReturnType());
            });
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType.equals(int.class) || returnType.equals(long.class)) {
            return 0;
        }
        if (returnType.equals(boolean.class)) {
            return false;
        }
        return null;
    }
}
