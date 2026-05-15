package com.lyston.smartseat.audit;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        Long actorUserId,
        String action,
        String targetType,
        Long targetId,
        String reason,
        LocalDateTime createdAt
) {

    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorUserId(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getReason(),
                log.getCreatedAt()
        );
    }
}
