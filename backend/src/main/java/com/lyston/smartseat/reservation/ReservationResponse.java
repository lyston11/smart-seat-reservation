package com.lyston.smartseat.reservation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.lyston.smartseat.seat.SeatSlot;

public record ReservationResponse(
        Long reservationId,
        Long seatSlotId,
        Long seatId,
        Long userId,
        String status,
        String checkinCode,
        LocalDateTime expiresAt,
        String seatNo,
        String seatLabel,
        Long tableId,
        String tableNo,
        Long areaId,
        String areaName,
        String floor,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime
) {

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getSeatSlotId(),
                reservation.getSeatId(),
                reservation.getUserId(),
                reservation.getStatus(),
                reservation.getCheckinCode(),
                reservation.getExpiresAt(),
                reservation.getSeatNo(),
                reservation.getSeatLabel(),
                reservation.getTableId(),
                reservation.getTableNo(),
                reservation.getAreaId(),
                reservation.getAreaName(),
                reservation.getFloor(),
                reservation.getSlotDate(),
                reservation.getStartTime(),
                reservation.getEndTime()
        );
    }

    public static ReservationResponse from(Reservation reservation, SeatSlot slot) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getSeatSlotId(),
                reservation.getSeatId(),
                reservation.getUserId(),
                reservation.getStatus(),
                reservation.getCheckinCode(),
                reservation.getExpiresAt(),
                slot.getSeatNo(),
                slot.getSeatLabel(),
                slot.getTableId(),
                slot.getTableNo(),
                slot.getAreaId(),
                slot.getAreaName(),
                slot.getFloor(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );
    }
}
