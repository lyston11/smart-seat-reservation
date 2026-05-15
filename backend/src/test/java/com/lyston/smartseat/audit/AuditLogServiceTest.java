package com.lyston.smartseat.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.common.BusinessException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AuditLogServiceTest {

    private AuditLogMapperFake auditLogMapper;
    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogMapper = new AuditLogMapperFake();
        auditLogService = new AuditLogService(auditLogMapper.proxy());
    }

    @Test
    void listAuditLogsShouldClampLimitAndMapResponse() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setActorUserId(2L);
        log.setAction(AuditAction.ADMIN_RELEASE_SEAT_SLOT);
        log.setTargetType("SEAT_SLOT");
        log.setTargetId(3L);
        log.setReason("现场确认空座");
        log.setCreatedAt(LocalDateTime.of(2026, 5, 15, 10, 0));
        auditLogMapper.logs = List.of(log);

        List<AuditLogResponse> responses = auditLogService.listAuditLogs(500);

        assertThat(auditLogMapper.requestedLimit).isEqualTo(100);
        assertThat(auditLogMapper.actions).isEmpty();
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().reason()).isEqualTo("现场确认空座");
    }

    @Test
    void listAuditLogsShouldExpandAreaChangeActionAndApplyFilters() {
        LocalDateTime startAt = LocalDateTime.of(2026, 5, 15, 8, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 5, 15, 18, 0);

        auditLogService.listAuditLogs(new AuditLogQuery("AREA_CHANGE", 2L, "area", startAt, endAt, 20));

        assertThat(auditLogMapper.actions).containsExactly(
                AuditAction.AREA_CREATE,
                AuditAction.AREA_UPDATE,
                AuditAction.AREA_STATUS_UPDATE
        );
        assertThat(auditLogMapper.actorUserId).isEqualTo(2L);
        assertThat(auditLogMapper.targetType).isEqualTo("AREA");
        assertThat(auditLogMapper.startAt).isEqualTo(startAt);
        assertThat(auditLogMapper.endAt).isEqualTo(endAt);
        assertThat(auditLogMapper.requestedLimit).isEqualTo(20);
    }

    @Test
    void listAuditLogsShouldRejectInvalidTimeRange() {
        assertThatThrownBy(() -> auditLogService.listAuditLogs(new AuditLogQuery(
                null,
                null,
                null,
                LocalDateTime.of(2026, 5, 16, 8, 0),
                LocalDateTime.of(2026, 5, 15, 8, 0),
                50
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Audit start time must be before end time");
    }

    private static final class AuditLogMapperFake {
        private int requestedLimit;
        private List<String> actions = List.of();
        private Long actorUserId;
        private String targetType;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private List<AuditLog> logs = List.of();

        AuditLogMapper proxy() {
            return AuditLogServiceTest.proxy(AuditLogMapper.class, (unused, method, args) -> {
                if ("findByFilters".equals(method.getName())) {
                    actions = (List<String>) args[0];
                    actorUserId = (Long) args[1];
                    targetType = (String) args[2];
                    startAt = (LocalDateTime) args[3];
                    endAt = (LocalDateTime) args[4];
                    requestedLimit = (int) args[5];
                    return logs;
                }
                return defaultValue(method.getReturnType());
            });
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType.equals(int.class)) {
            return 0;
        }
        if (returnType.equals(boolean.class)) {
            return false;
        }
        return null;
    }
}
