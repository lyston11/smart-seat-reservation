package com.lyston.smartseat.reservation;

import com.lyston.smartseat.auth.CurrentUser;
import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
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
    private final ReservationRuleProperties reservationRuleProperties;

    public ReservationController(
            ReservationService reservationService,
            ReservationRuleProperties reservationRuleProperties
    ) {
        this.reservationService = reservationService;
        this.reservationRuleProperties = reservationRuleProperties;
    }

    @GetMapping("/rules")
    public ApiResponse<ReservationRuleResponse> getReservationRules() {
        return ApiResponse.ok(ReservationRuleResponse.from(reservationRuleProperties));
    }

    @GetMapping
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<List<ReservationResponse>> listUserReservations(
            @RequestParam(defaultValue = "50") int limit,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.listUserReservations(currentUser.id(), limit));
    }

    @PostMapping
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.createReservation(request, currentUser.id()));
    }

    @PostMapping("/{reservationId}/check-in")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> checkIn(
            @PathVariable Long reservationId,
            @Valid @RequestBody CheckinRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.checkIn(reservationId, request, currentUser.id()));
    }

    @PostMapping("/{reservationId}/check-out")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> checkOut(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.checkOut(reservationId, currentUser.id()));
    }

    @PostMapping("/{reservationId}/cancel")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> cancel(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.cancel(reservationId, currentUser.id()));
    }

    @PostMapping("/expire-overdue")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<Integer> expireOverdueReservations(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(reservationService.expireOverdueReservations(limit));
    }
}
