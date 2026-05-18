package com.lyston.smartseat.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record UpdateAreaRequest(
        @NotBlank @Size(max = 64) String name,
        @Size(max = 32) String floor,
        @Size(max = 255) String description,
        @NotNull String status,
        LocalTime openTime,
        LocalTime closeTime
) {

    public UpdateAreaRequest(String name, String floor, String description, String status) {
        this(name, floor, description, status, null, null);
    }
}
