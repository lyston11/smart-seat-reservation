package com.lyston.smartseat.reservation;

import java.time.LocalDateTime;

public record WifiPresenceResponse(
        Long reservationId,
        String status,
        LocalDateTime lastWifiSeenAt,
        int offlineReleaseMinutes
) {

    public static WifiPresenceResponse from(Reservation reservation, int offlineReleaseMinutes) {
        return new WifiPresenceResponse(
                reservation.getId(),
                reservation.getStatus(),
                reservation.getLastWifiSeenAt(),
                offlineReleaseMinutes
        );
    }
}
