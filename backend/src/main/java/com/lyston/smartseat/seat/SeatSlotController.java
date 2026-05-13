package com.lyston.smartseat.seat;

import com.lyston.smartseat.common.ApiResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seat-slots")
public class SeatSlotController {

    private final SeatSlotMapper seatSlotMapper;

    public SeatSlotController(SeatSlotMapper seatSlotMapper) {
        this.seatSlotMapper = seatSlotMapper;
    }

    @GetMapping
    public ApiResponse<List<SeatSlotResponse>> listSeatSlots(
            @RequestParam Long areaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<SeatSlotResponse> slots = seatSlotMapper.findByAreaAndDate(areaId, date)
                .stream()
                .map(SeatSlotResponse::from)
                .toList();
        return ApiResponse.ok(slots);
    }
}
