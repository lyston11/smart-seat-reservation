package com.lyston.smartseat.area;

import jakarta.validation.constraints.NotNull;

public record UpdateAreaStatusRequest(
        @NotNull String status
) {
}
