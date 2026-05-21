package com.lyston.smartseat.reservation;

import com.lyston.smartseat.auth.CurrentUser;
import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.network.ClientIpResolver;
import com.lyston.smartseat.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping(ApiPaths.RESERVATIONS)
public class ReservationController {

    private final ReservationService reservationService;
    private final ClientIpResolver clientIpResolver;

    public ReservationController(
            ReservationService reservationService,
            ClientIpResolver clientIpResolver
    ) {
        this.reservationService = reservationService;
        this.clientIpResolver = clientIpResolver;
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
            CurrentUser currentUser,
            HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(reservationService.checkIn(
                reservationId,
                request,
                currentUser.id(),
                clientIpResolver.resolve(servletRequest)
        ));
    }

    @PostMapping("/table-check-in")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> tableCheckIn(
            @Valid @RequestBody TableCheckinRequest request,
            CurrentUser currentUser,
            HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(reservationService.tableCheckIn(
                request,
                currentUser.id(),
                clientIpResolver.resolve(servletRequest)
        ));
    }

    @PostMapping("/seat-check-in")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> seatCheckIn(
            @Valid @RequestBody SeatCheckinRequest request,
            CurrentUser currentUser,
            HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(reservationService.seatCheckIn(
                request,
                currentUser.id(),
                clientIpResolver.resolve(servletRequest)
        ));
    }

    @PostMapping("/{reservationId}/wifi-presence")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<WifiPresenceResponse> markWifiPresence(
            @PathVariable Long reservationId,
            @Valid @RequestBody(required = false) WifiPresenceRequest request,
            CurrentUser currentUser,
            HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(reservationService.markWifiPresence(
                reservationId,
                request,
                currentUser.id(),
                clientIpResolver.resolve(servletRequest)
        ));
    }

    @PostMapping("/{reservationId}/seat-lock")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> lockSeat(
            @PathVariable Long reservationId,
            @Valid @RequestBody(required = false) ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.lockSeat(reservationId, currentUser.id()));
    }

    @PostMapping("/{reservationId}/seat-lock/reactivate")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> reactivateSeatLock(
            @PathVariable Long reservationId,
            @Valid @RequestBody CheckinRequest request,
            CurrentUser currentUser,
            HttpServletRequest servletRequest
    ) {
        return ApiResponse.ok(reservationService.reactivateSeatLock(
                reservationId,
                request,
                currentUser.id(),
                clientIpResolver.resolve(servletRequest)
        ));
    }

    @PostMapping("/{reservationId}/seat-lock/release")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> releaseSeatLock(
            @PathVariable Long reservationId,
            @Valid @RequestBody(required = false) ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.releaseSeatLock(reservationId, currentUser.id()));
    }

    @PostMapping("/{reservationId}/check-out")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> checkOut(
            @PathVariable Long reservationId,
            @Valid @RequestBody(required = false) ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.checkOut(reservationId, currentUser.id()));
    }

    @PostMapping("/{reservationId}/cancel")
    @RequireRole(UserRole.STUDENT)
    public ApiResponse<ReservationResponse> cancel(
            @PathVariable Long reservationId,
            @Valid @RequestBody(required = false) ReservationActionRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationService.cancel(reservationId, currentUser.id()));
    }
}
