package com.lyston.smartseat.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateStudyTableRequest(
        @NotNull Long areaId,
        @NotBlank @Size(max = 32) String tableNo,
        @Size(max = 64) String name,
        @NotBlank @Size(max = 32) String status,
        @Min(1) Integer rowNo,
        @Min(1) Integer columnNo,
        @Min(1) Integer displayOrder,
        @Min(0) Integer positionX,
        @Min(0) Integer positionY,
        @Min(80) Integer widthPx,
        @Min(48) Integer heightPx,
        Integer rotationDeg
) {

    public UpdateStudyTableRequest(
            Long areaId,
            String tableNo,
            String name,
            String status,
            Integer rowNo,
            Integer columnNo,
            Integer displayOrder
    ) {
        this(areaId, tableNo, name, status, rowNo, columnNo, displayOrder, null, null, null, null, null);
    }
}
