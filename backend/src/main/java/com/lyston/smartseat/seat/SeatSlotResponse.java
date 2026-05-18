package com.lyston.smartseat.seat;

import java.time.LocalDate;
import java.time.LocalTime;

public record SeatSlotResponse(
        Long id,
        Long seatId,
        String seatNo,
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
        String seatLabel,
        String seatSide,
        Integer seatOrder,
        Integer rowNo,
        Integer columnNo,
        Integer displayOrder,
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
                slot.getSeatNo(),
                slot.getTableId(),
                slot.getTableNo(),
                slot.getTableRowNo(),
                slot.getTableColumnNo(),
                slot.getTableDisplayOrder(),
                slot.getTablePositionX(),
                slot.getTablePositionY(),
                slot.getTableWidthPx(),
                slot.getTableHeightPx(),
                slot.getTableRotationDeg(),
                slot.getSeatLabel(),
                slot.getSeatSide(),
                slot.getSeatOrder(),
                slot.getRowNo(),
                slot.getColumnNo(),
                slot.getDisplayOrder(),
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
