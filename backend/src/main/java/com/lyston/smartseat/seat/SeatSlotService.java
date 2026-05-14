package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatSlotService {

    private static final int MAX_BATCH_SEATS = 200;

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final SeatSlotMapper seatSlotMapper;

    public SeatSlotService(AreaMapper areaMapper, SeatMapper seatMapper, SeatSlotMapper seatSlotMapper) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.seatSlotMapper = seatSlotMapper;
    }

    public List<SeatSlotResponse> listSeatSlots(Long areaId, LocalDate date) {
        return seatSlotMapper.findByAreaAndDate(areaId, date)
                .stream()
                .map(SeatSlotResponse::from)
                .toList();
    }

    @Transactional
    public PublishSeatSlotsResponse publishSeatSlots(PublishSeatSlotsRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("INVALID_SLOT_TIME_RANGE", "Slot start time must be before end time");
        }

        requireActiveArea(request.areaId());
        List<Long> seatIds = normalizeSeatIds(request.seatIds());
        LocalDateTime now = LocalDateTime.now();

        List<SeatSlot> createdSlots = seatIds.stream()
                .map(seatId -> createSlotIfAbsent(request, seatId, now))
                .flatMap(List::stream)
                .toList();

        return new PublishSeatSlotsResponse(
                createdSlots.size(),
                seatIds.size() - createdSlots.size(),
                createdSlots.stream().map(SeatSlotResponse::from).toList()
        );
    }

    private List<Long> normalizeSeatIds(List<Long> seatIds) {
        Set<Long> uniqueSeatIds = new LinkedHashSet<>(seatIds);
        if (uniqueSeatIds.size() > MAX_BATCH_SEATS) {
            throw new BusinessException("SEAT_SLOT_BATCH_TOO_LARGE", "Too many seats in one publish request");
        }
        return uniqueSeatIds.stream().toList();
    }

    private List<SeatSlot> createSlotIfAbsent(PublishSeatSlotsRequest request, Long seatId, LocalDateTime now) {
        Seat seat = requireActiveSeatInArea(seatId, request.areaId());
        if (seatSlotMapper.countBySeatAndPeriod(seatId, request.slotDate(), request.startTime(), request.endTime()) > 0) {
            return List.of();
        }

        SeatSlot slot = new SeatSlot();
        slot.setSeatId(seat.getId());
        slot.setAreaId(request.areaId());
        slot.setSlotDate(request.slotDate());
        slot.setStartTime(request.startTime());
        slot.setEndTime(request.endTime());
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
}
