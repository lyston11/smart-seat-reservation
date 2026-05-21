package com.lyston.smartseat.seat;

public record SeatQrResponse(
        Long seatId,
        Long tableId,
        String tableNo,
        String seatNo,
        String seatLabel,
        String qrToken,
        String checkinPath
) {

    public static SeatQrResponse from(Seat seat) {
        return new SeatQrResponse(
                seat.getId(),
                seat.getTableId(),
                seat.getTableNo(),
                seat.getSeatNo(),
                seat.getSeatLabel(),
                seat.getQrToken(),
                "/student/seat-checkin?token=" + seat.getQrToken()
        );
    }
}
