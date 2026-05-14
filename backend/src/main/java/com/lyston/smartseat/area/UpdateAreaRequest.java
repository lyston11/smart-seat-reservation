package com.lyston.smartseat.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateAreaRequest(
        @NotBlank @Size(max = 64) String name,
        @Size(max = 32) String floor,
        @Size(max = 255) String description,
        @NotNull String status
) {
}
