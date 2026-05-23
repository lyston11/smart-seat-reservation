package com.lyston.smartseat.table;

import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.seat.Seat;
import com.lyston.smartseat.seat.SeatMapper;
import com.lyston.smartseat.seat.SeatStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyTableService {

    private static final int DEFAULT_POSITION_X = 80;
    private static final int DEFAULT_POSITION_Y = 80;
    private static final int DEFAULT_WIDTH_PX = 220;
    private static final int DEFAULT_HEIGHT_PX = 96;
    private static final int DEFAULT_ROTATION_DEG = 0;
    private static final int DEFAULT_SEAT_COUNT = 4;
    private static final int MAX_TABLE_SEAT_COUNT = 12;

    private final AreaMapper areaMapper;
    private final StudyTableMapper studyTableMapper;
    private final SeatMapper seatMapper;

    public StudyTableService(AreaMapper areaMapper, StudyTableMapper studyTableMapper, SeatMapper seatMapper) {
        this.areaMapper = areaMapper;
        this.studyTableMapper = studyTableMapper;
        this.seatMapper = seatMapper;
    }

    public List<StudyTableResponse> listTables(Long areaId) {
        return studyTableMapper.findByAreaId(areaId)
                .stream()
                .map(StudyTableResponse::from)
                .toList();
    }

    @Transactional
    public StudyTableResponse createTable(CreateStudyTableRequest request) {
        Long areaId = request.areaId();
        String tableNo = normalizeTableNo(request.tableNo());
        requireArea(areaId);
        ensureTableNoAvailable(areaId, tableNo, null);

        LocalDateTime now = LocalDateTime.now();
        StudyTable table = new StudyTable();
        table.setAreaId(areaId);
        table.setTableNo(tableNo);
        table.setName(normalizeNullable(request.name()));
        table.setStatus(StudyTableStatus.ACTIVE);
        table.setQrToken(generateQrToken());
        table.setRowNo(request.rowNo());
        table.setColumnNo(request.columnNo());
        table.setDisplayOrder(resolveDisplayOrder(request.displayOrder(), areaId));
        table.setPositionX(resolveLayoutValue(request.positionX(), DEFAULT_POSITION_X));
        table.setPositionY(resolveLayoutValue(request.positionY(), DEFAULT_POSITION_Y));
        table.setWidthPx(resolveLayoutValue(request.widthPx(), DEFAULT_WIDTH_PX));
        table.setHeightPx(resolveLayoutValue(request.heightPx(), DEFAULT_HEIGHT_PX));
        table.setRotationDeg(resolveLayoutValue(request.rotationDeg(), DEFAULT_ROTATION_DEG));
        table.setCreatedAt(now);
        table.setUpdatedAt(now);
        studyTableMapper.insert(table);
        createSeatsForEmptyActiveTable(table, request.seatCount());

        return StudyTableResponse.from(table);
    }

    @Transactional
    public StudyTableResponse updateTable(Long tableId, UpdateStudyTableRequest request) {
        StudyTable table = requireTable(tableId);
        Long areaId = request.areaId();
        String tableNo = normalizeTableNo(request.tableNo());
        String status = normalizeStatus(request.status());

        requireArea(areaId);
        ensureTableNoAvailable(areaId, tableNo, tableId);
        ensureAreaCanChange(table, areaId);
        ensureCanUseStatus(table, status);

        table.setAreaId(areaId);
        table.setTableNo(tableNo);
        table.setName(normalizeNullable(request.name()));
        table.setStatus(status);
        table.setRowNo(request.rowNo() == null ? table.getRowNo() : request.rowNo());
        table.setColumnNo(request.columnNo() == null ? table.getColumnNo() : request.columnNo());
        table.setDisplayOrder(request.displayOrder() == null ? table.getDisplayOrder() : request.displayOrder());
        table.setPositionX(request.positionX() == null ? table.getPositionX() : request.positionX());
        table.setPositionY(request.positionY() == null ? table.getPositionY() : request.positionY());
        table.setWidthPx(request.widthPx() == null ? table.getWidthPx() : request.widthPx());
        table.setHeightPx(request.heightPx() == null ? table.getHeightPx() : request.heightPx());
        table.setRotationDeg(request.rotationDeg() == null ? table.getRotationDeg() : request.rotationDeg());
        table.setUpdatedAt(LocalDateTime.now());
        studyTableMapper.updateById(table);
        createSeatsForEmptyActiveTable(table, request.seatCount());

        return StudyTableResponse.from(requireTable(tableId));
    }

    @Transactional
    public StudyTableResponse updateTableStatus(Long tableId, UpdateStudyTableStatusRequest request) {
        StudyTable table = requireTable(tableId);
        String status = normalizeStatus(request.status());
        ensureCanUseStatus(table, status);

        table.setStatus(status);
        table.setUpdatedAt(LocalDateTime.now());
        studyTableMapper.updateById(table);
        createSeatsForEmptyActiveTable(table, inferSeatCount(table));

        return StudyTableResponse.from(requireTable(tableId));
    }

    public StudyTableQrResponse getCheckinQr(Long tableId) {
        return StudyTableQrResponse.from(requireTable(tableId));
    }

    private String normalizeTableNo(String tableNo) {
        return tableNo.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status.trim().toUpperCase();
        if (!StudyTableStatus.isAllowed(normalizedStatus)) {
            throw new BusinessException("INVALID_TABLE_STATUS", "Table status is invalid");
        }
        return normalizedStatus;
    }

    private Integer resolveDisplayOrder(Integer displayOrder, Long areaId) {
        if (displayOrder != null) {
            return displayOrder;
        }
        return studyTableMapper.countByAreaId(areaId) + 1;
    }

    private Integer resolveLayoutValue(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private String generateQrToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void createSeatsForEmptyActiveTable(StudyTable table, Integer requestedSeatCount) {
        if (requestedSeatCount == null || !StudyTableStatus.ACTIVE.equals(table.getStatus())) {
            return;
        }
        int seatCount = validateSeatCount(requestedSeatCount);
        if (studyTableMapper.countSeatsByTableId(table.getId()) > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        int baseDisplayOrder = seatMapper.countByAreaId(table.getAreaId());
        List<SeatLayout> layouts = buildSeatLayouts(seatCount);
        for (int index = 0; index < layouts.size(); index++) {
            SeatLayout layout = layouts.get(index);
            int seatIndex = index + 1;
            Seat seat = new Seat();
            seat.setAreaId(table.getAreaId());
            seat.setTableId(table.getId());
            seat.setTableNo(table.getTableNo());
            seat.setSeatNo(resolveSeatNo(table, seatIndex));
            seat.setSeatLabel(String.valueOf(seatIndex));
            seat.setSeatSide(layout.side());
            seat.setSeatOrder(layout.order());
            seat.setQrToken(generateQrToken());
            seat.setRowNo(layout.rowNo());
            seat.setColumnNo(layout.columnNo());
            seat.setDisplayOrder(baseDisplayOrder + seatIndex);
            seat.setStatus(SeatStatus.ACTIVE);
            seat.setCreatedAt(now);
            seat.setUpdatedAt(now);
            seatMapper.insert(seat);
        }
    }

    private int validateSeatCount(int seatCount) {
        if (seatCount < 1 || seatCount > MAX_TABLE_SEAT_COUNT) {
            throw new BusinessException("INVALID_TABLE_SEAT_COUNT", "Table seat count is invalid");
        }
        return seatCount;
    }

    private Integer inferSeatCount(StudyTable table) {
        Integer width = table.getWidthPx();
        Integer height = table.getHeightPx();
        if (width != null && height != null) {
            if (width <= 140 && height <= 100) {
                return 1;
            }
            if (width <= 190 && height <= 96) {
                return 2;
            }
            if (width <= 200 && height >= 120) {
                return 3;
            }
        }
        return DEFAULT_SEAT_COUNT;
    }

    private List<SeatLayout> buildSeatLayouts(int seatCount) {
        if (seatCount == 1) {
            return List.of(new SeatLayout("SINGLE", 1, 1, 1));
        }

        int topSeatCount = (seatCount + 1) / 2;
        List<SeatLayout> layouts = new ArrayList<>(seatCount);
        for (int index = 1; index <= seatCount; index++) {
            if (index <= topSeatCount) {
                layouts.add(new SeatLayout("NORTH", index, 1, index));
            } else {
                int bottomOrder = index - topSeatCount;
                layouts.add(new SeatLayout("SOUTH", bottomOrder, 2, bottomOrder));
            }
        }
        return layouts;
    }

    private String resolveSeatNo(StudyTable table, int seatIndex) {
        String base = normalizeSeatNoBase(table);
        String suffix = "-" + String.format("%02d", seatIndex);
        String candidate = base + suffix;
        if (seatMapper.countDuplicateSeatNo(table.getAreaId(), candidate, null) == 0) {
            return candidate;
        }

        String fallback = "T" + table.getId() + suffix;
        if (seatMapper.countDuplicateSeatNo(table.getAreaId(), fallback, null) == 0) {
            return fallback;
        }
        return "T" + table.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String normalizeSeatNoBase(StudyTable table) {
        String base = normalizeNullable(table.getTableNo());
        if (base == null || base.length() > 28) {
            return "T" + table.getId();
        }
        return base;
    }

    private void requireArea(Long areaId) {
        if (areaMapper.selectById(areaId) == null) {
            throw new BusinessException("AREA_NOT_FOUND", "Area not found");
        }
    }

    private StudyTable requireTable(Long tableId) {
        StudyTable table = studyTableMapper.selectById(tableId);
        if (table == null) {
            throw new BusinessException("TABLE_NOT_FOUND", "Table not found");
        }
        return table;
    }

    private void ensureTableNoAvailable(Long areaId, String tableNo, Long excludedTableId) {
        if (studyTableMapper.countDuplicateTableNo(areaId, tableNo, excludedTableId) > 0) {
            throw new BusinessException("TABLE_NO_ALREADY_EXISTS", "Table number already exists in this area");
        }
    }

    private void ensureAreaCanChange(StudyTable table, Long areaId) {
        if (table.getAreaId().equals(areaId)) {
            return;
        }
        if (studyTableMapper.countSeatsByTableId(table.getId()) > 0) {
            throw new BusinessException("TABLE_HAS_SEATS", "Table has seats and cannot change area");
        }
    }

    private void ensureCanUseStatus(StudyTable table, String status) {
        if (StudyTableStatus.ACTIVE.equals(status)) {
            return;
        }
        if (studyTableMapper.countBusySlotsByTableId(table.getId()) > 0) {
            throw new BusinessException("TABLE_HAS_ACTIVE_RESERVATION", "Table has active reservations");
        }
    }

    private record SeatLayout(String side, int order, int rowNo, int columnNo) {
    }
}
