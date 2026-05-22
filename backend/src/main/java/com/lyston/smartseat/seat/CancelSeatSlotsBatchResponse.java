package com.lyston.smartseat.seat;

public record CancelSeatSlotsBatchResponse(
        Long areaId,
        int dateCount,
        int cancelledCount,
        int blockedCount,
        int blockedAutoPublishDateCount
) {
}
