package com.lyston.smartseat.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class ReservationServiceTest {

    private SeatSlotMapperFake seatSlotMapper;
    private ReservationMapperFake reservationMapper;
    private CheckinRecordMapperFake checkinRecordMapper;
    private ReservationRateLimiterFake reservationRateLimiter;
    private SeatSlotCacheServiceFake seatSlotCacheService;
    private ReservationRuleProperties reservationRuleProperties;
    private ReservationService reservationService;

    @BeforeEach
    void setUp() {
        seatSlotMapper = new SeatSlotMapperFake();
        reservationMapper = new ReservationMapperFake();
        checkinRecordMapper = new CheckinRecordMapperFake();
        reservationRateLimiter = new ReservationRateLimiterFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        reservationRuleProperties = new ReservationRuleProperties();
        reservationService = new ReservationService(
                seatSlotMapper.proxy(),
                reservationMapper.proxy(),
                checkinRecordMapper.proxy(),
                reservationRateLimiter,
                seatSlotCacheService,
                reservationRuleProperties
        );
    }

    @Test
    void createReservationShouldFailWhenAtomicReserveAffectsNoRows() {
        seatSlotMapper.reserveRows = 0;
        seatSlotMapper.slot = futureSeatSlot();

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Seat slot is not available");

        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldReserveSlotAttachReservationAndEvictCache() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        ReservationResponse response = reservationService.createReservation(new CreateReservationRequest(1L), 10L);

        assertThat(response.seatSlotId()).isEqualTo(1L);
        assertThat(response.seatId()).isEqualTo(2L);
        assertThat(response.userId()).isEqualTo(10L);
        assertThat(response.status()).isEqualTo(ReservationStatus.RESERVED);
        assertThat(reservationRateLimiter.checkedUserId).isEqualTo(10L);
        assertThat(reservationMapper.overlapUserId).isEqualTo(10L);
        assertThat(reservationMapper.insertedReservation).isNotNull();
        assertThat(reservationMapper.dailyLimitUserId).isEqualTo(10L);
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(futureDate());
    }

    @Test
    void createReservationShouldRejectPastSlot() {
        seatSlotMapper.slot = pastSeatSlot();

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Past seat slots cannot be reserved");

        assertThat(seatSlotMapper.reserveRows).isZero();
        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldRejectSlotBeyondAdvanceWindow() {
        seatSlotMapper.slot = seatSlot(LocalDate.now().plusDays(8), LocalTime.of(8, 0), LocalTime.of(10, 0));

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Seat slot is beyond the reservation window");

        assertThat(seatSlotMapper.reserveRows).isZero();
        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldRejectWhenDailyActiveLimitReached() {
        seatSlotMapper.slot = futureSeatSlot();
        reservationMapper.dailyActiveCount = reservationRuleProperties.getDailyActiveReservationLimit();

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User has reached the daily active reservation limit");

        assertThat(seatSlotMapper.reserveRows).isZero();
        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldRejectOverlappingActiveReservation() {
        seatSlotMapper.slot = futureSeatSlot();
        reservationMapper.activeOverlapCount = 1;

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User already has an active reservation in this period");

        assertThat(seatSlotMapper.reserveRows).isZero();
        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void checkOutShouldMoveReservationAndSlotBackToAvailable() {
        reservationMapper.reservation = reservation();
        reservationMapper.markCheckedOutRows = 1;
        seatSlotMapper.releaseUsingRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        ReservationResponse response = reservationService.checkOut(100L, 10L);

        assertThat(response.reservationId()).isEqualTo(100L);
        assertThat(checkinRecordMapper.insertedRecord).isNotNull();
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(futureDate());
    }

    @Test
    void checkInShouldFailWhenCodeOrOwnershipDoesNotMatch() {
        reservationMapper.reservation = reservation();
        reservationMapper.markCheckedInRows = 0;

        assertThatThrownBy(() -> reservationService.checkIn(100L, new CheckinRequest("bad-code"), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Reservation cannot be checked in");

        assertThat(seatSlotMapper.markUsingRows).isZero();
    }

    @Test
    void cancelShouldReleaseReservedSlotAndRecordAction() {
        reservationMapper.reservation = reservation();
        reservationMapper.markCancelledRows = 1;
        seatSlotMapper.releaseReservedRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        ReservationResponse response = reservationService.cancel(100L, 10L);

        assertThat(response.reservationId()).isEqualTo(100L);
        assertThat(checkinRecordMapper.insertedRecord).isNotNull();
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("CANCEL");
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
    }

    private LocalDate futureDate() {
        return LocalDate.now().plusDays(7);
    }

    private SeatSlot futureSeatSlot() {
        return seatSlot(futureDate(), LocalTime.of(8, 0), LocalTime.of(10, 0));
    }

    private SeatSlot pastSeatSlot() {
        return seatSlot(LocalDateTime.now().minusDays(1).toLocalDate(), LocalTime.of(8, 0), LocalTime.of(10, 0));
    }

    private SeatSlot seatSlot(LocalDate slotDate, LocalTime startTime, LocalTime endTime) {
        SeatSlot slot = new SeatSlot();
        slot.setId(1L);
        slot.setSeatId(2L);
        slot.setAreaId(1L);
        slot.setSlotDate(slotDate);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
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
        private int markUsingRows;
        private int releaseUsingRows;
        private int releaseReservedRows;

        SeatSlotMapper proxy() {
            return ReservationServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "reserveAvailableSlot" -> reserveRows;
                case "attachReservation" -> attachRows;
                case "markUsing" -> {
                    markUsingRows++;
                    yield markUsingRows == 1 ? 0 : markUsingRows;
                }
                case "releaseUsingSlot" -> releaseUsingRows;
                case "releaseReservedSlot" -> releaseReservedRows;
                case "selectById" -> slot;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class ReservationMapperFake {
        private Reservation reservation;
        private Reservation insertedReservation;
        private int markCheckedInRows;
        private int markCheckedOutRows;
        private int markCancelledRows;
        private int activeOverlapCount;
        private int dailyActiveCount;
        private Long overlapUserId;
        private Long dailyLimitUserId;

        ReservationMapper proxy() {
            return ReservationServiceTest.proxy(ReservationMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "insert" -> {
                    insertedReservation = (Reservation) args[0];
                    insertedReservation.setId(200L);
                    yield 1;
                }
                case "selectById" -> reservation;
                case "markCheckedIn" -> markCheckedInRows;
                case "markCheckedOut" -> markCheckedOutRows;
                case "markCancelled" -> markCancelledRows;
                case "countActiveOverlappingReservations" -> {
                    overlapUserId = (Long) args[0];
                    yield activeOverlapCount;
                }
                case "countDailyActiveReservations" -> {
                    dailyLimitUserId = (Long) args[0];
                    yield dailyActiveCount;
                }
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
