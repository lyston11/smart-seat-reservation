package com.lyston.smartseat.table;

public record StudyTableResponse(
        Long id,
        Long areaId,
        String tableNo,
        String name,
        String status,
        Integer rowNo,
        Integer columnNo,
        Integer displayOrder,
        Integer positionX,
        Integer positionY,
        Integer widthPx,
        Integer heightPx,
        Integer rotationDeg
) {

    public static StudyTableResponse from(StudyTable table) {
        return new StudyTableResponse(
                table.getId(),
                table.getAreaId(),
                table.getTableNo(),
                table.getName(),
                table.getStatus(),
                table.getRowNo(),
                table.getColumnNo(),
                table.getDisplayOrder(),
                table.getPositionX(),
                table.getPositionY(),
                table.getWidthPx(),
                table.getHeightPx(),
                table.getRotationDeg()
        );
    }
}
