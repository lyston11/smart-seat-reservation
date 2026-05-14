package com.lyston.smartseat.seat;

import java.time.LocalDate;
import java.time.LocalTime;

public record SeatSlotResponse(
        Long id,
        Long seatId,
        Long areaId,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        Long reservedBy,
        Long reservationId
) {

    public static SeatSlotResponse from(SeatSlot slot) {
        return new SeatSlotResponse(
                slot.getId(),
                slot.getSeatId(),
                slot.getAreaId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus(),
                slot.getReservedBy(),
                slot.getReservationId()
        );
    }
}
