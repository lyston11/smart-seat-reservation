package com.lyston.smartseat.reservation;

public record ReservationRuleResponse(
        int checkinGraceMinutes,
        int maxAdvanceDays,
        int dailyActiveReservationLimit
) {

    public static ReservationRuleResponse from(ReservationRuleProperties properties) {
        return new ReservationRuleResponse(
                properties.getCheckinGraceMinutes(),
                properties.getMaxAdvanceDays(),
                properties.getDailyActiveReservationLimit()
        );
    }
}
