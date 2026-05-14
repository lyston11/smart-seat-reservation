package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record PublishSeatSlotsRequest(
        @NotNull Long areaId,
        @NotNull LocalDate slotDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotEmpty List<Long> seatIds
) {
}
