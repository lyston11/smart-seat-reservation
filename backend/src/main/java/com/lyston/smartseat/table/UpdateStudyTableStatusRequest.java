package com.lyston.smartseat.table;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateStudyTableStatusRequest(
        @NotBlank @Size(max = 32) String status
) {
}
