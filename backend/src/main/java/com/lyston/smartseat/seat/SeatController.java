package com.lyston.smartseat.seat;

import com.lyston.smartseat.common.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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
}
