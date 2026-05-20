package com.lyston.smartseat.reservation;

import com.lyston.smartseat.auth.CurrentUser;
import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.RESERVATION_RULES)
public class ReservationRuleController {

    private final ReservationRuleService reservationRuleService;

    public ReservationRuleController(ReservationRuleService reservationRuleService) {
        this.reservationRuleService = reservationRuleService;
    }

    @GetMapping
    public ApiResponse<ReservationRuleResponse> getReservationRules() {
        return ApiResponse.ok(reservationRuleService.getRules());
    }

    @PutMapping
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<ReservationRuleResponse> updateReservationRules(
            @Valid @RequestBody UpdateReservationRuleRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(reservationRuleService.updateRules(request, currentUser.id()));
    }
}
