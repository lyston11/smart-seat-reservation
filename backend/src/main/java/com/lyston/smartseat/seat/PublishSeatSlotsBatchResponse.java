package com.lyston.smartseat.seat;

public record PublishSeatSlotsBatchResponse(
        int dateCount,
        int createdCount,
        int skippedCount
) {
}
