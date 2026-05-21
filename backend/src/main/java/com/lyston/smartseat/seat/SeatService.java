package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.table.StudyTable;
import com.lyston.smartseat.table.StudyTableMapper;
import com.lyston.smartseat.table.StudyTableStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatService {

    private static final Set<String> ALLOWED_SEAT_SIDES = Set.of("NORTH", "EAST", "SOUTH", "WEST", "SINGLE");

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final SeatSlotMapper seatSlotMapper;
    private final StudyTableMapper studyTableMapper;

    public SeatService(
            AreaMapper areaMapper,
            SeatMapper seatMapper,
            SeatSlotMapper seatSlotMapper,
            StudyTableMapper studyTableMapper
    ) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.seatSlotMapper = seatSlotMapper;
        this.studyTableMapper = studyTableMapper;
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
        StudyTable table = requireTableInArea(request.tableId(), areaId);
        ensureTableCanHostStatus(table, SeatStatus.ACTIVE);
        ensureSeatNoAvailable(areaId, seatNo, null);

        LocalDateTime now = LocalDateTime.now();
        Seat seat = new Seat();
        seat.setAreaId(areaId);
        seat.setTableId(table.getId());
        seat.setTableNo(table.getTableNo());
        seat.setSeatNo(seatNo);
        seat.setSeatLabel(normalizeNullable(request.seatLabel()));
        seat.setSeatSide(normalizeSeatSide(request.seatSide()));
        seat.setSeatOrder(request.seatOrder());
        seat.setQrToken(generateSeatQrToken());
        seat.setRowNo(request.rowNo());
        seat.setColumnNo(request.columnNo());
        seat.setDisplayOrder(resolveDisplayOrder(request.displayOrder(), areaId));
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
        StudyTable table = requireTableInArea(request.tableId(), areaId);
        ensureTableCanHostStatus(table, status);
        ensureSeatNoAvailable(areaId, seatNo, seatId);
        ensureCanUseStatus(seat, status);

        seat.setAreaId(areaId);
        seat.setTableId(table.getId());
        seat.setTableNo(table.getTableNo());
        seat.setSeatNo(seatNo);
        seat.setSeatLabel(normalizeNullable(request.seatLabel()));
        seat.setSeatSide(normalizeSeatSide(request.seatSide()));
        seat.setSeatOrder(request.seatOrder());
        seat.setRowNo(request.rowNo() == null ? seat.getRowNo() : request.rowNo());
        seat.setColumnNo(request.columnNo() == null ? seat.getColumnNo() : request.columnNo());
        seat.setDisplayOrder(request.displayOrder() == null ? seat.getDisplayOrder() : request.displayOrder());
        seat.setStatus(status);
        seat.setUpdatedAt(LocalDateTime.now());
        seatMapper.updateById(seat);

        return SeatResponse.from(seat);
    }

    @Transactional
    public SeatResponse updateSeatStatus(Long seatId, UpdateSeatStatusRequest request) {
        Seat seat = requireSeat(seatId);
        String status = normalizeStatus(request.status());
        StudyTable table = requireTableInArea(seat.getTableId(), seat.getAreaId());
        ensureTableCanHostStatus(table, status);
        ensureCanUseStatus(seat, status);

        seat.setTableNo(table.getTableNo());
        seat.setStatus(status);
        seat.setUpdatedAt(LocalDateTime.now());
        seatMapper.updateById(seat);

        return SeatResponse.from(seat);
    }

    public SeatQrResponse getSeatCheckinQr(Long seatId) {
        Seat seat = seatMapper.findByIdWithQrToken(seatId);
        if (seat == null) {
            throw new BusinessException("SEAT_NOT_FOUND", "Seat not found");
        }
        if (!SeatStatus.ACTIVE.equals(seat.getStatus())) {
            throw new BusinessException("SEAT_NOT_ACTIVE", "Seat is not active");
        }
        if (seat.getQrToken() == null || seat.getQrToken().isBlank()) {
            throw new BusinessException("SEAT_QR_NOT_CONFIGURED", "Seat check-in QR token is not configured");
        }
        return SeatQrResponse.from(seat);
    }

    private String normalizeSeatNo(String seatNo) {
        return seatNo.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSeatSide(String seatSide) {
        String normalizedSide = normalizeNullable(seatSide);
        if (normalizedSide == null) {
            return null;
        }
        normalizedSide = normalizedSide.toUpperCase();
        if (!ALLOWED_SEAT_SIDES.contains(normalizedSide)) {
            throw new BusinessException("INVALID_SEAT_SIDE", "Seat side is invalid");
        }
        return normalizedSide;
    }

    private Integer resolveDisplayOrder(Integer displayOrder, Long areaId) {
        if (displayOrder != null) {
            return displayOrder;
        }
        return seatMapper.countByAreaId(areaId) + 1;
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status.trim().toUpperCase();
        if (!SeatStatus.isAllowed(normalizedStatus)) {
            throw new BusinessException("INVALID_SEAT_STATUS", "Seat status is invalid");
        }
        return normalizedStatus;
    }

    private String generateSeatQrToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void requireArea(Long areaId) {
        if (areaMapper.selectById(areaId) == null) {
            throw new BusinessException("AREA_NOT_FOUND", "Area not found");
        }
    }

    private StudyTable requireTableInArea(Long tableId, Long areaId) {
        StudyTable table = studyTableMapper.selectById(tableId);
        if (table == null || !areaId.equals(table.getAreaId())) {
            throw new BusinessException("TABLE_NOT_FOUND", "Table not found");
        }
        return table;
    }

    private void ensureTableCanHostStatus(StudyTable table, String status) {
        if (SeatStatus.ACTIVE.equals(status) && !StudyTableStatus.ACTIVE.equals(table.getStatus())) {
            throw new BusinessException("TABLE_NOT_ACTIVE", "Table is not active");
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
