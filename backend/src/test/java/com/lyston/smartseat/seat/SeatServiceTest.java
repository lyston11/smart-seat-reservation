package com.lyston.smartseat.seat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.table.StudyTable;
import com.lyston.smartseat.table.StudyTableMapper;
import com.lyston.smartseat.table.StudyTableStatus;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SeatServiceTest {

    private AreaMapperFake areaMapper;
    private SeatMapperFake seatMapper;
    private SeatSlotMapperFake seatSlotMapper;
    private StudyTableMapperFake studyTableMapper;
    private SeatService seatService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        seatMapper = new SeatMapperFake();
        seatSlotMapper = new SeatSlotMapperFake();
        studyTableMapper = new StudyTableMapperFake();
        seatService = new SeatService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                seatSlotMapper.proxy(),
                studyTableMapper.proxy()
        );
    }

    @Test
    void createSeatShouldRejectTableFromAnotherArea() {
        areaMapper.area = area(1L);
        StudyTable table = table(10L, 2L, StudyTableStatus.ACTIVE);
        studyTableMapper.table = table;

        assertThatThrownBy(() -> seatService.createSeat(new CreateSeatRequest(
                1L,
                10L,
                " A-01 ",
                null,
                " west ",
                2,
                null,
                null,
                null
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table not found")
                .extracting("code")
                .isEqualTo("TABLE_NOT_FOUND");
    }

    @Test
    void createSeatShouldRejectMissingTable() {
        areaMapper.area = area(1L);

        assertThatThrownBy(() -> seatService.createSeat(new CreateSeatRequest(
                1L,
                99L,
                "A-01",
                "A1",
                "WEST",
                1,
                null,
                null,
                null
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table not found")
                .extracting("code")
                .isEqualTo("TABLE_NOT_FOUND");
    }

    @Test
    void createActiveSeatShouldRejectInactiveTable() {
        areaMapper.area = area(1L);
        studyTableMapper.table = table(10L, 1L, StudyTableStatus.INACTIVE);

        assertThatThrownBy(() -> seatService.createSeat(new CreateSeatRequest(
                1L,
                10L,
                "A-01",
                "A1",
                "WEST",
                1,
                null,
                null,
                null
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Table is not active")
                .extracting("code")
                .isEqualTo("TABLE_NOT_ACTIVE");
    }

    @Test
    void createSeatShouldRejectInvalidSeatSide() {
        areaMapper.area = area(1L);
        studyTableMapper.table = table(10L, 1L, StudyTableStatus.ACTIVE);

        assertThatThrownBy(() -> seatService.createSeat(new CreateSeatRequest(
                1L,
                10L,
                "A-01",
                "A1",
                "corner",
                1,
                null,
                null,
                null
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Seat side is invalid")
                .extracting("code")
                .isEqualTo("INVALID_SEAT_SIDE");
    }

    @Test
    void createSeatResponseShouldIncludeTableFieldsWhenValid() {
        areaMapper.area = area(1L);
        studyTableMapper.table = table(10L, 1L, StudyTableStatus.ACTIVE);

        SeatResponse response = seatService.createSeat(new CreateSeatRequest(
                1L,
                10L,
                " A-01 ",
                " A1 ",
                " west ",
                2,
                3,
                4,
                5
        ));

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.tableId()).isEqualTo(10L);
        assertThat(response.tableNo()).isEqualTo("T10");
        assertThat(response.seatNo()).isEqualTo("A-01");
        assertThat(response.seatLabel()).isEqualTo("A1");
        assertThat(response.seatSide()).isEqualTo("WEST");
        assertThat(response.seatOrder()).isEqualTo(2);
        assertThat(seatMapper.insertedSeat.getTableId()).isEqualTo(10L);
        assertThat(seatMapper.insertedSeat.getSeatLabel()).isEqualTo("A1");
        assertThat(seatMapper.insertedSeat.getSeatSide()).isEqualTo("WEST");
        assertThat(seatMapper.insertedSeat.getSeatOrder()).isEqualTo(2);
    }

    private Area area(Long areaId) {
        Area area = new Area();
        area.setId(areaId);
        area.setName("Area " + areaId);
        return area;
    }

    private StudyTable table(Long tableId, Long areaId, String status) {
        StudyTable table = new StudyTable();
        table.setId(tableId);
        table.setAreaId(areaId);
        table.setTableNo("T" + tableId);
        table.setStatus(status);
        table.setCreatedAt(LocalDateTime.of(2026, 5, 18, 10, 0));
        table.setUpdatedAt(LocalDateTime.of(2026, 5, 18, 10, 0));
        return table;
    }

    private static final class AreaMapperFake {
        private Area area;

        AreaMapper proxy() {
            return SeatServiceTest.proxy(AreaMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> area;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatMapperFake {
        private Seat insertedSeat;

        SeatMapper proxy() {
            return SeatServiceTest.proxy(SeatMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "insert" -> {
                    insertedSeat = (Seat) args[0];
                    insertedSeat.setId(100L);
                    yield 1;
                }
                case "countByAreaId" -> 4;
                case "countDuplicateSeatNo" -> 0;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatSlotMapperFake {
        SeatSlotMapper proxy() {
            return SeatServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> defaultValue(method.getReturnType()));
        }
    }

    private static final class StudyTableMapperFake {
        private StudyTable table;

        StudyTableMapper proxy() {
            return SeatServiceTest.proxy(StudyTableMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> table;
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
