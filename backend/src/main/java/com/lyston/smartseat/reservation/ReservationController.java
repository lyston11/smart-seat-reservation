package com.lyston.smartseat.reservation;

import com.lyston.smartseat.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ApiResponse<List<ReservationResponse>> listUserReservations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.ok(reservationService.listUserReservations(userId, limit));
    }

    @PostMapping
    public ApiResponse<ReservationResponse> createReservation(@Valid @RequestBody CreateReservationRequest request) {
        return ApiResponse.ok(reservationService.createReservation(request));
    }

    @PostMapping("/{reservationId}/check-in")
    public ApiResponse<ReservationResponse> checkIn(
            @PathVariable Long reservationId,
            @Valid @RequestBody CheckinRequest request
    ) {
        return ApiResponse.ok(reservationService.checkIn(reservationId, request));
    }

    @PostMapping("/{reservationId}/check-out")
    public ApiResponse<ReservationResponse> checkOut(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationActionRequest request
    ) {
        return ApiResponse.ok(reservationService.checkOut(reservationId, request));
    }

    @PostMapping("/{reservationId}/cancel")
    public ApiResponse<ReservationResponse> cancel(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationActionRequest request
    ) {
        return ApiResponse.ok(reservationService.cancel(reservationId, request));
    }

    @PostMapping("/expire-overdue")
    public ApiResponse<Integer> expireOverdueReservations(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(reservationService.expireOverdueReservations(limit));
    }
}
