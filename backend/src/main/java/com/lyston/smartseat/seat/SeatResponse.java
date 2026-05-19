package com.lyston.smartseat.seat;

public record SeatResponse(
        Long id,
        Long areaId,
        Long tableId,
        String tableNo,
        Integer tableRowNo,
        Integer tableColumnNo,
        Integer tableDisplayOrder,
        Integer tablePositionX,
        Integer tablePositionY,
        Integer tableWidthPx,
        Integer tableHeightPx,
        Integer tableRotationDeg,
        String seatNo,
        String seatLabel,
        String seatSide,
        Integer seatOrder,
        Integer rowNo,
        Integer columnNo,
        Integer displayOrder,
        String status
) {

    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getAreaId(),
                seat.getTableId(),
                seat.getTableNo(),
                seat.getTableRowNo(),
                seat.getTableColumnNo(),
                seat.getTableDisplayOrder(),
                seat.getTablePositionX(),
                seat.getTablePositionY(),
                seat.getTableWidthPx(),
                seat.getTableHeightPx(),
                seat.getTableRotationDeg(),
                seat.getSeatNo(),
                seat.getSeatLabel(),
                seat.getSeatSide(),
                seat.getSeatOrder(),
                seat.getRowNo(),
                seat.getColumnNo(),
                seat.getDisplayOrder(),
                seat.getStatus()
        );
    }
}
