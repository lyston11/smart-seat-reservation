package com.lyston.smartseat.admin;

import jakarta.validation.constraints.NotNull;

public record AdminSeatSlotReleaseRequest(
        @NotNull Long adminUserId
) {
}
