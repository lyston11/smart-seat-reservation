package com.lyston.smartseat.audit;

import static org.assertj.core.api.Assertions.assertThat;

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
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().reason()).isEqualTo("现场确认空座");
    }

    private static final class AuditLogMapperFake {
        private int requestedLimit;
        private List<AuditLog> logs = List.of();

        AuditLogMapper proxy() {
            return AuditLogServiceTest.proxy(AuditLogMapper.class, (unused, method, args) -> {
                if ("findRecent".equals(method.getName())) {
                    requestedLimit = (int) args[0];
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
