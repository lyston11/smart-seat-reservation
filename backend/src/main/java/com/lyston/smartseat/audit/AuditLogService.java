package com.lyston.smartseat.audit;

import com.lyston.smartseat.common.BusinessException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 100;
    private static final String AREA_CHANGE = "AREA_CHANGE";
    private static final Set<String> SUPPORTED_ACTIONS = Set.of(
            AuditAction.ADMIN_RELEASE_SEAT_SLOT,
            AuditAction.ADMIN_MARK_SEAT_SLOT_ABNORMAL,
            AuditAction.ADMIN_RESTORE_SEAT_SLOT,
            AuditAction.AREA_CREATE,
            AuditAction.AREA_UPDATE,
            AuditAction.AREA_STATUS_UPDATE,
            AREA_CHANGE
    );
    private static final Set<String> SUPPORTED_TARGET_TYPES = Set.of("SEAT_SLOT", "AREA");
    private static final List<String> AREA_CHANGE_ACTIONS = List.of(
            AuditAction.AREA_CREATE,
            AuditAction.AREA_UPDATE,
            AuditAction.AREA_STATUS_UPDATE
    );

    private final AuditLogMapper auditLogMapper;

    public AuditLogService(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    public List<AuditLogResponse> listAuditLogs(int limit) {
        return listAuditLogs(new AuditLogQuery(null, null, null, null, null, limit));
    }

    public List<AuditLogResponse> listAuditLogs(AuditLogQuery query) {
        int safeLimit = normalizeLimit(query.limit());
        List<String> actions = normalizeActions(query.action());
        String targetType = normalizeTargetType(query.targetType());
        validateTimeRange(query.startAt(), query.endAt());

        return auditLogMapper.findByFilters(
                        actions,
                        query.actorUserId(),
                        targetType,
                        query.startAt(),
                        query.endAt(),
                        safeLimit
                )
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    private int normalizeLimit(Integer limit) {
        int requestedLimit = limit == null ? DEFAULT_LIMIT : limit;
        return Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
    }

    private List<String> normalizeActions(String action) {
        String normalizedAction = normalizeNullableUppercase(action);
        if (normalizedAction == null) {
            return List.of();
        }
        if (!SUPPORTED_ACTIONS.contains(normalizedAction)) {
            throw new BusinessException("INVALID_AUDIT_ACTION", "Audit action is invalid");
        }
        if (AREA_CHANGE.equals(normalizedAction)) {
            return new ArrayList<>(AREA_CHANGE_ACTIONS);
        }
        return List.of(normalizedAction);
    }

    private String normalizeTargetType(String targetType) {
        String normalizedTargetType = normalizeNullableUppercase(targetType);
        if (normalizedTargetType == null) {
            return null;
        }
        if (!SUPPORTED_TARGET_TYPES.contains(normalizedTargetType)) {
            throw new BusinessException("INVALID_AUDIT_TARGET_TYPE", "Audit target type is invalid");
        }
        return normalizedTargetType;
    }

    private String normalizeNullableUppercase(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private void validateTimeRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt != null && endAt != null && startAt.isAfter(endAt)) {
            throw new BusinessException("INVALID_AUDIT_TIME_RANGE", "Audit start time must be before end time");
        }
    }
}
