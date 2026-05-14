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

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getSeatSlotId(),
                reservation.getSeatId(),
                reservation.getUserId(),
                reservation.getStatus(),
                reservation.getCheckinCode(),
                reservation.getExpiresAt()
        );
    }
}
