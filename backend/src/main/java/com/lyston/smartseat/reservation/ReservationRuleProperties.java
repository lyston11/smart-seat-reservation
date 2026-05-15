package com.lyston.smartseat.reservation;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smart-seat.reservation-rules")
public class ReservationRuleProperties {

    private int checkinGraceMinutes = 15;
    private int maxAdvanceDays = 7;
    private int dailyActiveReservationLimit = 3;

    public int getCheckinGraceMinutes() {
        return checkinGraceMinutes;
    }

    public void setCheckinGraceMinutes(int checkinGraceMinutes) {
        this.checkinGraceMinutes = checkinGraceMinutes;
    }

    public int getMaxAdvanceDays() {
        return maxAdvanceDays;
    }

    public void setMaxAdvanceDays(int maxAdvanceDays) {
        this.maxAdvanceDays = maxAdvanceDays;
    }

    public int getDailyActiveReservationLimit() {
        return dailyActiveReservationLimit;
    }

    public void setDailyActiveReservationLimit(int dailyActiveReservationLimit) {
        this.dailyActiveReservationLimit = dailyActiveReservationLimit;
    }
}
