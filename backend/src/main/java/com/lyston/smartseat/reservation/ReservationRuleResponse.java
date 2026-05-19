package com.lyston.smartseat.reservation;

import java.time.LocalDateTime;

public record ReservationRuleResponse(
        int checkinGraceMinutes,
        int checkinLeadMinutes,
        int maxAdvanceDays,
        int reservationOpenHour,
        int dailyActiveReservationLimit,
        int wifiOfflineReleaseMinutes,
        int seatLockMinutes,
        Long updatedBy,
        LocalDateTime updatedAt
) {

    public static ReservationRuleResponse from(ReservationRuleProperties properties) {
        return new ReservationRuleResponse(
                properties.getCheckinGraceMinutes(),
                properties.getCheckinLeadMinutes(),
                properties.getMaxAdvanceDays(),
                properties.getReservationOpenHour(),
                properties.getDailyActiveReservationLimit(),
                properties.getWifiOfflineReleaseMinutes(),
                properties.getSeatLockMinutes(),
                null,
                null
        );
    }

    public static ReservationRuleResponse from(ReservationRule rule) {
        return new ReservationRuleResponse(
                rule.getCheckinGraceMinutes(),
                rule.getCheckinLeadMinutes(),
                rule.getMaxAdvanceDays(),
                rule.getReservationOpenHour(),
                rule.getDailyActiveReservationLimit(),
                rule.getWifiOfflineReleaseMinutes(),
                rule.getSeatLockMinutes(),
                rule.getUpdatedBy(),
                rule.getUpdatedAt()
        );
    }
}
