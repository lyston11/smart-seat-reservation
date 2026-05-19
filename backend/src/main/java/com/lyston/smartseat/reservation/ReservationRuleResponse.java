package com.lyston.smartseat.reservation;

import java.time.LocalDateTime;

public record ReservationRuleResponse(
        int checkinGraceMinutes,
        int checkinLeadMinutes,
        int maxAdvanceDays,
        int dailyActiveReservationLimit,
        int wifiOfflineReleaseMinutes,
        Long updatedBy,
        LocalDateTime updatedAt
) {

    public static ReservationRuleResponse from(ReservationRuleProperties properties) {
        return new ReservationRuleResponse(
                properties.getCheckinGraceMinutes(),
                properties.getCheckinLeadMinutes(),
                properties.getMaxAdvanceDays(),
                properties.getDailyActiveReservationLimit(),
                properties.getWifiOfflineReleaseMinutes(),
                null,
                null
        );
    }

    public static ReservationRuleResponse from(ReservationRule rule) {
        return new ReservationRuleResponse(
                rule.getCheckinGraceMinutes(),
                rule.getCheckinLeadMinutes(),
                rule.getMaxAdvanceDays(),
                rule.getDailyActiveReservationLimit(),
                rule.getWifiOfflineReleaseMinutes(),
                rule.getUpdatedBy(),
                rule.getUpdatedAt()
        );
    }
}
