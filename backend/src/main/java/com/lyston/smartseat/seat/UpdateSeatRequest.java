package com.lyston.smartseat.seat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSeatRequest(
        @NotNull Long areaId,
        @NotNull Long tableId,
        @NotBlank @Size(max = 32) String seatNo,
        @Size(max = 32) String seatLabel,
        @Size(max = 32) String seatSide,
        @Min(1) Integer seatOrder,
        @Min(1) Integer rowNo,
        @Min(1) Integer columnNo,
        @Min(1) Integer displayOrder,
        @NotBlank @Size(max = 32) String status
) {
}
