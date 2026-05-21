package com.lyston.smartseat.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckinIpTestRequest(
        @NotBlank @Size(max = 512) String checkinIpCidrs
) {
}
