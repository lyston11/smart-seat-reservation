package com.lyston.smartseat.reservation;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smart-seat.reservation-rules")
public class ReservationRuleProperties {

    private int checkinGraceMinutes = 15;
    private int checkinLeadMinutes = 10;
    private int maxAdvanceDays = 7;
    private int dailyActiveReservationLimit = 3;
    private int wifiOfflineReleaseMinutes = 15;

    public int getCheckinGraceMinutes() {
        return checkinGraceMinutes;
    }

    public void setCheckinGraceMinutes(int checkinGraceMinutes) {
        this.checkinGraceMinutes = checkinGraceMinutes;
    }

    public int getCheckinLeadMinutes() {
        return checkinLeadMinutes;
    }

    public void setCheckinLeadMinutes(int checkinLeadMinutes) {
        this.checkinLeadMinutes = checkinLeadMinutes;
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

    public int getWifiOfflineReleaseMinutes() {
        return wifiOfflineReleaseMinutes;
    }

    public void setWifiOfflineReleaseMinutes(int wifiOfflineReleaseMinutes) {
        this.wifiOfflineReleaseMinutes = wifiOfflineReleaseMinutes;
    }
}
