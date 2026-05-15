package com.lyston.smartseat.seat;

public record SeatResponse(
        Long id,
        Long areaId,
        String seatNo,
        Integer rowNo,
        Integer columnNo,
        Integer displayOrder,
        String status
) {

    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getAreaId(),
                seat.getSeatNo(),
                seat.getRowNo(),
                seat.getColumnNo(),
                seat.getDisplayOrder(),
                seat.getStatus()
        );
    }
}
