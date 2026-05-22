package com.lyston.smartseat.seat;

public record AutoSeatSlotPublishResult(
        int areaCount,
        int seatCount,
        int createdCount,
        int skippedCount
) {
}
