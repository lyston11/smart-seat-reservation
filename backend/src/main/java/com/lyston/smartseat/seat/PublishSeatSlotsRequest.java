package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record PublishSeatSlotsRequest(
        @NotNull Long areaId,
        @NotNull LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        @Valid List<PublishSeatSlotPeriod> periods,
        @NotEmpty List<Long> seatIds
) {
}
