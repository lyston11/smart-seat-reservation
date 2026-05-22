package com.lyston.smartseat.seat;

import java.time.LocalDate;

public record CancelSeatSlotsByDateResponse(
        Long areaId,
        LocalDate slotDate,
        int cancelledCount,
        int blockedCount
) {
}
