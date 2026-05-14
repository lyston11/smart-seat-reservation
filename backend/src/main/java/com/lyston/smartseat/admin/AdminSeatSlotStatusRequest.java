package com.lyston.smartseat.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminSeatSlotStatusRequest(
        @NotBlank @Size(max = 255) String reason
) {
}
