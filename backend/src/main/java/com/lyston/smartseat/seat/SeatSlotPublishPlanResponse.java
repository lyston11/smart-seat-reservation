package com.lyston.smartseat.seat;

import java.time.LocalDate;
import java.util.List;

public record SeatSlotPublishPlanResponse(
        Long id,
        Long areaId,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        List<PublishSeatSlotPeriod> periods,
        List<Long> seatIds
) {
    static SeatSlotPublishPlanResponse from(SeatSlotPublishPlanDetail detail) {
        return new SeatSlotPublishPlanResponse(
                detail.id(),
                detail.areaId(),
                detail.startDate(),
                detail.endDate(),
                detail.status(),
                detail.periods(),
                detail.seatIds()
        );
    }
}
