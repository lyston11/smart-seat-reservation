package com.lyston.smartseat.common;

public final class ApiPaths {

    public static final String API = "/api";

    public static final String AUTH = API + "/auth";
    public static final String HEALTH = API + "/health";
    public static final String AREAS = API + "/areas";
    public static final String SEATS = API + "/seats";
    public static final String SEAT_SLOTS = API + "/seat-slots";
    public static final String TABLES = API + "/tables";
    public static final String RESERVATIONS = API + "/reservations";
    public static final String RESERVATION_RULES = RESERVATIONS + "/rules";

    public static final String ADMIN = API + "/admin";
    public static final String ADMIN_AUDIT_LOGS = ADMIN + "/audit-logs";
    public static final String ADMIN_DASHBOARD = ADMIN + "/dashboard";
    public static final String ADMIN_RESERVATIONS = ADMIN + "/reservations";
    public static final String ADMIN_SEAT_SLOTS = ADMIN + "/seat-slots";

    private ApiPaths() {
    }
}
