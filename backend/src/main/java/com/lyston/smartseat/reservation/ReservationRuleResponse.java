package com.lyston.smartseat.reservation;

import java.time.LocalDateTime;

public record ReservationRuleResponse(
        int checkinGraceMinutes,
        int maxAdvanceDays,
        int dailyActiveReservationLimit,
        Long updatedBy,
        LocalDateTime updatedAt
) {

    public static ReservationRuleResponse from(ReservationRuleProperties properties) {
        return new ReservationRuleResponse(
                properties.getCheckinGraceMinutes(),
                properties.getMaxAdvanceDays(),
                properties.getDailyActiveReservationLimit(),
                null,
                null
        );
    }

    public static ReservationRuleResponse from(ReservationRule rule) {
        return new ReservationRuleResponse(
                rule.getCheckinGraceMinutes(),
                rule.getMaxAdvanceDays(),
                rule.getDailyActiveReservationLimit(),
                rule.getUpdatedBy(),
                rule.getUpdatedAt()
        );
    }
}
