package com.lyston.smartseat.seat;

import java.util.List;

public record PublishSeatSlotsResponse(
        int createdCount,
        int skippedCount,
        List<SeatSlotResponse> createdSlots
) {
}
