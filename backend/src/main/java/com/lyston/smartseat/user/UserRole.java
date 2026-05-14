package com.lyston.smartseat.user;

import java.util.Set;

public final class UserRole {

    public static final String STUDENT = "STUDENT";
    public static final String ADMIN = "ADMIN";

    private static final Set<String> ALLOWED_ROLES = Set.of(STUDENT, ADMIN);

    private UserRole() {
    }

    public static boolean isAllowed(String role) {
        return ALLOWED_ROLES.contains(role);
    }
}
