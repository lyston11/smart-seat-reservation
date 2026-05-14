package com.lyston.smartseat.admin;

public record AdminSeatSlotStatusResponse(
        Long seatSlotId,
        Long changedBy,
        String reason,
        String seatSlotStatus
) {
}
