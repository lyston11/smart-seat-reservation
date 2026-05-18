package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.table.StudyTable;
import com.lyston.smartseat.table.StudyTableMapper;
import com.lyston.smartseat.table.StudyTableStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatSlotService {

    private static final int MAX_BATCH_SEATS = 200;
    private static final int MAX_BATCH_PERIODS = 12;

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final StudyTableMapper studyTableMapper;
    private final SeatSlotMapper seatSlotMapper;
    private final SeatSlotCacheService seatSlotCacheService;

    public SeatSlotService(
            AreaMapper areaMapper,
            SeatMapper seatMapper,
            StudyTableMapper studyTableMapper,
            SeatSlotMapper seatSlotMapper,
            SeatSlotCacheService seatSlotCacheService
    ) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.studyTableMapper = studyTableMapper;
        this.seatSlotMapper = seatSlotMapper;
        this.seatSlotCacheService = seatSlotCacheService;
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
        List<PublishSeatSlotPeriod> periods = normalizePeriods(request);
        LocalDateTime now = LocalDateTime.now();

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

    private List<Long> normalizeSeatIds(List<Long> seatIds) {
        Set<Long> uniqueSeatIds = new LinkedHashSet<>(seatIds);
        if (uniqueSeatIds.size() > MAX_BATCH_SEATS) {
            throw new BusinessException("SEAT_SLOT_BATCH_TOO_LARGE", "Too many seats in one publish request");
        }
        return uniqueSeatIds.stream().toList();
    }

    private List<PublishSeatSlotPeriod> normalizePeriods(PublishSeatSlotsRequest request) {
        List<PublishSeatSlotPeriod> periods = request.periods();
        if (periods == null || periods.isEmpty()) {
            periods = List.of(new PublishSeatSlotPeriod(request.startTime(), request.endTime()));
        }
        if (periods.size() > MAX_BATCH_PERIODS) {
            throw new BusinessException("SEAT_SLOT_PERIOD_BATCH_TOO_LARGE", "Too many periods in one publish request");
        }
        Set<String> uniqueKeys = new LinkedHashSet<>();
        return periods.stream()
                .peek(this::validatePeriod)
                .filter(period -> uniqueKeys.add(period.startTime() + "-" + period.endTime()))
                .toList();
    }

    private void validatePeriod(PublishSeatSlotPeriod period) {
        LocalTime startTime = period.startTime();
        LocalTime endTime = period.endTime();
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new BusinessException("INVALID_SLOT_TIME_RANGE", "Slot start time must be before end time");
        }
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
}
