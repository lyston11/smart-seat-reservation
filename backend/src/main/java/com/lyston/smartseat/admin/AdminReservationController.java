package com.lyston.smartseat.admin;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.reservation.ReservationService;
import com.lyston.smartseat.user.UserRole;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.ADMIN_RESERVATIONS)
@RequireRole(UserRole.ADMIN)
public class AdminReservationController {

    private final ReservationService reservationService;

    public AdminReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("/expire-overdue")
    public ApiResponse<Integer> expireOverdueReservations(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(reservationService.expireOverdueReservations(limit));
    }

    @PostMapping("/release-wifi-offline")
    public ApiResponse<Integer> releaseWifiOfflineReservations(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(reservationService.releaseWifiOfflineReservations(limit));
    }

    @PostMapping("/release-expired-seat-locks")
    public ApiResponse<Integer> releaseExpiredSeatLocks(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(reservationService.releaseExpiredSeatLocks(limit));
    }
}
