package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotNull;

public record ReservationActionRequest(
        @NotNull Long userId
) {
}
