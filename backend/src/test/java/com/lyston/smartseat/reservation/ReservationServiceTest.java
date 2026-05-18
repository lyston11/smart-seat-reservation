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
    private ReservationRuleServiceFake reservationRuleService;
    private ReservationService reservationService;

    @BeforeEach
    void setUp() {
        seatSlotMapper = new SeatSlotMapperFake();
        reservationMapper = new ReservationMapperFake();
        checkinRecordMapper = new CheckinRecordMapperFake();
        reservationRateLimiter = new ReservationRateLimiterFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        reservationRuleProperties = new ReservationRuleProperties();
        reservationRuleService = new ReservationRuleServiceFake(reservationRuleProperties);
        reservationService = new ReservationService(
                seatSlotMapper.proxy(),
                reservationMapper.proxy(),
                checkinRecordMapper.proxy(),
                reservationRateLimiter,
                seatSlotCacheService,
                reservationRuleService
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
    void tableCheckInShouldCheckInMatchingReservationForCurrentUserAndTableToken() {
        Reservation reservation = reservedReservation();
        reservationMapper.reservation = reservation;
        reservationMapper.tableCheckinReservation = reservation;
        reservationMapper.markCheckedInRows = 1;
        seatSlotMapper.markUsingRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        ReservationResponse response = reservationService.tableCheckIn(
                new TableCheckinRequest("table-token", "code"),
                10L
        );

        assertThat(response.reservationId()).isEqualTo(100L);
        assertThat(response.status()).isEqualTo(ReservationStatus.CHECKED_IN);
        assertThat(reservationMapper.tableCheckinUserId).isEqualTo(10L);
        assertThat(reservationMapper.tableCheckinToken).isEqualTo("table-token");
        assertThat(reservationMapper.tableCheckinCode).isEqualTo("code");
        assertThat(seatSlotMapper.markUsingCalls).isEqualTo(1);
        assertThat(reservationMapper.markCheckedInReservationId).isEqualTo(100L);
        assertThat(reservationMapper.markCheckedInUserId).isEqualTo(10L);
        assertThat(reservationMapper.markCheckedInCheckinCode).isEqualTo("code");
        assertThat(seatSlotMapper.markUsingSeatSlotId).isEqualTo(1L);
        assertThat(seatSlotMapper.markUsingReservationId).isEqualTo(100L);
        assertThat(seatSlotMapper.markUsingUserId).isEqualTo(10L);
        assertThat(checkinRecordMapper.insertedRecord).isNotNull();
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("CHECK_IN");
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(futureDate());
    }

    @Test
    void createReservationShouldCreateCustomSlotFromSeatAndRequestedTimeRange() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.insertRows = 1;
        seatSlotMapper.insertedSlotId = 300L;
        seatSlotMapper.availableWindow = seatSlot(futureDate(), LocalTime.of(8, 0), LocalTime.of(22, 0));

        ReservationResponse response = reservationService.createReservation(
                new CreateReservationRequest(null, 2L, futureDate(), LocalTime.of(9, 30), LocalTime.of(17, 30)),
                10L
        );

        assertThat(response.seatSlotId()).isEqualTo(300L);
        assertThat(seatSlotMapper.insertedSlot.getSeatId()).isEqualTo(2L);
        assertThat(seatSlotMapper.insertedSlot.getStartTime()).isEqualTo(LocalTime.of(9, 30));
        assertThat(seatSlotMapper.insertedSlot.getEndTime()).isEqualTo(LocalTime.of(17, 30));
        assertThat(reservationMapper.insertedReservation.getExpiresAt())
                .isEqualTo(LocalDateTime.of(futureDate(), LocalTime.of(9, 30)).plusMinutes(15));
    }

    @Test
    void createReservationShouldReuseExistingExactCustomSlotWhenAvailable() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.insertRows = 1;
        SeatSlot exactWindow = seatSlot(futureDate(), LocalTime.of(9, 30), LocalTime.of(17, 30));
        exactWindow.setId(301L);
        seatSlotMapper.availableWindow = exactWindow;

        ReservationResponse response = reservationService.createReservation(
                new CreateReservationRequest(null, 2L, futureDate(), LocalTime.of(9, 30), LocalTime.of(17, 30)),
                10L
        );

        assertThat(response.seatSlotId()).isEqualTo(301L);
        assertThat(seatSlotMapper.insertedSlot).isNull();
    }

    @Test
    void createReservationShouldRejectCustomTimeOutsideOpenWindow() {
        seatSlotMapper.availableWindow = seatSlot(futureDate(), LocalTime.of(8, 0), LocalTime.of(22, 0));

        assertThatThrownBy(() -> reservationService.createReservation(
                new CreateReservationRequest(null, 2L, futureDate(), LocalTime.of(7, 30), LocalTime.of(22, 0)),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Reservation time is outside opening hours");
    }

    @Test
    void createReservationShouldRejectCustomTimeWhenSeatHasOverlappingReservation() {
        seatSlotMapper.availableWindow = seatSlot(futureDate(), LocalTime.of(8, 0), LocalTime.of(22, 0));
        seatSlotMapper.activeOverlapBySeatCount = 1;

        assertThatThrownBy(() -> reservationService.createReservation(
                new CreateReservationRequest(null, 2L, futureDate(), LocalTime.of(9, 30), LocalTime.of(17, 30)),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Seat already has an active reservation in this period");
    }

    @Test
    void tableCheckInShouldFailWhenNoReservationMatchesTableTokenOrCode() {
        assertThatThrownBy(() -> reservationService.tableCheckIn(
                new TableCheckinRequest("wrong-table", "bad-code"),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("No matching reservation for this table");

        assertThat(seatSlotMapper.markUsingRows).isZero();
        assertThat(checkinRecordMapper.insertedRecord).isNull();
    }

    @Test
    void tableCheckInShouldFailWhenReservationIsExpired() {
        Reservation reservation = reservedReservation();
        reservation.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        reservationMapper.tableCheckinReservation = reservation;

        assertThatThrownBy(() -> reservationService.tableCheckIn(
                new TableCheckinRequest("table-token", "code"),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Reservation has expired");

        assertThat(seatSlotMapper.markUsingRows).isZero();
        assertThat(checkinRecordMapper.insertedRecord).isNull();
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
        reservation.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return reservation;
    }

    private Reservation reservedReservation() {
        Reservation reservation = reservation();
        reservation.setStatus(ReservationStatus.RESERVED);
        return reservation;
    }

    private static final class SeatSlotMapperFake {
        private SeatSlot slot;
        private int reserveRows;
        private int attachRows;
        private int markUsingRows;
        private int markUsingCalls;
        private Long markUsingSeatSlotId;
        private Long markUsingReservationId;
        private Long markUsingUserId;
        private int releaseUsingRows;
        private int releaseReservedRows;
        private int insertRows;
        private Long insertedSlotId;
        private SeatSlot insertedSlot;
        private SeatSlot availableWindow;
        private int activeOverlapBySeatCount;

        SeatSlotMapper proxy() {
            return ReservationServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "reserveAvailableSlot" -> reserveRows;
                case "attachReservation" -> attachRows;
                case "markUsing" -> {
                    markUsingCalls++;
                    markUsingSeatSlotId = (Long) args[0];
                    markUsingReservationId = (Long) args[1];
                    markUsingUserId = (Long) args[2];
                    yield markUsingRows;
                }
                case "releaseUsingSlot" -> releaseUsingRows;
                case "releaseReservedSlot" -> releaseReservedRows;
                case "findAvailableWindowForSeat" -> availableWindow;
                case "countActiveOverlappingSlotsBySeat" -> activeOverlapBySeatCount;
                case "insert" -> {
                    insertedSlot = (SeatSlot) args[0];
                    insertedSlot.setId(insertedSlotId);
                    yield insertRows;
                }
                case "selectById" -> slot;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class ReservationMapperFake {
        private Reservation reservation;
        private Reservation tableCheckinReservation;
        private Reservation insertedReservation;
        private int markCheckedInRows;
        private int markCheckedOutRows;
        private int markCancelledRows;
        private int activeOverlapCount;
        private int dailyActiveCount;
        private Long overlapUserId;
        private Long dailyLimitUserId;
        private Long tableCheckinUserId;
        private String tableCheckinToken;
        private String tableCheckinCode;
        private Long markCheckedInReservationId;
        private Long markCheckedInUserId;
        private String markCheckedInCheckinCode;

        ReservationMapper proxy() {
            return ReservationServiceTest.proxy(ReservationMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "insert" -> {
                    insertedReservation = (Reservation) args[0];
                    insertedReservation.setId(200L);
                    yield 1;
                }
                case "selectById" -> reservation;
                case "findReservedForTableCheckin" -> {
                    tableCheckinUserId = (Long) args[0];
                    tableCheckinToken = (String) args[1];
                    tableCheckinCode = (String) args[2];
                    yield tableCheckinReservation;
                }
                case "markCheckedIn" -> {
                    markCheckedInReservationId = (Long) args[0];
                    markCheckedInUserId = (Long) args[1];
                    markCheckedInCheckinCode = (String) args[2];
                    if (markCheckedInRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.CHECKED_IN);
                        reservation.setCheckedInAt((LocalDateTime) args[3]);
                    }
                    yield markCheckedInRows;
                }
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

    private static final class ReservationRuleServiceFake extends ReservationRuleService {
        private final ReservationRuleProperties properties;

        ReservationRuleServiceFake(ReservationRuleProperties properties) {
            super(null, properties, null);
            this.properties = properties;
        }

        @Override
        public ReservationRuleResponse getRules() {
            return ReservationRuleResponse.from(properties);
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
