package com.lyston.smartseat.seat;

public record SeatResponse(
        Long id,
        Long areaId,
        String seatNo,
        String status
) {

    public static SeatResponse from(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getAreaId(),
                seat.getSeatNo(),
                seat.getStatus()
        );
    }
}
