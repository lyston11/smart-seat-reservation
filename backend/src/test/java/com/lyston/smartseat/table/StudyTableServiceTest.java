package com.lyston.smartseat.table;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.lang.reflect.RecordComponent;
import java.time.LocalDateTime;
import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StudyTableServiceTest {

    private AreaMapperFake areaMapper;
    private StudyTableMapperFake studyTableMapper;
    private StudyTableService studyTableService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        studyTableMapper = new StudyTableMapperFake();
        studyTableService = new StudyTableService(areaMapper.proxy(), studyTableMapper.proxy());
    }

    @Test
    void createTableShouldTrimTableNoAndCreateUniqueQrToken() {
        areaMapper.area = area();

        StudyTableResponse response = studyTableService.createTable(
                new CreateStudyTableRequest(1L, " T01 ", " Window table ", null, null, null)
        );

        assertThat(response.tableNo()).isEqualTo("T01");
        assertThat(response.name()).isEqualTo("Window table");
        assertThat(response.status()).isEqualTo(StudyTableStatus.ACTIVE);
        assertThat(studyTableMapper.insertedTable.getQrToken()).hasSize(32).doesNotContain("-");
        assertThat(studyTableMapper.insertedTable.getTableNo()).isEqualTo("T01");
    }

    @Test
    void tableResponseShouldNotExposeQrToken() {
        assertThat(Arrays.stream(StudyTableResponse.class.getRecordComponents())
                .map(RecordComponent::getName))
                .doesNotContain("qrToken");
    }

    @Test
    void createTableShouldRejectDuplicateTableNoInSameArea() {
        areaMapper.area = area();
        studyTableMapper.duplicateCount = 1;

        assertThatThrownBy(() -> studyTableService.createTable(
                new CreateStudyTableRequest(1L, "T01", null, null, null, null)
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table number already exists in this area")
                .extracting("code")
                .isEqualTo("TABLE_NO_ALREADY_EXISTS");
    }

    @Test
    void updateTableStatusShouldRejectInvalidStatus() {
        studyTableMapper.table = table();

        assertThatThrownBy(() -> studyTableService.updateTableStatus(
                1L,
                new UpdateStudyTableStatusRequest("BROKEN")
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table status is invalid")
                .extracting("code")
                .isEqualTo("INVALID_TABLE_STATUS");
    }

    @Test
    void updateTableStatusShouldRejectInactiveWhenTableHasBusySlots() {
        studyTableMapper.table = table();
        studyTableMapper.busySlotCount = 1;

        assertThatThrownBy(() -> studyTableService.updateTableStatus(
                1L,
                new UpdateStudyTableStatusRequest(StudyTableStatus.INACTIVE)
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table has active reservations")
                .extracting("code")
                .isEqualTo("TABLE_HAS_ACTIVE_RESERVATION");
    }

    @Test
    void updateTableShouldRejectAreaChangeWhenTableHasSeats() {
        areaMapper.area = area();
        studyTableMapper.table = table();
        studyTableMapper.seatCount = 1;

        assertThatThrownBy(() -> studyTableService.updateTable(
                1L,
                new UpdateStudyTableRequest(2L, "T01", "Window table", StudyTableStatus.ACTIVE, null, null, null)
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table has seats and cannot change area")
                .extracting("code")
                .isEqualTo("TABLE_HAS_SEATS");
    }

    @Test
    void getCheckinQrShouldReturnStudentCheckinPathWithToken() {
        StudyTable table = table();
        table.setQrToken("abc123");
        studyTableMapper.table = table;

        StudyTableQrResponse response = studyTableService.getCheckinQr(1L);

        assertThat(response.tableId()).isEqualTo(1L);
        assertThat(response.tableNo()).isEqualTo("T01");
        assertThat(response.qrToken()).isEqualTo("abc123");
        assertThat(response.checkinPath()).isEqualTo("/student/table-checkin?token=abc123");
    }

    private Area area() {
        Area area = new Area();
        area.setId(1L);
        area.setName("Library Area A");
        return area;
    }

    private StudyTable table() {
        StudyTable table = new StudyTable();
        table.setId(1L);
        table.setAreaId(1L);
        table.setTableNo("T01");
        table.setName("Window table");
        table.setStatus(StudyTableStatus.ACTIVE);
        table.setQrToken("token");
        table.setCreatedAt(LocalDateTime.of(2026, 5, 18, 10, 0));
        table.setUpdatedAt(LocalDateTime.of(2026, 5, 18, 10, 0));
        return table;
    }

    private static final class AreaMapperFake {
        private Area area;

        AreaMapper proxy() {
            return StudyTableServiceTest.proxy(AreaMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> area;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class StudyTableMapperFake {
        private StudyTable table;
        private StudyTable insertedTable;
        private int duplicateCount;
        private int busySlotCount;
        private int seatCount;

        StudyTableMapper proxy() {
            return StudyTableServiceTest.proxy(StudyTableMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> table;
                case "insert" -> {
                    insertedTable = (StudyTable) args[0];
                    insertedTable.setId(1L);
                    yield 1;
                }
                case "countDuplicateTableNo" -> duplicateCount;
                case "countBusySlotsByTableId" -> busySlotCount;
                case "countSeatsByTableId" -> seatCount;
                default -> defaultValue(method.getReturnType());
            });
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
