package com.lyston.smartseat.reservation;

public final class ReservationStatus {

    public static final String RESERVED = "RESERVED";
    public static final String CHECKED_IN = "CHECKED_IN";
    public static final String CHECKED_OUT = "CHECKED_OUT";
    public static final String CANCELLED = "CANCELLED";
    public static final String EXPIRED = "EXPIRED";
    public static final String ADMIN_RELEASED = "ADMIN_RELEASED";
    public static final String WIFI_RELEASED = "WIFI_RELEASED";
    public static final String LOCKED = "LOCKED";
    public static final String LOCK_RELEASED = "LOCK_RELEASED";

    private ReservationStatus() {
    }
}
