package com.lyston.smartseat.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateStudyTableRequest(
        @NotNull Long areaId,
        @NotBlank @Size(max = 32) String tableNo,
        @Size(max = 64) String name,
        @Min(1) Integer rowNo,
        @Min(1) Integer columnNo,
        @Min(1) Integer displayOrder
) {
}
