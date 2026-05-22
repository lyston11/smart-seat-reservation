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
import java.util.stream.LongStream;
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
    private SeatSlotPublishPlanMapperFake seatSlotPublishPlanMapper;
    private SeatSlotCacheServiceFake seatSlotCacheService;
    private SeatSlotService seatSlotService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        seatMapper = new SeatMapperFake();
        studyTableMapper = new StudyTableMapperFake();
        seatSlotMapper = new SeatSlotMapperFake();
        seatSlotPublishPlanMapper = new SeatSlotPublishPlanMapperFake();
        seatSlotCacheService = new SeatSlotCacheServiceFake();
        seatSlotService = new SeatSlotService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                studyTableMapper.proxy(),
                seatSlotMapper.proxy(),
                seatSlotPublishPlanMapper.proxy(),
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
    void publishSeatSlotsBatchShouldCreateSlotsForSelectedDatesAndEvictEachDate() {
        areaMapper.area = activeArea(1L);
        seatMapper.seat = activeSeat(10L, 1L, 100L);
        studyTableMapper.table = activeTable(100L, 1L);

        PublishSeatSlotsBatchResponse response = seatSlotService.publishSeatSlotsBatch(new PublishSeatSlotsBatchRequest(
                1L,
                List.of(TODAY.plusDays(3), TODAY.plusDays(1), TODAY.plusDays(3)),
                null,
                null,
                List.of(
                        new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(12, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(14, 0), LocalTime.of(18, 0))
                ),
                List.of(10L)
        ));

        assertThat(response.dateCount()).isEqualTo(2);
        assertThat(response.createdCount()).isEqualTo(4);
        assertThat(response.skippedCount()).isZero();
        assertThat(seatSlotMapper.insertedSlots).hasSize(4);
        assertThat(seatSlotMapper.insertedSlots)
                .extracting(SeatSlot::getSlotDate)
                .containsExactly(TODAY.plusDays(1), TODAY.plusDays(1), TODAY.plusDays(3), TODAY.plusDays(3));
        assertThat(seatSlotCacheService.evictedDates).containsExactly(TODAY.plusDays(1), TODAY.plusDays(3));
    }

    @Test
    void publishSeatSlotsBatchShouldRejectTooManyCombinations() {
        areaMapper.area = activeArea(1L);

        PublishSeatSlotsBatchRequest request = new PublishSeatSlotsBatchRequest(
                1L,
                TODAY.plusDays(1).datesUntil(TODAY.plusDays(201)).toList(),
                null,
                null,
                List.of(
                        new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(10, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(10, 0), LocalTime.of(12, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(14, 0), LocalTime.of(16, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(16, 0), LocalTime.of(18, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(18, 0), LocalTime.of(20, 0)),
                        new PublishSeatSlotPeriod(LocalTime.of(20, 0), LocalTime.of(22, 0))
                ),
                LongStream.rangeClosed(1, 100)
                        .boxed()
                        .toList()
        );

        assertThatThrownBy(() -> seatSlotService.publishSeatSlotsBatch(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Too many seat slots in one publish request")
                .extracting("code")
                .isEqualTo("SEAT_SLOT_BATCH_TOO_LARGE");
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

    @Test
    void cancelSeatSlotsByDateShouldDeleteOnlyAvailableSlotsAndReportBlockedCount() {
        areaMapper.area = activeArea(1L);
        seatSlotMapper.nonCancelableCount = 2;
        seatSlotMapper.deletedAvailableCount = 6;

        CancelSeatSlotsByDateResponse response = seatSlotService.cancelSeatSlotsByDate(1L, TODAY.plusDays(1));

        assertThat(response.areaId()).isEqualTo(1L);
        assertThat(response.slotDate()).isEqualTo(TODAY.plusDays(1));
        assertThat(response.cancelledCount()).isEqualTo(6);
        assertThat(response.blockedCount()).isEqualTo(2);
        assertThat(seatSlotCacheService.evictedAreaId).isEqualTo(1L);
        assertThat(seatSlotCacheService.evictedDate).isEqualTo(TODAY.plusDays(1));
    }

    @Test
    void cancelSeatSlotsBatchShouldCancelSelectedDatesAndBlockAutoPublishWhenRequested() {
        areaMapper.area = activeArea(1L);
        seatSlotMapper.nonCancelableCount = 1;
        seatSlotMapper.deletedAvailableCount = 3;

        CancelSeatSlotsBatchResponse response = seatSlotService.cancelSeatSlotsBatch(new CancelSeatSlotsBatchRequest(
                1L,
                List.of(TODAY.plusDays(3), TODAY.plusDays(1), TODAY.plusDays(3)),
                null,
                null,
                true,
                "临时闭馆"
        ));

        assertThat(response.areaId()).isEqualTo(1L);
        assertThat(response.dateCount()).isEqualTo(2);
        assertThat(response.cancelledCount()).isEqualTo(6);
        assertThat(response.blockedCount()).isEqualTo(2);
        assertThat(response.blockedAutoPublishDateCount()).isEqualTo(2);
        assertThat(seatSlotPublishPlanMapper.exceptionDates).containsExactly(TODAY.plusDays(1), TODAY.plusDays(3));
        assertThat(seatSlotCacheService.evictedDates).containsExactly(TODAY.plusDays(1), TODAY.plusDays(3));
    }

    @Test
    void listPublishPlansShouldReturnPlanDetails() {
        areaMapper.area = activeArea(1L);
        SeatSlotPublishPlan plan = new SeatSlotPublishPlan();
        plan.setId(99L);
        plan.setAreaId(1L);
        plan.setStartDate(TODAY.plusDays(1));
        plan.setEndDate(null);
        plan.setStatus(SeatSlotPublishPlanStatus.ACTIVE);
        seatSlotPublishPlanMapper.plans = List.of(plan);
        seatSlotPublishPlanMapper.periods = List.of(
                new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(12, 0)),
                new PublishSeatSlotPeriod(LocalTime.of(14, 0), LocalTime.of(18, 0))
        );
        seatSlotPublishPlanMapper.seatIds = List.of(10L, 11L);

        List<SeatSlotPublishPlanResponse> response = seatSlotService.listPublishPlans(1L);

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().id()).isEqualTo(99L);
        assertThat(response.getFirst().periods()).containsExactlyElementsOf(seatSlotPublishPlanMapper.periods);
        assertThat(response.getFirst().seatIds()).containsExactly(10L, 11L);
    }

    @Test
    void stopPublishPlanShouldCancelGeneratedAvailableSlotsWithinScope() {
        SeatSlotPublishPlan plan = new SeatSlotPublishPlan();
        plan.setId(99L);
        plan.setAreaId(1L);
        plan.setStartDate(TODAY.plusDays(1));
        plan.setEndDate(TODAY.plusDays(5));
        plan.setStatus(SeatSlotPublishPlanStatus.ACTIVE);
        seatSlotPublishPlanMapper.selectedPlan = plan;
        seatSlotPublishPlanMapper.periods = List.of(new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(12, 0)));
        seatSlotPublishPlanMapper.seatIds = List.of(10L, 11L);
        seatSlotMapper.nonCancelableCount = 2;
        seatSlotMapper.deletedAvailableCount = 6;

        StopSeatSlotPublishPlanResponse response = seatSlotService.stopPublishPlan(
                99L,
                new StopSeatSlotPublishPlanRequest(TODAY.plusDays(3), true)
        );

        assertThat(response.planId()).isEqualTo(99L);
        assertThat(response.cancelledCount()).isEqualTo(6);
        assertThat(response.blockedCount()).isEqualTo(2);
        assertThat(seatSlotPublishPlanMapper.stoppedPlanId).isEqualTo(99L);
        assertThat(seatSlotPublishPlanMapper.stoppedEndDate).isEqualTo(TODAY.plusDays(2));
        assertThat(seatSlotMapper.cancelScopeSeatIds).containsExactly(10L, 11L);
        assertThat(seatSlotMapper.cancelScopePeriods).containsExactlyElementsOf(seatSlotPublishPlanMapper.periods);
        assertThat(seatSlotCacheService.evictedDates)
                .containsExactly(TODAY.plusDays(3), TODAY.plusDays(4), TODAY.plusDays(5));
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
        private int nonCancelableCount;
        private int deletedAvailableCount;
        private List<Long> cancelScopeSeatIds = List.of();
        private List<PublishSeatSlotPeriod> cancelScopePeriods = List.of();

        SeatSlotMapper proxy() {
            return SeatSlotServiceTest.proxy(SeatSlotMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "countBySeatAndPeriod" -> 0;
                case "countNonCancelableSlotsByAreaAndDate" -> nonCancelableCount;
                case "deleteAvailableSlotsByAreaAndDate" -> deletedAvailableCount;
                case "countNonCancelableSlotsByScope" -> {
                    cancelScopeSeatIds = (List<Long>) args[3];
                    cancelScopePeriods = (List<PublishSeatSlotPeriod>) args[4];
                    yield nonCancelableCount;
                }
                case "deleteAvailableSlotsByScope" -> {
                    cancelScopeSeatIds = (List<Long>) args[3];
                    cancelScopePeriods = (List<PublishSeatSlotPeriod>) args[4];
                    yield deletedAvailableCount;
                }
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

    private static final class SeatSlotPublishPlanMapperFake {
        private final List<LocalDate> exceptionDates = new ArrayList<>();
        private List<SeatSlotPublishPlan> plans = List.of();
        private List<PublishSeatSlotPeriod> periods = List.of();
        private List<Long> seatIds = List.of();
        private SeatSlotPublishPlan selectedPlan;
        private Long stoppedPlanId;
        private LocalDate stoppedEndDate;

        SeatSlotPublishPlanMapper proxy() {
            return SeatSlotServiceTest.proxy(SeatSlotPublishPlanMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "deleteException" -> 1;
                case "upsertException" -> {
                    exceptionDates.add((LocalDate) args[1]);
                    yield 1;
                }
                case "findByAreaId" -> plans;
                case "findPeriodsByPlanId" -> periods;
                case "findSeatIdsByPlanId" -> seatIds;
                case "selectById" -> selectedPlan;
                case "stopPlanFrom" -> {
                    stoppedPlanId = (Long) args[0];
                    stoppedEndDate = (LocalDate) args[1];
                    yield 1;
                }
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatSlotCacheServiceFake extends SeatSlotCacheService {
        private Long evictedAreaId;
        private LocalDate evictedDate;
        private final List<LocalDate> evictedDates = new ArrayList<>();

        SeatSlotCacheServiceFake() {
            super(null, new ObjectMapper());
        }

        @Override
        public void evict(Long areaId, LocalDate date) {
            evictedAreaId = areaId;
            evictedDate = date;
            evictedDates.add(date);
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
