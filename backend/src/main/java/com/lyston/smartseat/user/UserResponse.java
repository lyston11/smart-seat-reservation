package com.lyston.smartseat.user;

public record UserResponse(
        Long id,
        String name,
        String studentNo,
        String role
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getStudentNo(),
                user.getRole()
        );
    }
}
