package com.lyston.smartseat.reservation;

import java.time.LocalDateTime;

public record ReservationResponse(
        Long reservationId,
        Long seatSlotId,
        Long seatId,
        Long userId,
        String status,
        String checkinCode,
        LocalDateTime expiresAt
) {
}
