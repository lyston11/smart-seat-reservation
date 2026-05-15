package com.lyston.smartseat.audit;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequireRole(UserRole.ADMIN)
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ApiResponse<List<AuditLogResponse>> listAuditLogs(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.ok(auditLogService.listAuditLogs(limit));
    }
}
