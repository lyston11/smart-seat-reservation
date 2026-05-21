package com.lyston.smartseat.seat;

import static org.assertj.core.api.Assertions.assertThat;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
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

class AutoSeatSlotPublishServiceTest {

    private static final ZoneId BEIJING_ZONE = ZoneId.of("Asia/Shanghai");
    private AreaMapperFake areaMapper;
    private SeatMapperFake seatMapper;
    private SeatSlotServiceFake seatSlotService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        seatMapper = new SeatMapperFake();
        seatSlotService = new SeatSlotServiceFake();
    }

    @Test
    void publishTomorrowSlotsShouldWaitUntilBeijingOpenHour() {
        Clock beforeOpenClock = Clock.fixed(Instant.parse("2026-05-21T09:59:00Z"), BEIJING_ZONE);
        AutoSeatSlotPublishService service = new AutoSeatSlotPublishService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                seatSlotService,
                beforeOpenClock,
                new AutoSeatSlotPublishProperties()
        );

        areaMapper.areas = List.of(activeArea(1L, LocalTime.of(8, 0), LocalTime.of(22, 0)));
        seatMapper.seats = List.of(activeSeat(10L));

        AutoSeatSlotPublishResult result = service.publishTomorrowSlots();

        assertThat(result.createdCount()).isZero();
        assertThat(result.skippedCount()).isZero();
        assertThat(result.areaCount()).isZero();
        assertThat(seatSlotService.requests).isEmpty();
    }

    @Test
    void publishTomorrowSlotsShouldUseActiveAreaOpeningWindowAndActiveSeats() {
        Clock openClock = Clock.fixed(Instant.parse("2026-05-21T10:00:00Z"), BEIJING_ZONE);
        AutoSeatSlotPublishService service = new AutoSeatSlotPublishService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                seatSlotService,
                openClock,
                new AutoSeatSlotPublishProperties()
        );

        areaMapper.areas = List.of(
                activeArea(1L, LocalTime.of(8, 0), LocalTime.of(22, 0)),
                activeArea(2L, LocalTime.of(9, 30), LocalTime.of(21, 30))
        );
        seatMapper.seatsByArea.put(1L, List.of(activeSeat(10L), activeSeat(11L)));
        seatMapper.seatsByArea.put(2L, List.of(activeSeat(20L)));
        seatSlotService.responses = List.of(
                new PublishSeatSlotsResponse(2, 0, List.of()),
                new PublishSeatSlotsResponse(0, 1, List.of())
        );

        AutoSeatSlotPublishResult result = service.publishTomorrowSlots();

        assertThat(result.areaCount()).isEqualTo(2);
        assertThat(result.seatCount()).isEqualTo(3);
        assertThat(result.createdCount()).isEqualTo(2);
        assertThat(result.skippedCount()).isEqualTo(1);
        assertThat(seatSlotService.requests).hasSize(2);
        assertThat(seatSlotService.requests.get(0).areaId()).isEqualTo(1L);
        assertThat(seatSlotService.requests.get(0).slotDate()).isEqualTo(LocalDate.of(2026, 5, 22));
        assertThat(seatSlotService.requests.get(0).periods())
                .containsExactly(new PublishSeatSlotPeriod(LocalTime.of(8, 0), LocalTime.of(22, 0)));
        assertThat(seatSlotService.requests.get(0).seatIds()).containsExactly(10L, 11L);
        assertThat(seatSlotService.requests.get(1).areaId()).isEqualTo(2L);
        assertThat(seatSlotService.requests.get(1).periods())
                .containsExactly(new PublishSeatSlotPeriod(LocalTime.of(9, 30), LocalTime.of(21, 30)));
    }

    @Test
    void publishTomorrowSlotsShouldSkipAreasWithInvalidOpeningGranularity() {
        Clock openClock = Clock.fixed(Instant.parse("2026-05-21T10:00:00Z"), BEIJING_ZONE);
        AutoSeatSlotPublishService service = new AutoSeatSlotPublishService(
                areaMapper.proxy(),
                seatMapper.proxy(),
                seatSlotService,
                openClock,
                new AutoSeatSlotPublishProperties()
        );

        areaMapper.areas = List.of(
                activeArea(1L, LocalTime.of(8, 15), LocalTime.of(22, 0)),
                activeArea(2L, LocalTime.of(9, 30), LocalTime.of(21, 30))
        );
        seatMapper.seatsByArea.put(1L, List.of(activeSeat(10L)));
        seatMapper.seatsByArea.put(2L, List.of(activeSeat(20L)));
        seatSlotService.responses = List.of(new PublishSeatSlotsResponse(1, 0, List.of()));

        AutoSeatSlotPublishResult result = service.publishTomorrowSlots();

        assertThat(result.areaCount()).isEqualTo(1);
        assertThat(result.seatCount()).isEqualTo(1);
        assertThat(result.createdCount()).isEqualTo(1);
        assertThat(seatSlotService.requests).hasSize(1);
        assertThat(seatSlotService.requests.getFirst().areaId()).isEqualTo(2L);
    }

    private Area activeArea(Long areaId, LocalTime openTime, LocalTime closeTime) {
        Area area = new Area();
        area.setId(areaId);
        area.setStatus(SeatStatus.ACTIVE);
        area.setOpenTime(openTime);
        area.setCloseTime(closeTime);
        return area;
    }

    private Seat activeSeat(Long seatId) {
        Seat seat = new Seat();
        seat.setId(seatId);
        seat.setStatus(SeatStatus.ACTIVE);
        return seat;
    }

    private static final class AreaMapperFake {
        private List<Area> areas = List.of();

        AreaMapper proxy() {
            return AutoSeatSlotPublishServiceTest.proxy(AreaMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "findActiveAreasForAutoPublish" -> areas;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatMapperFake {
        private List<Seat> seats = List.of();
        private final java.util.Map<Long, List<Seat>> seatsByArea = new java.util.HashMap<>();

        SeatMapper proxy() {
            return AutoSeatSlotPublishServiceTest.proxy(SeatMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "findActiveByAreaId" -> seatsByArea.getOrDefault((Long) args[0], seats);
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class SeatSlotServiceFake extends SeatSlotService {
        private final List<PublishSeatSlotsRequest> requests = new ArrayList<>();
        private List<PublishSeatSlotsResponse> responses = List.of();

        SeatSlotServiceFake() {
            super(null, null, null, null, null, Clock.systemUTC());
        }

        @Override
        public PublishSeatSlotsResponse publishSeatSlots(PublishSeatSlotsRequest request) {
            requests.add(request);
            if (requests.size() <= responses.size()) {
                return responses.get(requests.size() - 1);
            }
            return new PublishSeatSlotsResponse(0, request.seatIds().size(), List.of());
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
