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

    @DeleteMapping("/{seatSlotId}")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<SeatSlotResponse> cancelSeatSlot(@PathVariable Long seatSlotId) {
        return ApiResponse.ok(seatSlotService.cancelSeatSlot(seatSlotId));
    }
}
