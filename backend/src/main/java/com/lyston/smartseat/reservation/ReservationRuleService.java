package com.lyston.smartseat.reservation;

import com.lyston.smartseat.audit.AuditAction;
import com.lyston.smartseat.audit.AuditService;
import com.lyston.smartseat.common.BusinessException;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationRuleService {

    private static final Long RULE_ID = 1L;

    private final ReservationRuleMapper reservationRuleMapper;
    private final ReservationRuleProperties reservationRuleProperties;
    private final AuditService auditService;

    public ReservationRuleService(
            ReservationRuleMapper reservationRuleMapper,
            ReservationRuleProperties reservationRuleProperties,
            AuditService auditService
    ) {
        this.reservationRuleMapper = reservationRuleMapper;
        this.reservationRuleProperties = reservationRuleProperties;
        this.auditService = auditService;
    }

    public ReservationRuleResponse getRules() {
        ReservationRule rule = reservationRuleMapper.selectById(RULE_ID);
        if (rule == null) {
            return ReservationRuleResponse.from(reservationRuleProperties);
        }
        return ReservationRuleResponse.from(rule);
    }

    @Transactional
    public ReservationRuleResponse updateRules(UpdateReservationRuleRequest request, Long actorUserId) {
        ReservationRule rule = reservationRuleMapper.selectById(RULE_ID);
        if (rule == null) {
            throw new BusinessException("RESERVATION_RULE_NOT_FOUND", "Reservation rule not found");
        }

        rule.setCheckinGraceMinutes(request.checkinGraceMinutes());
        rule.setCheckinLeadMinutes(request.checkinLeadMinutes());
        rule.setMaxAdvanceDays(request.maxAdvanceDays());
        rule.setDailyActiveReservationLimit(request.dailyActiveReservationLimit());
        rule.setWifiOfflineReleaseMinutes(request.wifiOfflineReleaseMinutes());
        rule.setUpdatedBy(actorUserId);
        rule.setUpdatedAt(LocalDateTime.now());
        reservationRuleMapper.updateById(rule);

        auditService.record(actorUserId, AuditAction.RESERVATION_RULE_UPDATE, "RESERVATION_RULE", RULE_ID, "update rules");
        return ReservationRuleResponse.from(rule);
    }
}
