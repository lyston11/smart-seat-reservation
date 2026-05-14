package com.lyston.smartseat.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String studentNo
) {
}
