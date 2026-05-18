package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.format.annotation.DateTimeFormat;

public record CreateReservationRequest(
        Long seatSlotId,
        Long seatId,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate slotDate,
        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime
) {

    public CreateReservationRequest(@NotNull Long seatSlotId) {
        this(seatSlotId, null, null, null, null);
    }
}
