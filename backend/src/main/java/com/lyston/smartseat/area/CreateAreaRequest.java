package com.lyston.smartseat.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record CreateAreaRequest(
        @NotBlank @Size(max = 64) String name,
        @Size(max = 32) String floor,
        @Size(max = 255) String description,
        LocalTime openTime,
        LocalTime closeTime,
        @Size(max = 512) String checkinIpCidrs,
        @Size(max = 32) String buildingCode,
        @Size(max = 32) String floorCode,
        @Size(max = 32) String areaType,
        Integer mapX,
        Integer mapY
) {

    public CreateAreaRequest(String name, String floor, String description) {
        this(name, floor, description, null, null, null, null, null, null, null, null);
    }
}
