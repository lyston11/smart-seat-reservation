package com.lyston.smartseat.seat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import com.lyston.smartseat.cache.SeatSlotCacheService;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.table.StudyTable;
import com.lyston.smartseat.table.StudyTableMapper;
import com.lyston.smartseat.table.StudyTableStatus;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class SeatSlotServiceTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-05-19T11:30:00Z"),
            ZoneId.of("Asia/Shanghai")
    );
    private static final LocalDate TODAY = LocalDate.now(FIXED_CLOCK);

    private AreaMapperFake areaMapper;
    private SeatMapperFake seatMapper;
    private StudyTableMapperFake studyTableMapper;
    private SeatSlotMapperFake seatSlotMapper;
    private SeatSlotCacheServiceFake seatSlotCacheService;
    private SeatSlotService seatSlotService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        seatMapper = new SeatMapperFake();
        studyTableMapper = new StudyTableMapperFake();
        seatSlotMapper = new SeatSlotMapperFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        seatSlotService = new SeatSlotService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                studyTableMapper.proxy(),
                seatSlotMapper.proxy(),
                seatSlotCacheService,
                FIXED_CLOCK
        );
    }

    @Test
    void publishSeatSlotsShouldRejectAlreadyStartedTodayPeriod() {
        areaMapper.area = activeArea(1L);

        PublishSeatSlotsRequest request = new PublishSeatSlotsRequest(
                1L,
                TODAY,
                null,
                null,
                List.of(new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(10, 0))),
                List.of(10L)
        );

        assertThatThrownBy(() -> seatSlotService.publishSeatSlots(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Past seat slots cannot be published")
                .extracting("code")
                .isEqualTo("SEAT_SLOT_ALREADY_STARTED");

        assertThat(seatSlotMapper.insertedSlots).isEmpty();
    }

    @Test
    void publishSeatSlotsShouldRejectPastDate() {
        areaMapper.area = activeArea(1L);

        PublishSeatSlotsRequest request = new PublishSeatSlotsRequest(
                1L,
                TODAY.minusDays(1),
                null,
                null,
                List.of(new PublishSeatSlotPeriod(LocalTime.of(20, 0), LocalTime.of(22, 0))),
                List.of(10L)
        );

        assertThatThrownBy(() -> seatSlotService.publishSeatSlots(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Past slot dates cannot be published")
                .extracting("code")
                .isEqualTo("SEAT_SLOT_DATE_PAST");

        assertThat(seatSlotMapper.insertedSlots).isEmpty();
    }

    @Test
    void publishSeatSlotsShouldCreateFutureTodayPeriodAndEvictCache() {
        areaMapper.area = activeArea(1L);
        seatMapper.seat = activeSeat(10L, 1L, 100L);
        studyTableMapper.table = activeTable(100L, 1L);

        PublishSeatSlotsResponse response = seatSlotService.publishSeatSlots(new PublishSeatSlotsRequest(
                1L,
                TODAY,
                null,
                null,
                List.of(new PublishSeatSlotPeriod(LocalTime.of(20, 0), LocalTime.of(22, 0))),
                List.of(10L)
        ));

        assertThat(response.createdCount()).isEqualTo(1);
        assertThat(response.skippedCount()).isZero();
        assertThat(seatSlotMapper.insertedSlots).hasSize(1);
        assertThat(seatSlotMapper.insertedSlots.getFirst().getStartTime()).isEqualTo(LocalTime.of(20, 0));
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(TODAY);
    }

    @Test
    void publishSeatSlotsShouldRejectNonHalfHourPeriod() {
        areaMapper.area = activeArea(1L);

        PublishSeatSlotsRequest request = new PublishSeatSlotsRequest(
                1L,
                TODAY,
                null,
                null,
                List.of(new PublishSeatSlotPeriod(LocalTime.of(20, 15), LocalTime.of(22, 0))),
                List.of(10L)
        );

        assertThatThrownBy(() -> seatSlotService.publishSeatSlots(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Slot time must use 30-minute intervals")
                .extracting("code")
                .isEqualTo("INVALID_SLOT_TIME_GRANULARITY");

        assertThat(seatSlotMapper.insertedSlots).isEmpty();
    }

    private Area activeArea(Long areaId) {
        Area area = new Area();
        area.setId(areaId);
        area.setStatus(SeatStatus.ACTIVE);
        return area;
    }

    private Seat activeSeat(Long seatId, Long areaId, Long tableId) {
        Seat seat = new Seat();
        seat.setId(seatId);
        seat.setAreaId(areaId);
        seat.setTableId(tableId);
        seat.setSeatNo("A-001");
        seat.setStatus(SeatStatus.ACTIVE);
        return seat;
    }

    private StudyTable activeTable(Long tableId, Long areaId) {
        StudyTable table = new StudyTable();
        table.setId(tableId);
        table.setAreaId(areaId);
        table.setTableNo("T01");
        table.setStatus(StudyTableStatus.ACTIVE);
        return table;
    }

    private static final class AreaMapperFake {
        private Area area;

        AreaMapper proxy() {
            return SeatSlotServiceTest.proxy(AreaMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> area;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatMapperFake {
        private Seat seat;

        SeatMapper proxy() {
            return SeatSlotServiceTest.proxy(SeatMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> seat;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class StudyTableMapperFake {
        private StudyTable table;

        StudyTableMapper proxy() {
            return SeatSlotServiceTest.proxy(StudyTableMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "selectById" -> table;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatSlotMapperFake {
        private final List<SeatSlot> insertedSlots = new ArrayList<>();

        SeatSlotMapper proxy() {
            return SeatSlotServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "countBySeatAndPeriod" -> 0;
                case "insert" -> {
                    SeatSlot slot = (SeatSlot) args[0];
                    slot.setId((long) insertedSlots.size() + 1);
                    insertedSlots.add(slot);
                    yield 1;
                }
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatSlotCacheServiceFake extends SeatSlotCacheService {
        private Long evictedAreaId;
        private LocalDate evictedDate;

        SeatSlotCacheServiceFake() {
            super(null, new ObjectMapper());
        }

        @Override
        public void evict(Long areaId, LocalDate date) {
            evictedAreaId = areaId;
            evictedDate = date;
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
