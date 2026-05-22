package com.lyston.smartseat.seat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record CreateSeatSlotPublishPlanRequest(
        @NotNull Long areaId,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        @Valid List<PublishSeatSlotPeriod> periods,
        @NotEmpty List<Long> seatIds
) {
}
