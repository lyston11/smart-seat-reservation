package com.lyston.smartseat.auth;

import com.lyston.smartseat.user.User;

public record CurrentUser(
        Long id,
        String name,
        String studentNo,
        String role
) {

    public static CurrentUser from(User user) {
        return new CurrentUser(user.getId(), user.getName(), user.getStudentNo(), user.getRole());
    }
}
