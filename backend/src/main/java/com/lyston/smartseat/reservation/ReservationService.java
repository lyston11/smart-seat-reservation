package com.lyston.smartseat.reservation;

import com.lyston.smartseat.cache.ReservationRateLimiter;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.checkin.CheckinAction;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.network.IpRangeMatcher;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import com.lyston.smartseat.seat.SeatSlotStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private final SeatSlotMapper seatSlotMapper;
    private final ReservationMapper reservationMapper;
    private final CheckinRecordMapper checkinRecordMapper;
    private final ReservationRateLimiter reservationRateLimiter;
    private final SeatSlotCacheService seatSlotCacheService;
    private final ReservationRuleService reservationRuleService;
    private final IpRangeMatcher ipRangeMatcher;
    private final Clock clock;

    public ReservationService(
            SeatSlotMapper seatSlotMapper,
            ReservationMapper reservationMapper,
            CheckinRecordMapper checkinRecordMapper,
            ReservationRateLimiter reservationRateLimiter,
            SeatSlotCacheService seatSlotCacheService,
            ReservationRuleService reservationRuleService,
            IpRangeMatcher ipRangeMatcher,
            Clock clock
    ) {
        this.seatSlotMapper = seatSlotMapper;
        this.reservationMapper = reservationMapper;
        this.checkinRecordMapper = checkinRecordMapper;
        this.reservationRateLimiter = reservationRateLimiter;
        this.seatSlotCacheService = seatSlotCacheService;
        this.reservationRuleService = reservationRuleService;
        this.ipRangeMatcher = ipRangeMatcher;
        this.clock = clock;
    }

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, Long userId) {
        reservationRateLimiter.check(userId);
        LocalDateTime now = LocalDateTime.now(clock);
        ReservationRuleResponse rules = reservationRuleService.getRules();
        SeatSlot slot = resolveReservationSlot(request, now, rules);
        ensureSlotIsReservableByTime(slot, now, rules);
        ensureNoActiveOverlap(userId, slot);
        ensureDailyActiveLimit(userId, slot.getSlotDate(), rules);

        int affectedRows = seatSlotMapper.reserveAvailableSlot(slot.getId(), userId, now);
        if (affectedRows != 1) {
            throw new BusinessException("SEAT_SLOT_NOT_AVAILABLE", "Seat slot is not available");
        }

        Reservation reservation = new Reservation();
        reservation.setUserId(userId);
        reservation.setSeatId(slot.getSeatId());
        reservation.setSeatSlotId(slot.getId());
        reservation.setStatus(ReservationStatus.RESERVED);
        reservation.setCheckinCode(generateCheckinCode());
        reservation.setReservedAt(now);
        reservation.setExpiresAt(resolveExpiresAt(slot, rules));
        reservationMapper.insert(reservation);

        int attachedRows = seatSlotMapper.attachReservation(slot.getId(), reservation.getId(), userId, now);
        if (attachedRows != 1) {
            throw new BusinessException("RESERVATION_ATTACH_FAILED", "Failed to bind reservation to seat slot");
        }

        evictSlotCache(slot);
        return ReservationResponse.from(reservation, slot);
    }

    @Transactional
    public ReservationResponse checkIn(Long reservationId, CheckinRequest request, Long userId, String clientIp) {
        LocalDateTime now = LocalDateTime.now(clock);
        Reservation reservation = requireReservation(reservationId);
        return completeCheckIn(
                reservation,
                request.checkinCode(),
                userId,
                normalizeClientIp(clientIp),
                now
        );
    }

    @Transactional
    public ReservationResponse tableCheckIn(TableCheckinRequest request, Long userId, String clientIp) {
        LocalDateTime now = LocalDateTime.now(clock);
        Reservation reservation = reservationMapper.findReservedForTableCheckin(
                userId,
                request.tableQrToken(),
                request.checkinCode()
        );
        if (reservation == null) {
            throw new BusinessException("TABLE_CHECKIN_NOT_MATCHED", "No matching reservation for this table");
        }
        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().isBefore(now)) {
            throw new BusinessException("RESERVATION_EXPIRED", "Reservation has expired");
        }
        return completeCheckIn(
                reservation,
                request.checkinCode(),
                userId,
                normalizeClientIp(clientIp),
                now
        );
    }

    private ReservationResponse completeCheckIn(
            Reservation reservation,
            String checkinCode,
            Long userId,
            String clientIp,
            LocalDateTime now
    ) {
        SeatSlot slot = requireSeatSlotWithLayout(reservation.getSeatSlotId());
        ReservationRuleResponse rules = reservationRuleService.getRules();
        ensureWithinCheckinWindow(slot, now, rules);
        ensureAllowedCheckinIp(slot, clientIp);

        int reservationRows = reservationMapper.markCheckedIn(
                reservation.getId(),
                userId,
                checkinCode,
                clientIp,
                now
        );
        if (reservationRows != 1) {
            throw new BusinessException("RESERVATION_CHECKIN_FAILED", "Reservation cannot be checked in");
        }

        int slotRows = seatSlotMapper.markUsing(
                reservation.getSeatSlotId(),
                reservation.getId(),
                userId,
                now
        );
        if (slotRows != 1) {
            throw new BusinessException("SEAT_SLOT_CHECKIN_FAILED", "Seat slot cannot be checked in");
        }

        evictSlotCache(slot);
        recordAction(reservation.getId(), userId, CheckinAction.CHECK_IN, now);
        Reservation updated = requireReservation(reservation.getId());
        return toResponse(updated);
    }

    @Transactional
    public WifiPresenceResponse markWifiPresence(Long reservationId, WifiPresenceRequest request, Long userId, String clientIp) {
        LocalDateTime now = LocalDateTime.now(clock);
        String effectiveIp = normalizeClientIp(clientIp);
        Reservation reservation = requireReservation(reservationId);
        if (!ReservationStatus.CHECKED_IN.equals(reservation.getStatus())) {
            throw new BusinessException("RESERVATION_NOT_USING", "Reservation is not currently checked in");
        }

        SeatSlot slot = requireSeatSlotWithLayout(reservation.getSeatSlotId());
        ensureAllowedCheckinIp(slot, effectiveIp);

        int rows = reservationMapper.markWifiSeen(reservationId, userId, effectiveIp, now);
        if (rows != 1) {
            throw new BusinessException("WIFI_PRESENCE_FAILED", "WiFi presence cannot be updated");
        }

        recordAction(reservationId, userId, CheckinAction.WIFI_HEARTBEAT, now);
        Reservation updated = requireReservation(reservationId);
        return WifiPresenceResponse.from(updated, reservationRuleService.getRules().wifiOfflineReleaseMinutes());
    }

    @Transactional
    public ReservationResponse checkOut(Long reservationId, Long userId) {
        LocalDateTime now = LocalDateTime.now(clock);
        Reservation reservation = requireReservation(reservationId);

        int reservationRows = reservationMapper.markCheckedOut(reservationId, userId, now);
        if (reservationRows != 1) {
            throw new BusinessException("RESERVATION_CHECKOUT_FAILED", "Reservation cannot be checked out");
        }

        int slotRows = seatSlotMapper.releaseUsingSlot(
                reservation.getSeatSlotId(),
                reservation.getId(),
                userId,
                now
        );
        if (slotRows != 1) {
            throw new BusinessException("SEAT_SLOT_CHECKOUT_FAILED", "Seat slot cannot be released");
        }

        evictReservationSlotCache(reservation);
        recordAction(reservation.getId(), userId, CheckinAction.CHECK_OUT, now);
        Reservation updated = requireReservation(reservationId);
        return toResponse(updated);
    }

    @Transactional
    public ReservationResponse cancel(Long reservationId, Long userId) {
        LocalDateTime now = LocalDateTime.now(clock);
        Reservation reservation = requireReservation(reservationId);

        int reservationRows = reservationMapper.markCancelled(reservationId, userId, now);
        if (reservationRows != 1) {
            throw new BusinessException("RESERVATION_CANCEL_FAILED", "Reservation cannot be cancelled");
        }

        int slotRows = seatSlotMapper.releaseReservedSlot(
                reservation.getSeatSlotId(),
                reservation.getId(),
                userId,
                now
        );
        if (slotRows != 1) {
            throw new BusinessException("SEAT_SLOT_CANCEL_FAILED", "Seat slot cannot be cancelled");
        }

        evictReservationSlotCache(reservation);
        recordAction(reservation.getId(), userId, CheckinAction.CANCEL, now);
        Reservation updated = requireReservation(reservationId);
        return toResponse(updated);
    }

    @Transactional
    public int expireOverdueReservations(int limit) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Reservation> expiredReservations = reservationMapper.findExpiredReservations(now, limit);
        int expiredCount = 0;

        for (Reservation reservation : expiredReservations) {
            int reservationRows = reservationMapper.markExpired(reservation.getId(), reservation.getUserId(), now);
            if (reservationRows != 1) {
                continue;
            }

            int slotRows = seatSlotMapper.releaseReservedSlot(
                    reservation.getSeatSlotId(),
                    reservation.getId(),
                    reservation.getUserId(),
                    now
            );
            if (slotRows == 1) {
                evictReservationSlotCache(reservation);
                recordAction(reservation.getId(), reservation.getUserId(), CheckinAction.EXPIRE, now);
                expiredCount++;
            } else {
                throw new BusinessException("SEAT_SLOT_EXPIRE_FAILED", "Expired seat slot cannot be released");
            }
        }

        return expiredCount;
    }

    @Transactional
    public int releaseWifiOfflineReservations(int limit) {
        LocalDateTime now = LocalDateTime.now(clock);
        ReservationRuleResponse rules = reservationRuleService.getRules();
        LocalDateTime deadline = now.minusMinutes(rules.wifiOfflineReleaseMinutes());
        List<Reservation> offlineReservations = reservationMapper.findWifiOfflineReservations(deadline, limit);
        int releasedCount = 0;

        for (Reservation reservation : offlineReservations) {
            int reservationRows = reservationMapper.markWifiReleased(reservation.getId(), reservation.getUserId(), now);
            if (reservationRows != 1) {
                continue;
            }

            int slotRows = seatSlotMapper.releaseUsingSlotIfNotEnded(
                    reservation.getSeatSlotId(),
                    reservation.getId(),
                    reservation.getUserId(),
                    now.toLocalTime(),
                    now
            );
            if (slotRows == 1) {
                evictReservationSlotCache(reservation);
                recordAction(reservation.getId(), reservation.getUserId(), CheckinAction.WIFI_RELEASE, now);
                releasedCount++;
            } else {
                throw new BusinessException("SEAT_SLOT_WIFI_RELEASE_FAILED", "WiFi offline seat slot cannot be released");
            }
        }

        return releasedCount;
    }

    public List<ReservationResponse> listUserReservations(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return reservationMapper.findByUserId(userId, safeLimit)
                .stream()
                .map(ReservationResponse::from)
                .toList();
    }

    private String generateCheckinCode() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private Reservation requireReservation(Long reservationId) {
        Reservation reservation = reservationMapper.selectById(reservationId);
        if (reservation == null) {
            throw new BusinessException("RESERVATION_NOT_FOUND", "Reservation not found");
        }
        return reservation;
    }

    private SeatSlot requireSeatSlot(Long seatSlotId) {
        SeatSlot slot = seatSlotMapper.selectById(seatSlotId);
        if (slot == null) {
            throw new BusinessException("SEAT_SLOT_NOT_FOUND", "Seat slot not found");
        }
        return slot;
    }

    private SeatSlot requireSeatSlotWithLayout(Long seatSlotId) {
        SeatSlot slot = seatSlotMapper.findByIdWithLayout(seatSlotId);
        if (slot == null) {
            throw new BusinessException("SEAT_SLOT_NOT_FOUND", "Seat slot not found");
        }
        return slot;
    }

    private SeatSlot resolveReservationSlot(
            CreateReservationRequest request,
            LocalDateTime now,
            ReservationRuleResponse rules
    ) {
        if (request.seatSlotId() != null) {
            return requireSeatSlot(request.seatSlotId());
        }
        return createCustomSeatSlot(request, now, rules);
    }

    private SeatSlot createCustomSeatSlot(
            CreateReservationRequest request,
            LocalDateTime now,
            ReservationRuleResponse rules
    ) {
        validateCustomReservationRequest(request);
        SeatSlot availableWindow = seatSlotMapper.findAvailableWindowForSeat(
                request.seatId(),
                request.slotDate(),
                request.startTime(),
                request.endTime()
        );
        if (availableWindow == null) {
            throw new BusinessException("RESERVATION_TIME_OUTSIDE_OPENING_HOURS", "Reservation time is outside opening hours");
        }
        ensureWithinAvailableWindow(request, availableWindow);
        if (isExactAvailableWindow(request, availableWindow)) {
            ensureNoActiveSeatOverlap(availableWindow);
            return availableWindow;
        }

        SeatSlot exactSlot = new SeatSlot();
        exactSlot.setSeatId(request.seatId());
        exactSlot.setAreaId(availableWindow.getAreaId());
        exactSlot.setSlotDate(request.slotDate());
        exactSlot.setStartTime(request.startTime());
        exactSlot.setEndTime(request.endTime());
        exactSlot.setStatus(SeatSlotStatus.AVAILABLE);
        exactSlot.setVersion(0);
        exactSlot.setCreatedAt(now);
        exactSlot.setUpdatedAt(now);
        copyLayoutFields(availableWindow, exactSlot);

        ensureSlotIsReservableByTime(exactSlot, now, rules);
        ensureNoActiveSeatOverlap(exactSlot);
        if (seatSlotMapper.insert(exactSlot) != 1 || exactSlot.getId() == null) {
            throw new BusinessException("SEAT_SLOT_CREATE_FAILED", "Failed to create seat slot");
        }
        return exactSlot;
    }

    private void validateCustomReservationRequest(CreateReservationRequest request) {
        if (request.seatId() == null || request.slotDate() == null
                || request.startTime() == null || request.endTime() == null) {
            throw new BusinessException("INVALID_RESERVATION_REQUEST", "Reservation seat and time are required");
        }
        LocalTime startTime = request.startTime();
        LocalTime endTime = request.endTime();
        if (!startTime.isBefore(endTime)) {
            throw new BusinessException("INVALID_RESERVATION_TIME_RANGE", "Reservation start time must be before end time");
        }
        if (!request.slotDate().equals(LocalDate.now(clock))) {
            throw new BusinessException("RESERVATION_ONLY_TODAY_ALLOWED", "Only today's reservations are allowed");
        }
        if (!isHalfHourBoundary(startTime) || !isHalfHourBoundary(endTime)) {
            throw new BusinessException("INVALID_RESERVATION_TIME_GRANULARITY", "Reservation time must use 30-minute intervals");
        }
    }

    private boolean isHalfHourBoundary(LocalTime time) {
        return time.getSecond() == 0 && time.getNano() == 0 && (time.getMinute() == 0 || time.getMinute() == 30);
    }

    private void ensureWithinAvailableWindow(CreateReservationRequest request, SeatSlot availableWindow) {
        if (availableWindow.getStartTime() == null || availableWindow.getEndTime() == null
                || availableWindow.getStartTime().isAfter(request.startTime())
                || availableWindow.getEndTime().isBefore(request.endTime())) {
            throw new BusinessException("RESERVATION_TIME_OUTSIDE_OPENING_HOURS", "Reservation time is outside opening hours");
        }
    }

    private boolean isExactAvailableWindow(CreateReservationRequest request, SeatSlot availableWindow) {
        return request.startTime().equals(availableWindow.getStartTime())
                && request.endTime().equals(availableWindow.getEndTime());
    }

    private void ensureNoActiveSeatOverlap(SeatSlot slot) {
        if (seatSlotMapper.countActiveOverlappingSlotsBySeat(
                slot.getSeatId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime()
        ) > 0) {
            throw new BusinessException(
                    "SEAT_HAS_ACTIVE_RESERVATION_IN_PERIOD",
                    "Seat already has an active reservation in this period"
            );
        }
    }

    private void copyLayoutFields(SeatSlot source, SeatSlot target) {
        target.setSeatNo(source.getSeatNo());
        target.setTableId(source.getTableId());
        target.setTableNo(source.getTableNo());
        target.setTableRowNo(source.getTableRowNo());
        target.setTableColumnNo(source.getTableColumnNo());
        target.setTableDisplayOrder(source.getTableDisplayOrder());
        target.setTablePositionX(source.getTablePositionX());
        target.setTablePositionY(source.getTablePositionY());
        target.setTableWidthPx(source.getTableWidthPx());
        target.setTableHeightPx(source.getTableHeightPx());
        target.setTableRotationDeg(source.getTableRotationDeg());
        target.setSeatLabel(source.getSeatLabel());
        target.setSeatSide(source.getSeatSide());
        target.setSeatOrder(source.getSeatOrder());
        target.setRowNo(source.getRowNo());
        target.setColumnNo(source.getColumnNo());
        target.setDisplayOrder(source.getDisplayOrder());
    }

    private void ensureSlotIsReservableByTime(SeatSlot slot, LocalDateTime now, ReservationRuleResponse rules) {
        if (!slot.getSlotDate().equals(now.toLocalDate())) {
            throw new BusinessException("RESERVATION_ONLY_TODAY_ALLOWED", "Only today's reservations are allowed");
        }
        LocalDateTime slotStartAt = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        if (!slotStartAt.isAfter(now)) {
            throw new BusinessException("SEAT_SLOT_ALREADY_STARTED", "Past seat slots cannot be reserved");
        }
    }

    private void ensureWithinCheckinWindow(SeatSlot slot, LocalDateTime now, ReservationRuleResponse rules) {
        LocalDateTime startAt = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        LocalDateTime earliestCheckinAt = startAt.minusMinutes(rules.checkinLeadMinutes());
        LocalDateTime latestCheckinAt = startAt.plusMinutes(rules.checkinGraceMinutes());
        if (now.isBefore(earliestCheckinAt) || now.isAfter(latestCheckinAt)) {
            throw new BusinessException(
                    "RESERVATION_CHECKIN_TIME_NOT_ALLOWED",
                    "Check-in is only allowed within the configured time window"
            );
        }
    }

    private void ensureAllowedCheckinIp(SeatSlot slot, String clientIp) {
        if (!ipRangeMatcher.matches(clientIp, slot.getCheckinIpCidrs())) {
            throw new BusinessException(
                    "CHECKIN_WIFI_IP_NOT_ALLOWED",
                    "Check-in requires connecting to the area's allowed campus WiFi"
            );
        }
    }

    private String normalizeClientIp(String clientIp) {
        return clientIp == null ? "" : clientIp.trim();
    }

    private void ensureNoActiveOverlap(Long userId, SeatSlot slot) {
        int activeOverlapCount = reservationMapper.countActiveOverlappingReservations(
                userId,
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );
        if (activeOverlapCount > 0) {
            throw new BusinessException(
                    "USER_HAS_ACTIVE_RESERVATION_IN_PERIOD",
                    "User already has an active reservation in this period"
            );
        }
    }

    private void ensureDailyActiveLimit(Long userId, LocalDate slotDate, ReservationRuleResponse rules) {
        int limit = rules.dailyActiveReservationLimit();
        if (limit <= 0) {
            return;
        }
        int activeCount = reservationMapper.countDailyActiveReservations(userId, slotDate);
        if (activeCount >= limit) {
            throw new BusinessException(
                    "DAILY_ACTIVE_RESERVATION_LIMIT_EXCEEDED",
                    "User has reached the daily active reservation limit"
            );
        }
    }

    private LocalDateTime resolveExpiresAt(SeatSlot slot, ReservationRuleResponse rules) {
        return LocalDateTime.of(slot.getSlotDate(), slot.getStartTime()).plusMinutes(rules.checkinGraceMinutes());
    }

    private void recordAction(Long reservationId, Long userId, String action, LocalDateTime now) {
        CheckinRecord record = new CheckinRecord();
        record.setReservationId(reservationId);
        record.setUserId(userId);
        record.setAction(action);
        record.setOccurredAt(now);
        checkinRecordMapper.insert(record);
    }

    private void evictReservationSlotCache(Reservation reservation) {
        SeatSlot slot = seatSlotMapper.selectById(reservation.getSeatSlotId());
        if (slot != null) {
            evictSlotCache(slot);
        }
    }

    private void evictSlotCache(SeatSlot slot) {
        seatSlotCacheService.evict(slot.getAreaId(), slot.getSlotDate());
    }

    private ReservationResponse toResponse(Reservation reservation) {
        SeatSlot slot = seatSlotMapper.findByIdWithLayout(reservation.getSeatSlotId());
        if (slot == null) {
            return ReservationResponse.from(reservation);
        }
        return ReservationResponse.from(reservation, slot);
    }
}
