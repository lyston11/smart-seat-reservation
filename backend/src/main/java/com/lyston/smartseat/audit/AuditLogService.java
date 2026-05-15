package com.lyston.smartseat.audit;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;

    public AuditLogService(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    public List<AuditLogResponse> listAuditLogs(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return auditLogMapper.findRecent(safeLimit)
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }
}
