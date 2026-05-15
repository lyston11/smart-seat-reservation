package com.lyston.smartseat.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class SeatSlotCacheServiceTest {

    @Test
    void getShouldReturnNullWhenRedisFails() {
        SeatSlotCacheService cacheService = new SeatSlotCacheService(null, new ObjectMapper());

        assertThat(cacheService.get(1L, LocalDate.of(2026, 5, 15))).isNull();
    }

    @Test
    void putAndEvictShouldIgnoreRedisFailures() {
        SeatSlotCacheService cacheService = new SeatSlotCacheService(null, new ObjectMapper());

        assertThatCode(() -> cacheService.put(1L, LocalDate.of(2026, 5, 15), List.of()))
                .doesNotThrowAnyException();
        assertThatCode(() -> cacheService.evict(1L, LocalDate.of(2026, 5, 15)))
                .doesNotThrowAnyException();
    }
}
