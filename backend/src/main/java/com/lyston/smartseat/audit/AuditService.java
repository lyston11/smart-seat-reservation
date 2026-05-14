package com.lyston.smartseat.audit;

import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogMapper auditLogMapper;

    public AuditService(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    public void record(Long actorUserId, String action, String targetType, Long targetId, String reason) {
        AuditLog log = new AuditLog();
        log.setActorUserId(actorUserId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setReason(reason == null ? null : reason.trim());
        log.setCreatedAt(LocalDateTime.now());
        auditLogMapper.insert(log);
    }
}
