package com.lyston.smartseat.seat;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.SEAT_SLOTS)
public class SeatSlotController {

    private final SeatSlotService seatSlotService;

    public SeatSlotController(SeatSlotService seatSlotService) {
        this.seatSlotService = seatSlotService;
    }

    @GetMapping
    public ApiResponse<List<SeatSlotResponse>> listSeatSlots(
            @RequestParam Long areaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ApiResponse.ok(seatSlotService.listSeatSlots(areaId, date));
    }

    @PostMapping("/publish")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<PublishSeatSlotsResponse> publishSeatSlots(
            @Valid @RequestBody PublishSeatSlotsRequest request
    ) {
        return ApiResponse.ok(seatSlotService.publishSeatSlots(request));
    }

    @PostMapping("/publish-batch")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<PublishSeatSlotsBatchResponse> publishSeatSlotsBatch(
            @Valid @RequestBody PublishSeatSlotsBatchRequest request
    ) {
        return ApiResponse.ok(seatSlotService.publishSeatSlotsBatch(request));
    }

    @GetMapping("/publish-plans")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<List<SeatSlotPublishPlanResponse>> listPublishPlans(@RequestParam Long areaId) {
        return ApiResponse.ok(seatSlotService.listPublishPlans(areaId));
    }

    @PostMapping("/publish-plans")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatSlotPublishPlanResponse> createPublishPlan(
            @Valid @RequestBody CreateSeatSlotPublishPlanRequest request
    ) {
        return ApiResponse.ok(seatSlotService.createPublishPlan(request));
    }

    @PostMapping("/publish-plans/{planId}/stop")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<StopSeatSlotPublishPlanResponse> stopPublishPlan(
            @PathVariable Long planId,
            @Valid @RequestBody StopSeatSlotPublishPlanRequest request
    ) {
        return ApiResponse.ok(seatSlotService.stopPublishPlan(planId, request));
    }

    @PostMapping("/cancel-batch")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<CancelSeatSlotsBatchResponse> cancelSeatSlotsBatch(
            @Valid @RequestBody CancelSeatSlotsBatchRequest request
    ) {
        return ApiResponse.ok(seatSlotService.cancelSeatSlotsBatch(request));
    }

    @DeleteMapping
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<CancelSeatSlotsByDateResponse> cancelSeatSlotsByDate(
            @RequestParam Long areaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ApiResponse.ok(seatSlotService.cancelSeatSlotsByDate(areaId, date));
    }

    @DeleteMapping("/{seatSlotId}")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatSlotResponse> cancelSeatSlot(@PathVariable Long seatSlotId) {
        return ApiResponse.ok(seatSlotService.cancelSeatSlot(seatSlotId));
    }
}
