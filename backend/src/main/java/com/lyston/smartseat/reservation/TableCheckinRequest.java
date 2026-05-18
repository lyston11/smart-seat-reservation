package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotBlank;

public record TableCheckinRequest(
        @NotBlank String tableQrToken,
        @NotBlank String checkinCode
) {
}
