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

    public static ReservationRuleResponse from(ReservationRule rule, ReservationRuleProperties properties) {
        return new ReservationRuleResponse(
                valueOrDefault(rule.getCheckinGraceMinutes(), properties.getCheckinGraceMinutes()),
                valueOrDefault(rule.getCheckinLeadMinutes(), properties.getCheckinLeadMinutes()),
                valueOrDefault(rule.getMaxAdvanceDays(), properties.getMaxAdvanceDays()),
                valueOrDefault(rule.getReservationOpenHour(), properties.getReservationOpenHour()),
                valueOrDefault(rule.getDailyActiveReservationLimit(), properties.getDailyActiveReservationLimit()),
                valueOrDefault(rule.getWifiOfflineReleaseMinutes(), properties.getWifiOfflineReleaseMinutes()),
                valueOrDefault(rule.getSeatLockMinutes(), properties.getSeatLockMinutes()),
                rule.getUpdatedBy(),
                rule.getUpdatedAt()
        );
    }

    private static int valueOrDefault(Integer value, int defaultValue) {
        return value != null ? value : defaultValue;
    }
}
