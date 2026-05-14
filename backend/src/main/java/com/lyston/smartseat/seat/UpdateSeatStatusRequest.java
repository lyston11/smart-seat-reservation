package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSeatStatusRequest(
        @NotBlank @Size(max = 32) String status
) {
}
