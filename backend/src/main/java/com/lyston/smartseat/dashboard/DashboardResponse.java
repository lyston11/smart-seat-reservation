package com.lyston.smartseat.dashboard;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        LocalDate date,
        DashboardSummary summary,
        List<AreaUsageSummary> areaUsage
) {
}
