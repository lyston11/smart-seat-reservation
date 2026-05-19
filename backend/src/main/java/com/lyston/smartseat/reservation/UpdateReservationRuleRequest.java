package com.lyston.smartseat.reservation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateReservationRuleRequest(
        @NotNull @Min(1) @Max(120) Integer checkinGraceMinutes,
        @NotNull @Min(0) @Max(120) Integer checkinLeadMinutes,
        @NotNull @Min(0) @Max(30) Integer maxAdvanceDays,
        @NotNull @Min(0) @Max(23) Integer reservationOpenHour,
        @NotNull @Min(1) @Max(12) Integer dailyActiveReservationLimit,
        @NotNull @Min(1) @Max(120) Integer wifiOfflineReleaseMinutes,
        @NotNull @Min(1) @Max(180) Integer seatLockMinutes
) {
}
