package com.lyston.smartseat.audit;

public final class AuditAction {

    public static final String ADMIN_RELEASE_SEAT_SLOT = "ADMIN_RELEASE_SEAT_SLOT";
    public static final String ADMIN_MARK_SEAT_SLOT_ABNORMAL = "ADMIN_MARK_SEAT_SLOT_ABNORMAL";
    public static final String ADMIN_RESTORE_SEAT_SLOT = "ADMIN_RESTORE_SEAT_SLOT";
    public static final String AREA_CREATE = "AREA_CREATE";
    public static final String AREA_UPDATE = "AREA_UPDATE";
    public static final String AREA_STATUS_UPDATE = "AREA_STATUS_UPDATE";

    private AuditAction() {
    }
}
