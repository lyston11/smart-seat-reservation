package com.lyston.smartseat.seat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSeatRequest(
        @NotNull Long areaId,
        @NotBlank @Size(max = 32) String seatNo
) {
}
