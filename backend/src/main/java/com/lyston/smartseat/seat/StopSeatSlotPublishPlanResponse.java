package com.lyston.smartseat.seat;

public record StopSeatSlotPublishPlanResponse(
        Long planId,
        int cancelledCount,
        int blockedCount
) {
}
