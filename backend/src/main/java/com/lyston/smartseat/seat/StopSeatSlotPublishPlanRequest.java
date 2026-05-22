package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record StopSeatSlotPublishPlanRequest(
        @NotNull LocalDate stopFromDate,
        boolean cancelGeneratedSlots
) {
}
