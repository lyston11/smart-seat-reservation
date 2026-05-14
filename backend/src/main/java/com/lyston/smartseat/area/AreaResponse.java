package com.lyston.smartseat.area;

public record AreaResponse(
        Long id,
        String name,
        String floor,
        String description,
        String status
) {

    public static AreaResponse from(Area area) {
        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getFloor(),
                area.getDescription(),
                area.getStatus()
        );
    }
}
