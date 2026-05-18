package com.lyston.smartseat.seat;

public record SeatResponse(
        Long id,
        Long areaId,
        Long tableId,
        String tableNo,
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
