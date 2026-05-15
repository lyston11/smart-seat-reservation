package com.lyston.smartseat.cache;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.common.BusinessException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class ReservationRateLimiterTest {

    @Test
    void checkShouldNotBlockWhenRedisFails() {
        ReservationRateLimiter limiter = new ReservationRateLimiter(null);

        assertThatCode(() -> limiter.check(10L)).doesNotThrowAnyException();
    }

    @Test
    void checkShouldRejectWhenLimitExceeded() {
        ReservationRateLimiter limiter = new ReservationRateLimiter(new StringRedisTemplateFake(6L));

        assertThatThrownBy(() -> limiter.check(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Too many reservation requests");
    }

    private static final class StringRedisTemplateFake extends StringRedisTemplate {
        private final Long incrementResult;

        private StringRedisTemplateFake(Long incrementResult) {
            this.incrementResult = incrementResult;
        }

        @Override
        public ValueOperations<String, String> opsForValue() {
            return ReservationRateLimiterTest.proxy(ValueOperations.class, (unused, method, args) -> {
                if ("increment".equals(method.getName())) {
                    return incrementResult;
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
        if (returnType.equals(boolean.class)) {
            return false;
        }
        return null;
    }
}
