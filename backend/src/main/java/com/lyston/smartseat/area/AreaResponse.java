package com.lyston.smartseat.area;

import java.time.LocalTime;

public record AreaResponse(
        Long id,
        String name,
        String floor,
        String description,
        String status,
        LocalTime openTime,
        LocalTime closeTime
) {

    private static final LocalTime DEFAULT_OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_CLOSE_TIME = LocalTime.of(22, 0);

    public static AreaResponse from(Area area) {
        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getFloor(),
                area.getDescription(),
                area.getStatus(),
                area.getOpenTime() == null ? DEFAULT_OPEN_TIME : area.getOpenTime(),
                area.getCloseTime() == null ? DEFAULT_CLOSE_TIME : area.getCloseTime()
        );
    }
}
