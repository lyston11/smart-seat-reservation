package com.lyston.smartseat.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lyston.smartseat.audit.AuditAction;
import com.lyston.smartseat.audit.AuditLogMapper;
import com.lyston.smartseat.audit.AuditService;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.reservation.Reservation;
import com.lyston.smartseat.reservation.ReservationMapper;
import com.lyston.smartseat.reservation.ReservationStatus;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import com.lyston.smartseat.seat.SeatSlotStatus;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AdminSeatSlotServiceTest {

    private SeatSlotMapperFake seatSlotMapper;
    private ReservationMapperFake reservationMapper;
    private CheckinRecordMapperFake checkinRecordMapper;
    private AuditServiceFake auditService;
    private SeatSlotCacheServiceFake seatSlotCacheService;
    private AdminSeatSlotService adminSeatSlotService;

    @BeforeEach
    void setUp() {
        seatSlotMapper = new SeatSlotMapperFake();
        reservationMapper = new ReservationMapperFake();
        checkinRecordMapper = new CheckinRecordMapperFake();
        auditService = new AuditServiceFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        adminSeatSlotService = new AdminSeatSlotService(
                seatSlotMapper.proxy(),
                reservationMapper.proxy(),
                checkinRecordMapper.proxy(),
                auditService,
                seatSlotCacheService
        );
    }

    @Test
    void releaseSeatSlotShouldMarkReservationRecordAuditAndEvictCache() {
        seatSlotMapper.slot = seatSlot();
        seatSlotMapper.releaseRows = 1;
        reservationMapper.reservation = reservation();
        reservationMapper.markAdminReleasedRows = 1;

        AdminSeatSlotReleaseResponse response = adminSeatSlotService.releaseSeatSlot(
                1L,
                new AdminSeatSlotReleaseRequest("现场确认空座"),
                2L
        );

        assertThat(response.reason()).isEqualTo("现场确认空座");
        assertThat(response.releasedBy()).isEqualTo(2L);
        assertThat(response.seatSlotStatus()).isEqualTo(SeatSlotStatus.AVAILABLE);
        assertThat(checkinRecordMapper.insertedRecord).isNotNull();
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(2L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(LocalDate.of(2026, 5, 21));
        assertThat(auditService.actorUserId).isEqualTo(2L);
        assertThat(auditService.action).isEqualTo(AuditAction.ADMIN_RELEASE_SEAT_SLOT);
        assertThat(auditService.targetType).isEqualTo("SEAT_SLOT");
        assertThat(auditService.targetId).isEqualTo(1L);
        assertThat(auditService.reason).isEqualTo("现场确认空座");
    }

    private SeatSlot seatSlot() {
        SeatSlot slot = new SeatSlot();
        slot.setId(1L);
        slot.setAreaId(2L);
        slot.setSlotDate(LocalDate.of(2026, 5, 21));
        slot.setStatus(SeatSlotStatus.RESERVED);
        slot.setReservationId(100L);
        return slot;
    }

    private Reservation reservation() {
        Reservation reservation = new Reservation();
        reservation.setId(100L);
        reservation.setSeatSlotId(1L);
        reservation.setSeatId(3L);
        reservation.setUserId(10L);
        reservation.setStatus(ReservationStatus.ADMIN_RELEASED);
        reservation.setCheckinCode("code");
        return reservation;
    }

    private static final class SeatSlotMapperFake {
        private SeatSlot slot;
        private int releaseRows;

        SeatSlotMapper proxy() {
            return AdminSeatSlotServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> slot;
                case "adminReleaseOccupiedSlot" -> releaseRows;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class ReservationMapperFake {
        private Reservation reservation;
        private int markAdminReleasedRows;

        ReservationMapper proxy() {
            return AdminSeatSlotServiceTest.proxy(ReservationMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> reservation;
                case "markAdminReleased" -> markAdminReleasedRows;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class CheckinRecordMapperFake {
        private CheckinRecord insertedRecord;

        CheckinRecordMapper proxy() {
            return AdminSeatSlotServiceTest.proxy(CheckinRecordMapper.class, (unused, method, args) -> {
                if ("insert".equals(method.getName())) {
                    insertedRecord = (CheckinRecord) args[0];
                    return 1;
                }
                return defaultValue(method.getReturnType());
            });
        }
    }

    private static final class AuditServiceFake extends AuditService {
        private Long actorUserId;
        private String action;
        private String targetType;
        private Long targetId;
        private String reason;

        AuditServiceFake() {
            super(AdminSeatSlotServiceTest.proxy(
                    AuditLogMapper.class,
                    (unused, method, args) -> defaultValue(method.getReturnType())
            ));
        }

        @Override
        public void record(Long actorUserId, String action, String targetType, Long targetId, String reason) {
            this.actorUserId = actorUserId;
            this.action = action;
            this.targetType = targetType;
            this.targetId = targetId;
            this.reason = reason;
        }
    }

    private static final class SeatSlotCacheServiceFake extends SeatSlotCacheService {
        private Long evictedAreaId;
        private LocalDate evictedDate;

        SeatSlotCacheServiceFake() {
            super(null, new ObjectMapper());
        }

        @Override
        public void evict(Long areaId, LocalDate date) {
            evictedAreaId = areaId;
            evictedDate = date;
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
