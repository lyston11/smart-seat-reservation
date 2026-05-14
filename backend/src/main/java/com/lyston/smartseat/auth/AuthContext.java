package com.lyston.smartseat.auth;

public final class AuthContext {

    private static final ThreadLocal<CurrentUser> CURRENT_USER = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void setCurrentUser(CurrentUser currentUser) {
        CURRENT_USER.set(currentUser);
    }

    public static CurrentUser requireCurrentUser() {
        CurrentUser currentUser = CURRENT_USER.get();
        if (currentUser == null) {
            throw new AuthException("AUTH_REQUIRED", "Authentication is required", 401);
        }
        return currentUser;
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
