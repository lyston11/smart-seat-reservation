package com.lyston.smartseat.seat;

import com.lyston.smartseat.area.Area;
import com.lyston.smartseat.area.AreaMapper;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AutoSeatSlotPublishService {

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final SeatSlotService seatSlotService;
    private final Clock clock;
    private final AutoSeatSlotPublishProperties properties;

    public AutoSeatSlotPublishService(
            AreaMapper areaMapper,
            SeatMapper seatMapper,
            SeatSlotService seatSlotService,
            Clock clock,
            AutoSeatSlotPublishProperties properties
    ) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.seatSlotService = seatSlotService;
        this.clock = clock;
        this.properties = properties;
    }

    public AutoSeatSlotPublishResult publishTomorrowSlots() {
        if (!properties.isEnabled()) {
            return new AutoSeatSlotPublishResult(0, 0, 0, 0);
        }

        ZoneId zoneId = ZoneId.of(properties.getZoneId());
        LocalDateTime now = LocalDateTime.now(clock.withZone(zoneId));
        if (now.getHour() < properties.getReservationOpenHour()) {
            return new AutoSeatSlotPublishResult(0, 0, 0, 0);
        }

        LocalDate slotDate = now.toLocalDate().plusDays(1);
        int areaCount = 0;
        int seatCount = 0;
        int createdCount = 0;
        int skippedCount = 0;
        AutoSeatSlotPublishResult plannedResult = seatSlotService.publishPlannedSlots(slotDate);
        areaCount += plannedResult.areaCount();
        seatCount += plannedResult.seatCount();
        createdCount += plannedResult.createdCount();
        skippedCount += plannedResult.skippedCount();

        for (Area area : areaMapper.findActiveAreasForAutoPublish()) {
            if (seatSlotService.hasPublishException(area.getId(), slotDate)) {
                continue;
            }
            if (!canAutoPublish(area)) {
                continue;
            }
            List<Long> seatIds = seatMapper.findActiveByAreaId(area.getId()).stream()
                    .map(Seat::getId)
                    .toList();
            if (seatIds.isEmpty()) {
                continue;
            }

            PublishSeatSlotsResponse response = seatSlotService.publishSeatSlots(new PublishSeatSlotsRequest(
                    area.getId(),
                    slotDate,
                    null,
                    null,
                    List.of(new PublishSeatSlotPeriod(normalizeTime(area.getOpenTime()), normalizeTime(area.getCloseTime()))),
                    seatIds
            ));
            areaCount += 1;
            seatCount += seatIds.size();
            createdCount += response.createdCount();
            skippedCount += response.skippedCount();
        }

        return new AutoSeatSlotPublishResult(areaCount, seatCount, createdCount, skippedCount);
    }

    private boolean canAutoPublish(Area area) {
        return area.getOpenTime() != null
                && area.getCloseTime() != null
                && area.getOpenTime().isBefore(area.getCloseTime())
                && isHalfHourBoundary(area.getOpenTime())
                && isHalfHourBoundary(area.getCloseTime());
    }

    private boolean isHalfHourBoundary(LocalTime time) {
        return time.getSecond() == 0
                && time.getNano() == 0
                && (time.getMinute() == 0 || time.getMinute() == 30);
    }

    private LocalTime normalizeTime(LocalTime time) {
        return time.withSecond(0).withNano(0);
    }
}
