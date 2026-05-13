package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotNull;

public record CreateReservationRequest(
        @NotNull Long seatSlotId,
        @NotNull Long userId
) {
}
