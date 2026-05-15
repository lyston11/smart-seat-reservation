package com.lyston.smartseat.audit;

import java.time.LocalDateTime;

public record AuditLogQuery(
        String action,
        Long actorUserId,
        String targetType,
        LocalDateTime startAt,
        LocalDateTime endAt,
        Integer limit
) {
}
