package com.lyston.smartseat.cache;

import com.lyston.smartseat.common.BusinessException;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ReservationRateLimiter {

    private static final String KEY_PREFIX = "smart-seat:reservation-rate:";
    private static final int MAX_REQUESTS = 5;
    private static final Duration WINDOW = Duration.ofSeconds(10);

    private final StringRedisTemplate redisTemplate;

    public ReservationRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void check(Long userId) {
        try {
            String key = KEY_PREFIX + userId;
            Long current = redisTemplate.opsForValue().increment(key);
            if (current != null && current == 1L) {
                redisTemplate.expire(key, WINDOW);
            }
            if (current != null && current > MAX_REQUESTS) {
                throw new BusinessException("RESERVATION_RATE_LIMITED", "Too many reservation requests");
            }
        } catch (BusinessException exception) {
            throw exception;
        } catch (RuntimeException ignored) {
            // Redis is an auxiliary guard; database conditional update still protects inventory.
        }
    }
}
