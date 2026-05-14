package com.lyston.smartseat.admin;

import com.lyston.smartseat.auth.CurrentUser;
import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/seat-slots")
@RequireRole(UserRole.ADMIN)
public class AdminSeatSlotController {

    private final AdminSeatSlotService adminSeatSlotService;

    public AdminSeatSlotController(AdminSeatSlotService adminSeatSlotService) {
        this.adminSeatSlotService = adminSeatSlotService;
    }

    @PostMapping("/{seatSlotId}/release")
    public ApiResponse<AdminSeatSlotReleaseResponse> releaseSeatSlot(
            @PathVariable Long seatSlotId,
            @Valid @RequestBody AdminSeatSlotReleaseRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(adminSeatSlotService.releaseSeatSlot(seatSlotId, request, currentUser.id()));
    }
}
