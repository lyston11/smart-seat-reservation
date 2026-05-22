package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.table.StudyTable;
import com.lyston.smartseat.table.StudyTableMapper;
import com.lyston.smartseat.table.StudyTableStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatSlotService {

    private static final int MAX_BATCH_SEATS = 200;
    private static final int MAX_BATCH_PERIODS = 12;
    private static final int MAX_BATCH_SLOT_CREATIONS = 100_000;
    private static final int MAX_CANCEL_DATES = 366;

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final StudyTableMapper studyTableMapper;
    private final SeatSlotMapper seatSlotMapper;
    private final SeatSlotPublishPlanMapper seatSlotPublishPlanMapper;
    private final SeatSlotCacheService seatSlotCacheService;
    private final Clock clock;

    public SeatSlotService(
            AreaMapper areaMapper,
            SeatMapper seatMapper,
            StudyTableMapper studyTableMapper,
            SeatSlotMapper seatSlotMapper,
            SeatSlotPublishPlanMapper seatSlotPublishPlanMapper,
            SeatSlotCacheService seatSlotCacheService,
            Clock clock
    ) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.studyTableMapper = studyTableMapper;
        this.seatSlotMapper = seatSlotMapper;
        this.seatSlotPublishPlanMapper = seatSlotPublishPlanMapper;
        this.seatSlotCacheService = seatSlotCacheService;
        this.clock = clock;
    }

    public List<SeatSlotResponse> listSeatSlots(Long areaId, LocalDate date) {
        List<SeatSlotResponse> cachedSlots = seatSlotCacheService.get(areaId, date);
        if (cachedSlots != null) {
            return cachedSlots;
        }
        List<SeatSlotResponse> slots = seatSlotMapper.findByAreaAndDate(areaId, date)
                .stream()
                .map(SeatSlotResponse::from)
                .toList();
        seatSlotCacheService.put(areaId, date, slots);
        return slots;
    }

    @Transactional
    public PublishSeatSlotsResponse publishSeatSlots(PublishSeatSlotsRequest request) {
        requireActiveArea(request.areaId());
        List<Long> seatIds = normalizeSeatIds(request.seatIds());
        LocalDateTime now = LocalDateTime.now(clock);
        List<PublishSeatSlotPeriod> periods = normalizePeriods(request, now);

        List<SeatSlot> createdSlots = seatIds.stream()
                .flatMap(seatId -> periods.stream().map(period -> createSlotIfAbsent(request, period, seatId, now)))
                .flatMap(List::stream)
                .toList();
        seatSlotCacheService.evict(request.areaId(), request.slotDate());

        return new PublishSeatSlotsResponse(
                createdSlots.size(),
                seatIds.size() * periods.size() - createdSlots.size(),
                createdSlots.stream().map(SeatSlotResponse::from).toList()
        );
    }

    @Transactional
    public PublishSeatSlotsBatchResponse publishSeatSlotsBatch(PublishSeatSlotsBatchRequest request) {
        requireActiveArea(request.areaId());
        LocalDateTime now = LocalDateTime.now(clock);
        List<Long> seatIds = normalizeSeatIds(request.seatIds());
        List<LocalDate> slotDates = normalizeSlotDates(request.slotDates(), now);
        List<PublishSeatSlotPeriod> periods = normalizePeriods(request, slotDates.getFirst(), now);
        validateBatchSize(seatIds.size(), periods.size(), slotDates.size());

        int createdCount = 0;
        int skippedCount = 0;
        for (LocalDate slotDate : slotDates) {
            seatSlotPublishPlanMapper.deleteException(request.areaId(), slotDate);
            PublishSeatSlotsRequest dayRequest = new PublishSeatSlotsRequest(
                    request.areaId(),
                    slotDate,
                    request.startTime(),
                    request.endTime(),
                    periods,
                    seatIds
            );
            int dayCreatedCount = seatIds.stream()
                    .flatMap(seatId -> periods.stream().map(period -> createSlotIfAbsent(dayRequest, period, seatId, now)))
                    .mapToInt(List::size)
                    .sum();
            createdCount += dayCreatedCount;
            skippedCount += seatIds.size() * periods.size() - dayCreatedCount;
            seatSlotCacheService.evict(request.areaId(), slotDate);
        }

        return new PublishSeatSlotsBatchResponse(
                slotDates.size(),
                createdCount,
                skippedCount
        );
    }

    @Transactional
    public SeatSlotResponse cancelSeatSlot(Long seatSlotId) {
        SeatSlot slot = requireSeatSlot(seatSlotId);
        if (!SeatSlotStatus.AVAILABLE.equals(slot.getStatus())) {
            throw new BusinessException("SEAT_SLOT_NOT_CANCELABLE", "Seat slot cannot be cancelled");
        }

        int deletedRows = seatSlotMapper.deleteAvailableSlot(seatSlotId);
        if (deletedRows != 1) {
            throw new BusinessException("SEAT_SLOT_CANCEL_FAILED", "Seat slot cannot be cancelled");
        }

        seatSlotCacheService.evict(slot.getAreaId(), slot.getSlotDate());
        return SeatSlotResponse.from(slot);
    }

    @Transactional
    public CancelSeatSlotsByDateResponse cancelSeatSlotsByDate(Long areaId, LocalDate slotDate) {
        requireActiveArea(areaId);
        validateSlotDate(slotDate, LocalDateTime.now(clock));
        int blockedCount = seatSlotMapper.countNonCancelableSlotsByAreaAndDate(areaId, slotDate);
        int cancelledCount = seatSlotMapper.deleteAvailableSlotsByAreaAndDate(areaId, slotDate);
        seatSlotCacheService.evict(areaId, slotDate);
        return new CancelSeatSlotsByDateResponse(areaId, slotDate, cancelledCount, blockedCount);
    }

    @Transactional
    public CancelSeatSlotsBatchResponse cancelSeatSlotsBatch(CancelSeatSlotsBatchRequest request) {
        requireActiveArea(request.areaId());
        LocalDateTime now = LocalDateTime.now(clock);
        List<LocalDate> dates = normalizeCancelDates(request, now);
        int cancelledCount = 0;
        int blockedCount = 0;
        int exceptionCount = 0;
        for (LocalDate slotDate : dates) {
            blockedCount += seatSlotMapper.countNonCancelableSlotsByAreaAndDate(request.areaId(), slotDate);
            cancelledCount += seatSlotMapper.deleteAvailableSlotsByAreaAndDate(request.areaId(), slotDate);
            if (request.blockAutoPublish()) {
                seatSlotPublishPlanMapper.upsertException(request.areaId(), slotDate, request.reason(), now);
                exceptionCount += 1;
            }
            seatSlotCacheService.evict(request.areaId(), slotDate);
        }
        return new CancelSeatSlotsBatchResponse(request.areaId(), dates.size(), cancelledCount, blockedCount, exceptionCount);
    }

    @Transactional
    public SeatSlotPublishPlanResponse createPublishPlan(CreateSeatSlotPublishPlanRequest request) {
        requireActiveArea(request.areaId());
        LocalDateTime now = LocalDateTime.now(clock);
        validateSlotDate(request.startDate(), now);
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("INVALID_PLAN_DATE_RANGE", "Plan end date cannot be before start date");
        }
        List<Long> seatIds = normalizeSeatIds(request.seatIds());
        List<PublishSeatSlotPeriod> periods = normalizePeriods(request, request.startDate(), now);
        for (Long seatId : seatIds) {
            requireActiveSeatInArea(seatId, request.areaId());
        }

        SeatSlotPublishPlan plan = new SeatSlotPublishPlan();
        plan.setAreaId(request.areaId());
        plan.setStartDate(request.startDate());
        plan.setEndDate(request.endDate());
        plan.setStatus(SeatSlotPublishPlanStatus.ACTIVE);
        plan.setCreatedAt(now);
        plan.setUpdatedAt(now);
        seatSlotPublishPlanMapper.insert(plan);
        for (PublishSeatSlotPeriod period : periods) {
            seatSlotPublishPlanMapper.insertPeriod(plan.getId(), period, now);
        }
        for (Long seatId : seatIds) {
            seatSlotPublishPlanMapper.insertSeat(plan.getId(), seatId, now);
        }
        return SeatSlotPublishPlanResponse.from(new SeatSlotPublishPlanDetail(
                plan.getId(),
                plan.getAreaId(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getStatus(),
                periods,
                seatIds
        ));
    }

    public List<SeatSlotPublishPlanResponse> listPublishPlans(Long areaId) {
        requireActiveArea(areaId);
        return seatSlotPublishPlanMapper.findByAreaId(areaId)
                .stream()
                .map(this::toPublishPlanResponse)
                .toList();
    }

    public boolean hasPublishException(Long areaId, LocalDate slotDate) {
        return seatSlotPublishPlanMapper.countException(areaId, slotDate) > 0;
    }

    @Transactional
    public StopSeatSlotPublishPlanResponse stopPublishPlan(Long planId, StopSeatSlotPublishPlanRequest request) {
        SeatSlotPublishPlan plan = requirePublishPlan(planId);
        LocalDateTime now = LocalDateTime.now(clock);
        validateSlotDate(request.stopFromDate(), now);
        LocalDate endDate = request.stopFromDate().minusDays(1);
        seatSlotPublishPlanMapper.stopPlanFrom(planId, endDate, now);

        int cancelledCount = 0;
        int blockedCount = 0;
        if (request.cancelGeneratedSlots()) {
            List<PublishSeatSlotPeriod> periods = seatSlotPublishPlanMapper.findPeriodsByPlanId(planId);
            List<Long> seatIds = seatSlotPublishPlanMapper.findSeatIdsByPlanId(planId);
            LocalDate deleteEndDate = plan.getEndDate();
            blockedCount = seatSlotMapper.countNonCancelableSlotsByScope(
                    plan.getAreaId(),
                    request.stopFromDate(),
                    deleteEndDate,
                    seatIds,
                    periods
            );
            cancelledCount = seatSlotMapper.deleteAvailableSlotsByScope(
                    plan.getAreaId(),
                    request.stopFromDate(),
                    deleteEndDate,
                    seatIds,
                    periods
            );
            evictGeneratedSlotDates(plan.getAreaId(), request.stopFromDate(), deleteEndDate);
        }
        return new StopSeatSlotPublishPlanResponse(planId, cancelledCount, blockedCount);
    }

    @Transactional
    public AutoSeatSlotPublishResult publishPlannedSlots(LocalDate slotDate) {
        LocalDateTime now = LocalDateTime.now(clock);
        validateSlotDate(slotDate, now);

        int planCount = 0;
        int seatCount = 0;
        int createdCount = 0;
        int skippedCount = 0;
        for (SeatSlotPublishPlan plan : seatSlotPublishPlanMapper.findActivePlansForDate(slotDate)) {
            if (seatSlotPublishPlanMapper.countException(plan.getAreaId(), slotDate) > 0) {
                continue;
            }
            List<Long> seatIds = seatSlotPublishPlanMapper.findSeatIdsByPlanId(plan.getId());
            List<PublishSeatSlotPeriod> periods = seatSlotPublishPlanMapper.findPeriodsByPlanId(plan.getId());
            if (seatIds.isEmpty() || periods.isEmpty()) {
                continue;
            }
            PublishSeatSlotsResponse response = publishSeatSlots(new PublishSeatSlotsRequest(
                    plan.getAreaId(),
                    slotDate,
                    null,
                    null,
                    periods,
                    seatIds
            ));
            planCount += 1;
            seatCount += seatIds.size();
            createdCount += response.createdCount();
            skippedCount += response.skippedCount();
        }
        return new AutoSeatSlotPublishResult(planCount, seatCount, createdCount, skippedCount);
    }

    private List<Long> normalizeSeatIds(List<Long> seatIds) {
        Set<Long> uniqueSeatIds = new LinkedHashSet<>(seatIds);
        if (uniqueSeatIds.size() > MAX_BATCH_SEATS) {
            throw new BusinessException("SEAT_SLOT_BATCH_TOO_LARGE", "Too many seats in one publish request");
        }
        return uniqueSeatIds.stream().toList();
    }

    private List<PublishSeatSlotPeriod> normalizePeriods(PublishSeatSlotsRequest request, LocalDateTime now) {
        return normalizePeriods(request, request.slotDate(), now);
    }

    private List<PublishSeatSlotPeriod> normalizePeriods(
            PublishSeatSlotsRequest request,
            LocalDate slotDate,
            LocalDateTime now
    ) {
        validateSlotDate(slotDate, now);
        List<PublishSeatSlotPeriod> periods = request.periods();
        if (periods == null || periods.isEmpty()) {
            periods = List.of(new PublishSeatSlotPeriod(request.startTime(), request.endTime()));
        }
        if (periods.size() > MAX_BATCH_PERIODS) {
            throw new BusinessException("SEAT_SLOT_PERIOD_BATCH_TOO_LARGE", "Too many periods in one publish request");
        }
        Set<String> uniqueKeys = new LinkedHashSet<>();
        return periods.stream()
                .peek(period -> validatePeriod(slotDate, period, now))
                .filter(period -> uniqueKeys.add(period.startTime() + "-" + period.endTime()))
                .toList();
    }

    private List<PublishSeatSlotPeriod> normalizePeriods(
            PublishSeatSlotsBatchRequest request,
            LocalDate firstSlotDate,
            LocalDateTime now
    ) {
        validateSlotDate(firstSlotDate, now);
        List<PublishSeatSlotPeriod> periods = request.periods();
        if (periods == null || periods.isEmpty()) {
            periods = List.of(new PublishSeatSlotPeriod(request.startTime(), request.endTime()));
        }
        if (periods.size() > MAX_BATCH_PERIODS) {
            throw new BusinessException("SEAT_SLOT_PERIOD_BATCH_TOO_LARGE", "Too many periods in one publish request");
        }
        Set<String> uniqueKeys = new LinkedHashSet<>();
        return periods.stream()
                .peek(period -> validatePeriod(firstSlotDate, period, now))
                .filter(period -> uniqueKeys.add(period.startTime() + "-" + period.endTime()))
                .toList();
    }

    private List<PublishSeatSlotPeriod> normalizePeriods(
            CreateSeatSlotPublishPlanRequest request,
            LocalDate firstSlotDate,
            LocalDateTime now
    ) {
        validateSlotDate(firstSlotDate, now);
        List<PublishSeatSlotPeriod> periods = request.periods();
        if (periods == null || periods.isEmpty()) {
            periods = List.of(new PublishSeatSlotPeriod(request.startTime(), request.endTime()));
        }
        if (periods.size() > MAX_BATCH_PERIODS) {
            throw new BusinessException("SEAT_SLOT_PERIOD_BATCH_TOO_LARGE", "Too many periods in one publish request");
        }
        Set<String> uniqueKeys = new LinkedHashSet<>();
        return periods.stream()
                .peek(period -> validatePeriodShape(period))
                .filter(period -> uniqueKeys.add(period.startTime() + "-" + period.endTime()))
                .toList();
    }

    private List<LocalDate> normalizeSlotDates(List<LocalDate> slotDates, LocalDateTime now) {
        if (slotDates == null || slotDates.isEmpty()) {
            throw new BusinessException("INVALID_SLOT_DATES", "Slot dates are required");
        }
        return slotDates.stream()
                .peek(slotDate -> validateSlotDate(slotDate, now))
                .distinct()
                .sorted()
                .toList();
    }

    private List<LocalDate> normalizeCancelDates(CancelSeatSlotsBatchRequest request, LocalDateTime now) {
        List<LocalDate> explicitDates = request.slotDates();
        if (explicitDates != null && !explicitDates.isEmpty()) {
            return normalizeSlotDates(explicitDates, now);
        }
        if (request.startDate() == null) {
            throw new BusinessException("INVALID_SLOT_DATES", "Slot dates are required");
        }
        LocalDate endDate = request.endDate();
        if (endDate == null) {
            throw new BusinessException("INVALID_SLOT_DATES", "End date is required for range cancellation");
        }
        validateSlotDate(request.startDate(), now);
        validateSlotDate(endDate, now);
        if (endDate.isBefore(request.startDate())) {
            throw new BusinessException("INVALID_SLOT_DATES", "End date cannot be before start date");
        }
        long dateCount = request.startDate().datesUntil(endDate.plusDays(1)).count();
        if (dateCount > MAX_CANCEL_DATES) {
            throw new BusinessException("SEAT_SLOT_CANCEL_RANGE_TOO_LARGE", "Too many dates in one cancel request");
        }
        return request.startDate().datesUntil(endDate.plusDays(1)).toList();
    }

    private void validateBatchSize(int seatCount, int periodCount, int dateCount) {
        if ((long) seatCount * periodCount * dateCount > MAX_BATCH_SLOT_CREATIONS) {
            throw new BusinessException("SEAT_SLOT_BATCH_TOO_LARGE", "Too many seat slots in one publish request");
        }
    }

    private void validateSlotDate(LocalDate slotDate, LocalDateTime now) {
        if (slotDate == null) {
            throw new BusinessException("INVALID_SLOT_DATE", "Slot date is required");
        }
        if (slotDate.isBefore(now.toLocalDate())) {
            throw new BusinessException("SEAT_SLOT_DATE_PAST", "Past slot dates cannot be published");
        }
    }

    private void validatePeriod(LocalDate slotDate, PublishSeatSlotPeriod period, LocalDateTime now) {
        validatePeriodShape(period);
        LocalTime startTime = period.startTime();
        LocalDateTime slotStartAt = LocalDateTime.of(slotDate, startTime);
        if (!slotStartAt.isAfter(now)) {
            throw new BusinessException("SEAT_SLOT_ALREADY_STARTED", "Past seat slots cannot be published");
        }
    }

    private void validatePeriodShape(PublishSeatSlotPeriod period) {
        if (period == null) {
            throw new BusinessException("INVALID_SLOT_TIME_RANGE", "Slot time range is required");
        }
        LocalTime startTime = period.startTime();
        LocalTime endTime = period.endTime();
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new BusinessException("INVALID_SLOT_TIME_RANGE", "Slot start time must be before end time");
        }
        if (!isHalfHourBoundary(startTime) || !isHalfHourBoundary(endTime)) {
            throw new BusinessException("INVALID_SLOT_TIME_GRANULARITY", "Slot time must use 30-minute intervals");
        }
    }

    private boolean isHalfHourBoundary(LocalTime time) {
        return time.getSecond() == 0 && time.getNano() == 0 && (time.getMinute() == 0 || time.getMinute() == 30);
    }

    private List<SeatSlot> createSlotIfAbsent(
            PublishSeatSlotsRequest request,
            PublishSeatSlotPeriod period,
            Long seatId,
            LocalDateTime now
    ) {
        Seat seat = requireActiveSeatInArea(seatId, request.areaId());
        StudyTable table = requireActiveTable(seat.getTableId(), request.areaId());
        if (seatSlotMapper.countBySeatAndPeriod(seatId, request.slotDate(), period.startTime(), period.endTime()) > 0) {
            return List.of();
        }

        SeatSlot slot = new SeatSlot();
        slot.setSeatId(seat.getId());
        slot.setSeatNo(seat.getSeatNo());
        slot.setTableId(table.getId());
        slot.setTableNo(table.getTableNo());
        slot.setTableRowNo(table.getRowNo());
        slot.setTableColumnNo(table.getColumnNo());
        slot.setTableDisplayOrder(table.getDisplayOrder());
        slot.setTablePositionX(table.getPositionX());
        slot.setTablePositionY(table.getPositionY());
        slot.setTableWidthPx(table.getWidthPx());
        slot.setTableHeightPx(table.getHeightPx());
        slot.setTableRotationDeg(table.getRotationDeg());
        slot.setSeatLabel(seat.getSeatLabel());
        slot.setSeatSide(seat.getSeatSide());
        slot.setSeatOrder(seat.getSeatOrder());
        slot.setRowNo(seat.getRowNo());
        slot.setColumnNo(seat.getColumnNo());
        slot.setDisplayOrder(seat.getDisplayOrder());
        slot.setAreaId(request.areaId());
        slot.setSlotDate(request.slotDate());
        slot.setStartTime(period.startTime());
        slot.setEndTime(period.endTime());
        slot.setStatus(SeatSlotStatus.AVAILABLE);
        slot.setVersion(0);
        slot.setCreatedAt(now);
        slot.setUpdatedAt(now);
        seatSlotMapper.insert(slot);
        return List.of(slot);
    }

    private void requireActiveArea(Long areaId) {
        Area area = areaMapper.selectById(areaId);
        if (area == null) {
            throw new BusinessException("AREA_NOT_FOUND", "Area not found");
        }
        if (!SeatStatus.ACTIVE.equals(area.getStatus())) {
            throw new BusinessException("AREA_NOT_ACTIVE", "Area is not active");
        }
    }

    private Seat requireActiveSeatInArea(Long seatId, Long areaId) {
        Seat seat = seatMapper.selectById(seatId);
        if (seat == null || !areaId.equals(seat.getAreaId())) {
            throw new BusinessException("SEAT_NOT_FOUND", "Seat not found in area");
        }
        if (!SeatStatus.ACTIVE.equals(seat.getStatus())) {
            throw new BusinessException("SEAT_NOT_ACTIVE", "Seat is not active");
        }
        return seat;
    }

    private StudyTable requireActiveTable(Long tableId, Long areaId) {
        StudyTable table = studyTableMapper.selectById(tableId);
        if (table == null || !areaId.equals(table.getAreaId())) {
            throw new BusinessException("TABLE_NOT_FOUND", "Table not found");
        }
        if (!StudyTableStatus.ACTIVE.equals(table.getStatus())) {
            throw new BusinessException("TABLE_NOT_ACTIVE", "Table is not active");
        }
        return table;
    }

    private SeatSlot requireSeatSlot(Long seatSlotId) {
        SeatSlot slot = seatSlotMapper.selectById(seatSlotId);
        if (slot == null) {
            throw new BusinessException("SEAT_SLOT_NOT_FOUND", "Seat slot not found");
        }
        return slot;
    }

    private SeatSlotPublishPlan requirePublishPlan(Long planId) {
        SeatSlotPublishPlan plan = seatSlotPublishPlanMapper.selectById(planId);
        if (plan == null) {
            throw new BusinessException("SEAT_SLOT_PUBLISH_PLAN_NOT_FOUND", "Seat slot publish plan not found");
        }
        return plan;
    }

    private SeatSlotPublishPlanResponse toPublishPlanResponse(SeatSlotPublishPlan plan) {
        return SeatSlotPublishPlanResponse.from(new SeatSlotPublishPlanDetail(
                plan.getId(),
                plan.getAreaId(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getStatus(),
                seatSlotPublishPlanMapper.findPeriodsByPlanId(plan.getId()),
                seatSlotPublishPlanMapper.findSeatIdsByPlanId(plan.getId())
        ));
    }

    private void evictGeneratedSlotDates(Long areaId, LocalDate startDate, LocalDate endDate) {
        Stream<LocalDate> dates = endDate == null
                ? seatSlotMapper.findSlotDatesByAreaAndDateRange(areaId, startDate, null).stream()
                : startDate.datesUntil(endDate.plusDays(1));
        dates.forEach(slotDate -> seatSlotCacheService.evict(areaId, slotDate));
    }
}
