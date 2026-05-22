package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record CancelSeatSlotsBatchRequest(
        @NotNull Long areaId,
        List<LocalDate> slotDates,
        LocalDate startDate,
        LocalDate endDate,
        boolean blockAutoPublish,
        String reason
) {
}
