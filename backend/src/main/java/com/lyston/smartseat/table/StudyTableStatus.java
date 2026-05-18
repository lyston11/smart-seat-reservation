package com.lyston.smartseat.table;

import java.util.Set;

public final class StudyTableStatus {

    public static final String ACTIVE = "ACTIVE";
    public static final String INACTIVE = "INACTIVE";

    private static final Set<String> ALLOWED_STATUSES = Set.of(ACTIVE, INACTIVE);

    private StudyTableStatus() {
    }

    public static boolean isAllowed(String status) {
        return ALLOWED_STATUSES.contains(status);
    }
}
