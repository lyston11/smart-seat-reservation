package com.lyston.smartseat.table;

import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyTableService {

    private final AreaMapper areaMapper;
    private final StudyTableMapper studyTableMapper;

    public StudyTableService(AreaMapper areaMapper, StudyTableMapper studyTableMapper) {
        this.areaMapper = areaMapper;
        this.studyTableMapper = studyTableMapper;
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
        table.setCreatedAt(now);
        table.setUpdatedAt(now);
        studyTableMapper.insert(table);

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
        table.setUpdatedAt(LocalDateTime.now());
        studyTableMapper.updateById(table);

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

    private String generateQrToken() {
        return UUID.randomUUID().toString().replace("-", "");
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
}
