package com.lyston.smartseat.dashboard;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.ADMIN_DASHBOARD)
@RequireRole(UserRole.ADMIN)
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ApiResponse<DashboardResponse> getDashboard(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return ApiResponse.ok(dashboardService.getDashboard(date == null ? LocalDate.now() : date));
    }
}
