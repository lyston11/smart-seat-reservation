package com.lyston.smartseat.area;

import java.time.LocalTime;

public record AreaResponse(
        Long id,
        String name,
        String floor,
        String buildingCode,
        String floorCode,
        String areaType,
        Integer mapX,
        Integer mapY,
        String description,
        String status,
        LocalTime openTime,
        LocalTime closeTime,
        String checkinIpCidrs
) {

    public static AreaResponse from(Area area) {
        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getFloor(),
                area.getBuildingCode(),
                area.getFloorCode(),
                area.getAreaType(),
                area.getMapX(),
                area.getMapY(),
                area.getDescription(),
                area.getStatus(),
                area.getOpenTime(),
                area.getCloseTime(),
                area.getCheckinIpCidrs()
        );
    }
}
