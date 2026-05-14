package com.lyston.smartseat.dashboard;

import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final DashboardMapper dashboardMapper;

    public DashboardService(DashboardMapper dashboardMapper) {
        this.dashboardMapper = dashboardMapper;
    }

    public DashboardResponse getDashboard(LocalDate date) {
        DashboardSummary summary = dashboardMapper.summarizeByDate(date);
        if (summary == null) {
            summary = new DashboardSummary();
        }
        return new DashboardResponse(date, summary, dashboardMapper.summarizeAreaUsage(date));
    }
}
