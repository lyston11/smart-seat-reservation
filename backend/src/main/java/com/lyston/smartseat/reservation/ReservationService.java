package com.lyston.smartseat.reservation;

import com.lyston.smartseat.cache.ReservationRateLimiter;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.checkin.CheckinAction;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import com.lyston.smartseat.seat.SeatSlotStatus;
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

    public ReservationService(
            SeatSlotMapper seatSlotMapper,
            ReservationMapper reservationMapper,
            CheckinRecordMapper checkinRecordMapper,
            ReservationRateLimiter reservationRateLimiter,
            SeatSlotCacheService seatSlotCacheService,
            ReservationRuleService reservationRuleService
    ) {
        this.seatSlotMapper = seatSlotMapper;
        this.reservationMapper = reservationMapper;
        this.checkinRecordMapper = checkinRecordMapper;
        this.reservationRateLimiter = reservationRateLimiter;
        this.seatSlotCacheService = seatSlotCacheService;
        this.reservationRuleService = reservationRuleService;
    }

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, Long userId) {
        reservationRateLimiter.check(userId);
        LocalDateTime now = LocalDateTime.now();
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
        return new ReservationResponse(
                reservation.getId(),
                slot.getId(),
                slot.getSeatId(),
                reservation.getUserId(),
                reservation.getStatus(),
                reservation.getCheckinCode(),
                reservation.getExpiresAt()
        );
    }

    @Transactional
    public ReservationResponse checkIn(Long reservationId, CheckinRequest request, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = requireReservation(reservationId);
        return completeCheckIn(reservation, request.checkinCode(), userId, now);
    }

    @Transactional
    public ReservationResponse tableCheckIn(TableCheckinRequest request, Long userId) {
        LocalDateTime now = LocalDateTime.now();
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
        return completeCheckIn(reservation, request.checkinCode(), userId, now);
    }

    private ReservationResponse completeCheckIn(
            Reservation reservation,
            String checkinCode,
            Long userId,
            LocalDateTime now
    ) {
        int reservationRows = reservationMapper.markCheckedIn(
                reservation.getId(),
                userId,
                checkinCode,
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

        evictReservationSlotCache(reservation);
        recordAction(reservation.getId(), userId, CheckinAction.CHECK_IN, now);
        Reservation updated = requireReservation(reservation.getId());
        return toResponse(updated);
    }

    @Transactional
    public ReservationResponse checkOut(Long reservationId, Long userId) {
        LocalDateTime now = LocalDateTime.now();
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
        LocalDateTime now = LocalDateTime.now();
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
        LocalDateTime now = LocalDateTime.now();
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
        LocalDate latestReservableDate = now.toLocalDate().plusDays(rules.maxAdvanceDays());
        if (slot.getSlotDate().isAfter(latestReservableDate)) {
            throw new BusinessException("SEAT_SLOT_TOO_FAR_AHEAD", "Seat slot is beyond the reservation window");
        }
        LocalDateTime slotStartAt = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        if (!slotStartAt.isAfter(now)) {
            throw new BusinessException("SEAT_SLOT_ALREADY_STARTED", "Past seat slots cannot be reserved");
        }
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
        return ReservationResponse.from(reservation);
    }
}
