package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record PublishSeatSlotPeriod(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime
) {
}
