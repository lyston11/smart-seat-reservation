package com.lyston.smartseat.reservation;

import static org.assertj.core.api.Assertions.assertThat;

import com.lyston.smartseat.audit.AuditAction;
import com.lyston.smartseat.audit.AuditService;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReservationRuleServiceTest {

    private ReservationRuleMapperFake reservationRuleMapper;
    private AuditServiceFake auditService;
    private ReservationRuleService reservationRuleService;

    @BeforeEach
    void setUp() {
        reservationRuleMapper = new ReservationRuleMapperFake();
        auditService = new AuditServiceFake();
        reservationRuleService = new ReservationRuleService(
                reservationRuleMapper.proxy(),
                new ReservationRuleProperties(),
                auditService
        );
    }

    @Test
    void getRulesShouldFallbackToPropertiesWhenDatabaseRuleMissing() {
        ReservationRuleProperties properties = new ReservationRuleProperties();
        properties.setCheckinGraceMinutes(20);
        properties.setCheckinLeadMinutes(8);
        properties.setMaxAdvanceDays(5);
        properties.setReservationOpenHour(18);
        properties.setDailyActiveReservationLimit(2);
        properties.setWifiOfflineReleaseMinutes(18);
        properties.setSeatLockMinutes(60);
        reservationRuleService = new ReservationRuleService(reservationRuleMapper.proxy(), properties, auditService);

        ReservationRuleResponse response = reservationRuleService.getRules();

        assertThat(response.checkinGraceMinutes()).isEqualTo(20);
        assertThat(response.checkinLeadMinutes()).isEqualTo(8);
        assertThat(response.maxAdvanceDays()).isEqualTo(5);
        assertThat(response.reservationOpenHour()).isEqualTo(18);
        assertThat(response.dailyActiveReservationLimit()).isEqualTo(2);
        assertThat(response.wifiOfflineReleaseMinutes()).isEqualTo(18);
        assertThat(response.seatLockMinutes()).isEqualTo(60);
        assertThat(response.updatedBy()).isNull();
    }

    @Test
    void updateRulesShouldPersistAndWriteAuditLog() {
        ReservationRule rule = reservationRule();
        reservationRuleMapper.rule = rule;

        ReservationRuleResponse response = reservationRuleService.updateRules(
                new UpdateReservationRuleRequest(30, 12, 10, 18, 4, 20, 60),
                2L
        );

        assertThat(response.checkinGraceMinutes()).isEqualTo(30);
        assertThat(response.checkinLeadMinutes()).isEqualTo(12);
        assertThat(response.maxAdvanceDays()).isEqualTo(10);
        assertThat(response.reservationOpenHour()).isEqualTo(18);
        assertThat(response.dailyActiveReservationLimit()).isEqualTo(4);
        assertThat(response.wifiOfflineReleaseMinutes()).isEqualTo(20);
        assertThat(response.seatLockMinutes()).isEqualTo(60);
        assertThat(response.updatedBy()).isEqualTo(2L);
        assertThat(reservationRuleMapper.updatedRule).isSameAs(rule);
        assertThat(auditService.action).isEqualTo(AuditAction.RESERVATION_RULE_UPDATE);
        assertThat(auditService.targetType).isEqualTo("RESERVATION_RULE");
    }

    private ReservationRule reservationRule() {
        ReservationRule rule = new ReservationRule();
        rule.setId(1L);
        rule.setCheckinGraceMinutes(15);
        rule.setCheckinLeadMinutes(10);
        rule.setMaxAdvanceDays(7);
        rule.setReservationOpenHour(18);
        rule.setDailyActiveReservationLimit(3);
        rule.setWifiOfflineReleaseMinutes(15);
        rule.setSeatLockMinutes(60);
        rule.setUpdatedAt(LocalDateTime.of(2026, 5, 15, 10, 0));
        return rule;
    }

    private static final class ReservationRuleMapperFake {
        private ReservationRule rule;
        private ReservationRule updatedRule;

        ReservationRuleMapper proxy() {
            return ReservationRuleServiceTest.proxy(ReservationRuleMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> rule;
                case "updateById" -> {
                    updatedRule = (ReservationRule) args[0];
                    yield 1;
                }
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class AuditServiceFake extends AuditService {
        private String action;
        private String targetType;

        AuditServiceFake() {
            super(null);
        }

        @Override
        public void record(Long actorUserId, String action, String targetType, Long targetId, String reason) {
            this.action = action;
            this.targetType = targetType;
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
