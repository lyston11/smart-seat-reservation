package com.lyston.smartseat.seat;

import java.time.LocalDate;
import java.util.List;

public record SeatSlotPublishPlanDetail(
        Long id,
        Long areaId,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        List<PublishSeatSlotPeriod> periods,
        List<Long> seatIds
) {
}
