package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotBlank;

public record CheckinRequest(
        @NotBlank String checkinCode
) {
}
