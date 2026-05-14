package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatService {

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final SeatSlotMapper seatSlotMapper;

    public SeatService(AreaMapper areaMapper, SeatMapper seatMapper, SeatSlotMapper seatSlotMapper) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.seatSlotMapper = seatSlotMapper;
    }

    public List<SeatResponse> listSeats(Long areaId) {
        return seatMapper.findByAreaId(areaId)
                .stream()
                .map(SeatResponse::from)
                .toList();
    }

    @Transactional
    public SeatResponse createSeat(CreateSeatRequest request) {
        Long areaId = request.areaId();
        String seatNo = normalizeSeatNo(request.seatNo());
        requireArea(areaId);
        ensureSeatNoAvailable(areaId, seatNo, null);

        LocalDateTime now = LocalDateTime.now();
        Seat seat = new Seat();
        seat.setAreaId(areaId);
        seat.setSeatNo(seatNo);
        seat.setStatus(SeatStatus.ACTIVE);
        seat.setCreatedAt(now);
        seat.setUpdatedAt(now);
        seatMapper.insert(seat);

        return SeatResponse.from(seat);
    }

    @Transactional
    public SeatResponse updateSeat(Long seatId, UpdateSeatRequest request) {
        Seat seat = requireSeat(seatId);
        Long areaId = request.areaId();
        String seatNo = normalizeSeatNo(request.seatNo());
        String status = normalizeStatus(request.status());

        requireArea(areaId);
        ensureSeatNoAvailable(areaId, seatNo, seatId);
        ensureCanUseStatus(seat, status);

        seat.setAreaId(areaId);
        seat.setSeatNo(seatNo);
        seat.setStatus(status);
        seat.setUpdatedAt(LocalDateTime.now());
        seatMapper.updateById(seat);

        return SeatResponse.from(requireSeat(seatId));
    }

    @Transactional
    public SeatResponse updateSeatStatus(Long seatId, UpdateSeatStatusRequest request) {
        Seat seat = requireSeat(seatId);
        String status = normalizeStatus(request.status());
        ensureCanUseStatus(seat, status);

        seat.setStatus(status);
        seat.setUpdatedAt(LocalDateTime.now());
        seatMapper.updateById(seat);

        return SeatResponse.from(requireSeat(seatId));
    }

    private String normalizeSeatNo(String seatNo) {
        return seatNo.trim();
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status.trim().toUpperCase();
        if (!SeatStatus.isAllowed(normalizedStatus)) {
            throw new BusinessException("INVALID_SEAT_STATUS", "Seat status is invalid");
        }
        return normalizedStatus;
    }

    private void requireArea(Long areaId) {
        if (areaMapper.selectById(areaId) == null) {
            throw new BusinessException("AREA_NOT_FOUND", "Area not found");
        }
    }

    private Seat requireSeat(Long seatId) {
        Seat seat = seatMapper.selectById(seatId);
        if (seat == null) {
            throw new BusinessException("SEAT_NOT_FOUND", "Seat not found");
        }
        return seat;
    }

    private void ensureSeatNoAvailable(Long areaId, String seatNo, Long excludedSeatId) {
        if (seatMapper.countDuplicateSeatNo(areaId, seatNo, excludedSeatId) > 0) {
            throw new BusinessException("SEAT_NO_ALREADY_EXISTS", "Seat number already exists in this area");
        }
    }

    private void ensureCanUseStatus(Seat seat, String status) {
        if (SeatStatus.ACTIVE.equals(status)) {
            return;
        }
        if (seatSlotMapper.countBusySlotsBySeatId(seat.getId()) > 0) {
            throw new BusinessException("SEAT_HAS_ACTIVE_RESERVATION", "Seat has active reservations");
        }
    }
}
