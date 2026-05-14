package com.lyston.smartseat.cache;

import com.lyston.smartseat.seat.SeatSlotResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class SeatSlotCacheService {

    private static final String KEY_PREFIX = "smart-seat:seat-slots:";
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public SeatSlotCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public List<SeatSlotResponse> get(Long areaId, LocalDate date) {
        try {
            String value = redisTemplate.opsForValue().get(key(areaId, date));
            if (value == null) {
                return null;
            }
            return objectMapper.readValue(value, new TypeReference<>() {
            });
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    public void put(Long areaId, LocalDate date, List<SeatSlotResponse> slots) {
        try {
            String value = objectMapper.writeValueAsString(slots);
            redisTemplate.opsForValue().set(key(areaId, date), value, CACHE_TTL);
        } catch (RuntimeException ignored) {
            // Cache failures must not block reservation correctness.
        }
    }

    public void evict(Long areaId, LocalDate date) {
        try {
            redisTemplate.delete(key(areaId, date));
        } catch (RuntimeException ignored) {
            // MySQL remains the source of truth.
        }
    }

    private String key(Long areaId, LocalDate date) {
        return KEY_PREFIX + areaId + ":" + date;
    }
}
