package com.lyston.smartseat.seat;

import com.lyston.smartseat.common.ApiResponse;
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
@RequestMapping("/api/seats")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping
    public ApiResponse<List<SeatResponse>> listSeats(@RequestParam Long areaId) {
        return ApiResponse.ok(seatService.listSeats(areaId));
    }

    @PostMapping
    public ApiResponse<SeatResponse> createSeat(@Valid @RequestBody CreateSeatRequest request) {
        return ApiResponse.ok(seatService.createSeat(request));
    }

    @PutMapping("/{seatId}")
    public ApiResponse<SeatResponse> updateSeat(
            @PathVariable Long seatId,
            @Valid @RequestBody UpdateSeatRequest request
    ) {
        return ApiResponse.ok(seatService.updateSeat(seatId, request));
    }

    @PatchMapping("/{seatId}/status")
    public ApiResponse<SeatResponse> updateSeatStatus(
            @PathVariable Long seatId,
            @Valid @RequestBody UpdateSeatStatusRequest request
    ) {
        return ApiResponse.ok(seatService.updateSeatStatus(seatId, request));
    }
}
