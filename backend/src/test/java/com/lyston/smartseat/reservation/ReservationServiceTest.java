package com.lyston.smartseat.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lyston.smartseat.cache.ReservationRateLimiter;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReservationServiceTest {

    private SeatSlotMapperFake seatSlotMapper;
    private ReservationMapperFake reservationMapper;
    private CheckinRecordMapperFake checkinRecordMapper;
    private ReservationRateLimiterFake reservationRateLimiter;
    private SeatSlotCacheServiceFake seatSlotCacheService;
    private ReservationService reservationService;

    @BeforeEach
    void setUp() {
        seatSlotMapper = new SeatSlotMapperFake();
        reservationMapper = new ReservationMapperFake();
        checkinRecordMapper = new CheckinRecordMapperFake();
        reservationRateLimiter = new ReservationRateLimiterFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        reservationService = new ReservationService(
                seatSlotMapper.proxy(),
                reservationMapper.proxy(),
                checkinRecordMapper.proxy(),
                reservationRateLimiter,
                seatSlotCacheService
        );
    }

    @Test
    void createReservationShouldFailWhenAtomicReserveAffectsNoRows() {
        seatSlotMapper.reserveRows = 0;

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Seat slot is not available");

        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldReserveSlotAttachReservationAndEvictCache() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.slot = seatSlot();

        ReservationResponse response = reservationService.createReservation(new CreateReservationRequest(1L), 10L);

        assertThat(response.seatSlotId()).isEqualTo(1L);
        assertThat(response.seatId()).isEqualTo(2L);
        assertThat(response.userId()).isEqualTo(10L);
        assertThat(response.status()).isEqualTo(ReservationStatus.RESERVED);
        assertThat(reservationRateLimiter.checkedUserId).isEqualTo(10L);
        assertThat(reservationMapper.insertedReservation).isNotNull();
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(LocalDate.of(2026, 5, 20));
    }

    @Test
    void checkOutShouldMoveReservationAndSlotBackToAvailable() {
        reservationMapper.reservation = reservation();
        reservationMapper.markCheckedOutRows = 1;
        seatSlotMapper.releaseUsingRows = 1;
        seatSlotMapper.slot = seatSlot();

        ReservationResponse response = reservationService.checkOut(100L, 10L);

        assertThat(response.reservationId()).isEqualTo(100L);
        assertThat(checkinRecordMapper.insertedRecord).isNotNull();
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(LocalDate.of(2026, 5, 20));
    }

    private SeatSlot seatSlot() {
        SeatSlot slot = new SeatSlot();
        slot.setId(1L);
        slot.setSeatId(2L);
        slot.setAreaId(1L);
        slot.setSlotDate(LocalDate.of(2026, 5, 20));
        slot.setStartTime(LocalTime.of(8, 0));
        slot.setEndTime(LocalTime.of(10, 0));
        return slot;
    }

    private Reservation reservation() {
        Reservation reservation = new Reservation();
        reservation.setId(100L);
        reservation.setUserId(10L);
        reservation.setSeatId(2L);
        reservation.setSeatSlotId(1L);
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setCheckinCode("code");
        return reservation;
    }

    private static final class SeatSlotMapperFake {
        private SeatSlot slot;
        private int reserveRows;
        private int attachRows;
        private int releaseUsingRows;

        SeatSlotMapper proxy() {
            return ReservationServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "reserveAvailableSlot" -> reserveRows;
                case "attachReservation" -> attachRows;
                case "releaseUsingSlot" -> releaseUsingRows;
                case "selectById" -> slot;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class ReservationMapperFake {
        private Reservation reservation;
        private Reservation insertedReservation;
        private int markCheckedOutRows;

        ReservationMapper proxy() {
            return ReservationServiceTest.proxy(ReservationMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "insert" -> {
                    insertedReservation = (Reservation) args[0];
                    insertedReservation.setId(200L);
                    yield 1;
                }
                case "selectById" -> reservation;
                case "markCheckedOut" -> markCheckedOutRows;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class CheckinRecordMapperFake {
        private CheckinRecord insertedRecord;

        CheckinRecordMapper proxy() {
            return ReservationServiceTest.proxy(CheckinRecordMapper.class, (unused, method, args) -> {
                if ("insert".equals(method.getName())) {
                    insertedRecord = (CheckinRecord) args[0];
                    return 1;
                }
                return defaultValue(method.getReturnType());
            });
        }
    }

    private static final class ReservationRateLimiterFake extends ReservationRateLimiter {
        private Long checkedUserId;

        ReservationRateLimiterFake() {
            super(null);
        }

        @Override
        public void check(Long userId) {
            checkedUserId = userId;
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
