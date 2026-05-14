package com.lyston.smartseat.admin;

import com.lyston.smartseat.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/seat-slots")
public class AdminSeatSlotController {

    private final AdminSeatSlotService adminSeatSlotService;

    public AdminSeatSlotController(AdminSeatSlotService adminSeatSlotService) {
        this.adminSeatSlotService = adminSeatSlotService;
    }

    @PostMapping("/{seatSlotId}/release")
    public ApiResponse<AdminSeatSlotReleaseResponse> releaseSeatSlot(
            @PathVariable Long seatSlotId,
            @Valid @RequestBody AdminSeatSlotReleaseRequest request
    ) {
        return ApiResponse.ok(adminSeatSlotService.releaseSeatSlot(seatSlotId, request));
    }
}
