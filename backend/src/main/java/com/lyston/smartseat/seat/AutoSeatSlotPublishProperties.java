package com.lyston.smartseat.seat;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smart-seat.auto-seat-slots")
public class AutoSeatSlotPublishProperties {

    private boolean enabled = true;
    private String zoneId = "Asia/Shanghai";
    private int reservationOpenHour = 18;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public int getReservationOpenHour() {
        return reservationOpenHour;
    }

    public void setReservationOpenHour(int reservationOpenHour) {
        this.reservationOpenHour = reservationOpenHour;
    }
}
