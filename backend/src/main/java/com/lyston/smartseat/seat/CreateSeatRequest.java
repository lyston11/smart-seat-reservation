package com.lyston.smartseat.seat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSeatRequest(
        @NotNull Long areaId,
        @NotBlank @Size(max = 32) String seatNo,
        @Min(1) Integer rowNo,
        @Min(1) Integer columnNo,
        @Min(1) Integer displayOrder
) {
}
