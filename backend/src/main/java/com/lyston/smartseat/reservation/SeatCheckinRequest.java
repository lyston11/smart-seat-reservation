package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotBlank;

public record SeatCheckinRequest(
        @NotBlank String seatQrToken,
        @NotBlank String checkinCode
) {
}
