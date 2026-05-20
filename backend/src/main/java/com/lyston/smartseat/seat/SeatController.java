package com.lyston.smartseat.seat;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.SEATS)
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping
    @RequireRole({UserRole.STUDENT, UserRole.ADMIN})
    public ApiResponse<List<SeatResponse>> listSeats(@RequestParam Long areaId) {
        return ApiResponse.ok(seatService.listSeats(areaId));
    }

    @PostMapping
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatResponse> createSeat(@Valid @RequestBody CreateSeatRequest request) {
        return ApiResponse.ok(seatService.createSeat(request));
    }

    @PutMapping("/{seatId}")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatResponse> updateSeat(
            @PathVariable Long seatId,
            @Valid @RequestBody UpdateSeatRequest request
    ) {
        return ApiResponse.ok(seatService.updateSeat(seatId, request));
    }

    @PatchMapping("/{seatId}/status")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatResponse> updateSeatStatus(
            @PathVariable Long seatId,
            @Valid @RequestBody UpdateSeatStatusRequest request
    ) {
        return ApiResponse.ok(seatService.updateSeatStatus(seatId, request));
    }
}
