package com.lyston.smartseat.admin;

import com.lyston.smartseat.reservation.ReservationResponse;

public record AdminSeatSlotReleaseResponse(
        Long seatSlotId,
        Long reservationId,
        Long releasedBy,
        String reason,
        String seatSlotStatus,
        ReservationResponse reservation
) {
}
