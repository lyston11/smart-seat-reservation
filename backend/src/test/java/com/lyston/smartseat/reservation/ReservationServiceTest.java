package com.lyston.smartseat.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.cache.ReservationRateLimiter;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.network.IpRangeMatcher;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class ReservationServiceTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-05-19T10:00:00Z"),
            ZoneId.of("Asia/Shanghai")
    );
    private static final LocalDate TODAY = LocalDate.now(FIXED_CLOCK);
    private static final LocalDate TOMORROW = TODAY.plusDays(1);

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
                reservationRuleService,
                new IpRangeMatcher(),
                FIXED_CLOCK
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
        assertThat(response.seatNo()).isEqualTo("A-001");
        assertThat(response.tableNo()).isEqualTo("T01");
        assertThat(response.areaName()).isEqualTo("A 区");
        assertThat(response.slotDate()).isEqualTo(futureDate());
        assertThat(response.startTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(response.userId()).isEqualTo(10L);
        assertThat(response.status()).isEqualTo(ReservationStatus.RESERVED);
        assertThat(response.seatLockQuota()).isZero();
        assertThat(response.seatLockUsedCount()).isZero();
        assertThat(reservationRateLimiter.checkedUserId).isEqualTo(10L);
        assertThat(reservationMapper.overlapUserId).isEqualTo(10L);
        assertThat(reservationMapper.insertedReservation).isNotNull();
        assertThat(reservationMapper.dailyLimitUserId).isEqualTo(10L);
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(futureDate());
    }

    @Test
    void createReservationShouldRejectStartedTodaySlot() {
        seatSlotMapper.slot = seatSlot(TODAY, LocalTime.of(6, 0), LocalTime.of(7, 0));

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Past seat slots cannot be reserved");

        assertThat(seatSlotMapper.reserveRows).isZero();
        assertThat(reservationMapper.insertedReservation).isNull();
    }

    @Test
    void createReservationShouldAllowFutureTodaySlot() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.slot = seatSlot(TODAY, LocalTime.of(20, 0), LocalTime.of(22, 0));

        ReservationResponse response = reservationService.createReservation(new CreateReservationRequest(1L), 10L);

        assertThat(response.slotDate()).isEqualTo(TODAY);
        assertThat(response.startTime()).isEqualTo(LocalTime.of(20, 0));
        assertThat(reservationMapper.insertedReservation).isNotNull();
    }

    @Test
    void createReservationShouldRejectDateBeyondTomorrow() {
        seatSlotMapper.slot = seatSlot(TOMORROW.plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Only today's future slots and tomorrow's slots after the configured open hour can be reserved");

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
        seatSlotMapper.slot = checkinWindowSeatSlot();

        assertThatThrownBy(() -> reservationService.checkIn(
                100L,
                new CheckinRequest("bad-code"),
                10L,
                "10.10.1.20"
        ))
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
        seatSlotMapper.slot = checkinWindowSeatSlot();

        ReservationResponse response = reservationService.tableCheckIn(
                new TableCheckinRequest("table-token", "code"),
                10L,
                "10.10.1.20"
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
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(TODAY);
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
        assertThat(response.seatLockQuota()).isEqualTo(1);
    }

    @Test
    void createReservationShouldCalculateSeatLockQuotaFromContinuousReservationBoundaries() {
        seatSlotMapper.reserveRows = 1;
        seatSlotMapper.attachRows = 1;
        seatSlotMapper.insertRows = 1;
        seatSlotMapper.insertedSlotId = 300L;
        seatSlotMapper.availableWindow = seatSlot(futureDate(), LocalTime.of(7, 0), LocalTime.of(22, 0));

        ReservationResponse response = reservationService.createReservation(
                new CreateReservationRequest(null, 2L, futureDate(), LocalTime.of(7, 0), LocalTime.of(22, 0)),
                10L
        );

        assertThat(response.seatLockQuota()).isEqualTo(2);
        assertThat(reservationMapper.insertedReservation.getSeatLockQuota()).isEqualTo(2);
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
    void createReservationShouldRejectCustomReservationForPastTodayTime() {
        seatSlotMapper.availableWindow = seatSlot(TODAY, LocalTime.of(8, 0), LocalTime.of(22, 0));

        assertThatThrownBy(() -> reservationService.createReservation(
                new CreateReservationRequest(null, 2L, TODAY, LocalTime.of(9, 30), LocalTime.of(17, 30)),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Past seat slots cannot be reserved");
    }

    @Test
    void createReservationShouldRejectTomorrowReservationBeforeOpenHour() {
        reservationService = new ReservationService(
                seatSlotMapper.proxy(),
                reservationMapper.proxy(),
                checkinRecordMapper.proxy(),
                reservationRateLimiter,
                seatSlotCacheService,
                reservationRuleService,
                new IpRangeMatcher(),
                Clock.fixed(Instant.parse("2026-05-19T09:59:00Z"), ZoneId.of("Asia/Shanghai"))
        );
        seatSlotMapper.slot = futureSeatSlot();

        assertThatThrownBy(() -> reservationService.createReservation(new CreateReservationRequest(1L), 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Tomorrow's reservations open at the configured hour");

        assertThat(seatSlotMapper.reserveRows).isZero();
    }

    @Test
    void createReservationShouldRejectCustomReservationNotOnHalfHourBoundary() {
        assertThatThrownBy(() -> reservationService.createReservation(
                new CreateReservationRequest(null, 2L, TODAY, LocalTime.of(9, 15), LocalTime.of(17, 30)),
                10L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Reservation time must use 30-minute intervals");
    }

    @Test
    void tableCheckInShouldFailWhenNoReservationMatchesTableTokenOrCode() {
        assertThatThrownBy(() -> reservationService.tableCheckIn(
                new TableCheckinRequest("wrong-table", "bad-code"),
                10L,
                "10.10.1.20"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("No matching reservation for this table");

        assertThat(seatSlotMapper.markUsingRows).isZero();
        assertThat(checkinRecordMapper.insertedRecord).isNull();
    }

    @Test
    void tableCheckInShouldFailWhenReservationIsExpired() {
        Reservation reservation = reservedReservation();
        reservation.setExpiresAt(LocalDateTime.now(FIXED_CLOCK).minusMinutes(1));
        reservationMapper.tableCheckinReservation = reservation;

        assertThatThrownBy(() -> reservationService.tableCheckIn(
                new TableCheckinRequest("table-token", "code"),
                10L,
                "10.10.1.20"
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

    @Test
    void checkInShouldRejectWhenClientIpIsOutsideAreaWifiRange() {
        reservationMapper.reservation = reservedReservation();
        seatSlotMapper.slot = checkinWindowSeatSlot();

        assertThatThrownBy(() -> reservationService.checkIn(
                100L,
                new CheckinRequest("code"),
                10L,
                "192.168.1.5"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Check-in requires connecting to the area's allowed campus WiFi");

        assertThat(reservationMapper.markCheckedInReservationId).isNull();
    }

    @Test
    void checkInShouldRejectBeforeAllowedTimeWindow() {
        reservationMapper.reservation = reservedReservation();
        seatSlotMapper.slot = futureSeatSlot();

        assertThatThrownBy(() -> reservationService.checkIn(
                100L,
                new CheckinRequest("code"),
                10L,
                "10.10.1.20"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Check-in is only allowed within the configured time window");

        assertThat(reservationMapper.markCheckedInReservationId).isNull();
    }

    @Test
    void wifiPresenceShouldUpdateLastSeenWhenIpMatchesAreaRange() {
        Reservation reservation = reservation();
        reservationMapper.reservation = reservation;
        reservationMapper.markWifiSeenRows = 1;
        seatSlotMapper.slot = checkinWindowSeatSlot();

        WifiPresenceResponse response = reservationService.markWifiPresence(
                100L,
                new WifiPresenceRequest(),
                10L,
                "10.10.1.20"
        );

        assertThat(response.reservationId()).isEqualTo(100L);
        assertThat(response.lastWifiSeenAt()).isEqualTo(LocalDateTime.now(FIXED_CLOCK));
        assertThat(reservationMapper.markWifiSeenIp).isEqualTo("10.10.1.20");
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("WIFI_HEARTBEAT");
    }

    @Test
    void releaseWifiOfflineReservationsShouldReleaseUsingSlotsAndRecordAction() {
        Reservation reservation = reservation();
        reservation.setLastWifiSeenAt(LocalDateTime.now(FIXED_CLOCK).minusMinutes(16));
        reservationMapper.wifiOfflineReservations = List.of(reservation);
        reservationMapper.markWifiReleasedRows = 1;
        seatSlotMapper.releaseUsingIfNotEndedRows = 1;
        seatSlotMapper.slot = checkinWindowSeatSlot();

        int releasedCount = reservationService.releaseWifiOfflineReservations(100);

        assertThat(releasedCount).isEqualTo(1);
        assertThat(reservationMapper.wifiOfflineDeadline).isEqualTo(LocalDateTime.now(FIXED_CLOCK).minusMinutes(15));
        assertThat(seatSlotMapper.releaseUsingIfNotEndedSeatSlotId).isEqualTo(1L);
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("WIFI_RELEASE");
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
    }

    @Test
    void lockSeatShouldUseOneQuotaAndCapLockEndAtReservationEnd() {
        Reservation reservation = reservation();
        reservation.setSeatLockQuota(1);
        reservation.setSeatLockUsedCount(0);
        reservationMapper.reservation = reservation;
        reservationMapper.markSeatLockedRows = 1;
        seatSlotMapper.slot = seatSlot(TODAY, LocalTime.of(17, 0), LocalTime.of(19, 0));

        ReservationResponse response = reservationService.lockSeat(100L, 10L);

        assertThat(response.status()).isEqualTo(ReservationStatus.LOCKED);
        assertThat(response.seatLockUsedCount()).isEqualTo(1);
        assertThat(response.lockedUntilAt()).isEqualTo(LocalDateTime.of(TODAY, LocalTime.of(19, 0)));
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("SEAT_LOCK");
    }

    @Test
    void lockSeatShouldRejectWhenReservationHasNoQuota() {
        Reservation reservation = reservation();
        reservation.setSeatLockQuota(0);
        reservation.setSeatLockUsedCount(0);
        reservationMapper.reservation = reservation;

        assertThatThrownBy(() -> reservationService.lockSeat(100L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("No seat lock quota available for this reservation");
    }

    @Test
    void reactivateSeatLockShouldReturnToCheckedInAndRefreshWifiPresence() {
        Reservation reservation = lockedReservation();
        reservationMapper.reservation = reservation;
        reservationMapper.markLockReactivatedRows = 1;
        seatSlotMapper.slot = seatSlot(TODAY, LocalTime.of(17, 0), LocalTime.of(22, 0));

        ReservationResponse response = reservationService.reactivateSeatLock(
                100L,
                new CheckinRequest("code"),
                10L,
                "10.10.1.20"
        );

        assertThat(response.status()).isEqualTo(ReservationStatus.CHECKED_IN);
        assertThat(response.lockedUntilAt()).isNull();
        assertThat(reservationMapper.markLockReactivatedIp).isEqualTo("10.10.1.20");
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("SEAT_LOCK_REACTIVATE");
    }

    @Test
    void reactivateSeatLockShouldForceReleaseWhenReservationAlreadyEnded() {
        Reservation reservation = lockedReservation();
        reservationMapper.reservation = reservation;
        reservationMapper.markExpiredLockReleasedRows = 1;
        seatSlotMapper.releaseUsingRows = 1;
        seatSlotMapper.slot = seatSlot(TODAY, LocalTime.of(17, 0), LocalTime.of(18, 0));

        ReservationResponse response = reservationService.reactivateSeatLock(
                100L,
                new CheckinRequest("code"),
                10L,
                "10.10.1.20"
        );

        assertThat(response.status()).isEqualTo(ReservationStatus.LOCK_RELEASED);
        assertThat(reservationMapper.markLockReactivatedIp).isNull();
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("SEAT_LOCK_EXPIRE");
    }

    @Test
    void releaseSeatLockShouldReleaseSlotAndMarkTerminalStatus() {
        Reservation reservation = lockedReservation();
        reservationMapper.reservation = reservation;
        reservationMapper.markLockReleasedRows = 1;
        seatSlotMapper.releaseUsingRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        ReservationResponse response = reservationService.releaseSeatLock(100L, 10L);

        assertThat(response.status()).isEqualTo(ReservationStatus.LOCK_RELEASED);
        assertThat(response.lockedUntilAt()).isNull();
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("SEAT_LOCK_RELEASE");
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
    }

    @Test
    void releaseExpiredSeatLocksShouldForceReleaseExpiredLocks() {
        Reservation reservation = lockedReservation();
        reservationMapper.expiredLockedReservations = List.of(reservation);
        reservationMapper.markExpiredLockReleasedRows = 1;
        seatSlotMapper.releaseUsingRows = 1;
        seatSlotMapper.slot = futureSeatSlot();

        int releasedCount = reservationService.releaseExpiredSeatLocks(100);

        assertThat(releasedCount).isEqualTo(1);
        assertThat(reservationMapper.expiredLockNow).isEqualTo(LocalDateTime.now(FIXED_CLOCK));
        assertThat(checkinRecordMapper.insertedRecord.getAction()).isEqualTo("SEAT_LOCK_EXPIRE");
    }

    private LocalDate futureDate() {
        return TOMORROW;
    }

    private SeatSlot futureSeatSlot() {
        return seatSlot(futureDate(), LocalTime.of(8, 0), LocalTime.of(10, 0));
    }

    private SeatSlot checkinWindowSeatSlot() {
        return seatSlot(TODAY, LocalTime.of(18, 0), LocalTime.of(20, 0));
    }

    private SeatSlot pastSeatSlot() {
        return seatSlot(TODAY, LocalTime.of(6, 0), LocalTime.of(7, 0));
    }

    private SeatSlot seatSlot(LocalDate slotDate, LocalTime startTime, LocalTime endTime) {
        SeatSlot slot = new SeatSlot();
        slot.setId(1L);
        slot.setSeatId(2L);
        slot.setSeatNo("A-001");
        slot.setSeatLabel("1号");
        slot.setTableId(11L);
        slot.setTableNo("T01");
        slot.setAreaId(1L);
        slot.setAreaName("A 区");
        slot.setFloor("1F");
        slot.setCheckinIpCidrs("10.10.0.0/16,127.0.0.1/32,::1/128");
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
        reservation.setExpiresAt(LocalDateTime.now(FIXED_CLOCK).plusMinutes(10));
        reservation.setSeatLockQuota(0);
        reservation.setSeatLockUsedCount(0);
        return reservation;
    }

    private Reservation reservedReservation() {
        Reservation reservation = reservation();
        reservation.setStatus(ReservationStatus.RESERVED);
        return reservation;
    }

    private Reservation lockedReservation() {
        Reservation reservation = reservation();
        reservation.setStatus(ReservationStatus.LOCKED);
        reservation.setSeatLockQuota(1);
        reservation.setSeatLockUsedCount(1);
        reservation.setLockedUntilAt(LocalDateTime.now(FIXED_CLOCK).plusMinutes(30));
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
        private int releaseUsingIfNotEndedRows;
        private Long releaseUsingIfNotEndedSeatSlotId;
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
                case "releaseUsingSlotIfNotEnded" -> {
                    releaseUsingIfNotEndedSeatSlotId = (Long) args[0];
                    yield releaseUsingIfNotEndedRows;
                }
                case "releaseReservedSlot" -> releaseReservedRows;
                case "findAvailableWindowForSeat" -> availableWindow;
                case "countActiveOverlappingSlotsBySeat" -> activeOverlapBySeatCount;
                case "findByIdWithLayout" -> slot;
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
        private int markWifiSeenRows;
        private String markWifiSeenIp;
        private int markWifiReleasedRows;
        private List<Reservation> wifiOfflineReservations = List.of();
        private LocalDateTime wifiOfflineDeadline;
        private int markSeatLockedRows;
        private int markLockReactivatedRows;
        private String markLockReactivatedIp;
        private int markLockReleasedRows;
        private int markExpiredLockReleasedRows;
        private List<Reservation> expiredLockedReservations = List.of();
        private LocalDateTime expiredLockNow;
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
                        reservation.setCheckedInAt((LocalDateTime) args[4]);
                        reservation.setLastWifiSeenAt((LocalDateTime) args[4]);
                        reservation.setLastWifiIp((String) args[3]);
                    }
                    yield markCheckedInRows;
                }
                case "markWifiSeen" -> {
                    markWifiSeenIp = (String) args[2];
                    if (markWifiSeenRows == 1 && reservation != null) {
                        reservation.setLastWifiSeenAt((LocalDateTime) args[3]);
                        reservation.setLastWifiIp(markWifiSeenIp);
                    }
                    yield markWifiSeenRows;
                }
                case "findWifiOfflineReservations" -> {
                    wifiOfflineDeadline = (LocalDateTime) args[0];
                    yield wifiOfflineReservations;
                }
                case "markWifiReleased" -> {
                    if (markWifiReleasedRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.WIFI_RELEASED);
                        reservation.setCheckedOutAt((LocalDateTime) args[2]);
                    }
                    yield markWifiReleasedRows;
                }
                case "markSeatLocked" -> {
                    if (markSeatLockedRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.LOCKED);
                        reservation.setSeatLockUsedCount((reservation.getSeatLockUsedCount() == null ? 0 : reservation.getSeatLockUsedCount()) + 1);
                        reservation.setLockedUntilAt((LocalDateTime) args[2]);
                    }
                    yield markSeatLockedRows;
                }
                case "markLockReactivated" -> {
                    markLockReactivatedIp = (String) args[3];
                    if (markLockReactivatedRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.CHECKED_IN);
                        reservation.setLockedUntilAt(null);
                        reservation.setLastWifiSeenAt((LocalDateTime) args[4]);
                        reservation.setLastWifiIp(markLockReactivatedIp);
                    }
                    yield markLockReactivatedRows;
                }
                case "markLockReleased" -> {
                    if (markLockReleasedRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.LOCK_RELEASED);
                        reservation.setCheckedOutAt((LocalDateTime) args[2]);
                        reservation.setLockedUntilAt(null);
                    }
                    yield markLockReleasedRows;
                }
                case "findExpiredLockedReservations" -> {
                    expiredLockNow = (LocalDateTime) args[0];
                    yield expiredLockedReservations;
                }
                case "markExpiredLockReleased" -> {
                    if (markExpiredLockReleasedRows == 1 && reservation != null) {
                        reservation.setStatus(ReservationStatus.LOCK_RELEASED);
                        reservation.setCheckedOutAt((LocalDateTime) args[2]);
                        reservation.setLockedUntilAt(null);
                    }
                    yield markExpiredLockReleasedRows;
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
