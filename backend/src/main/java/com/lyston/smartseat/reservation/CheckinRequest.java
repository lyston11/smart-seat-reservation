package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CheckinRequest(
        @NotNull Long userId,
        @NotBlank String checkinCode
) {
}
