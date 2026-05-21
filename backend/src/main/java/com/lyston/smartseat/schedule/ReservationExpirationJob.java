package com.lyston.smartseat.schedule;

import com.lyston.smartseat.reservation.ReservationService;
import com.lyston.smartseat.seat.AutoSeatSlotPublishResult;
import com.lyston.smartseat.seat.AutoSeatSlotPublishService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpirationJob.class);
    private static final int EXPIRE_BATCH_SIZE = 100;

    private final ReservationService reservationService;
    private final AutoSeatSlotPublishService autoSeatSlotPublishService;

    public ReservationExpirationJob(
            ReservationService reservationService,
            AutoSeatSlotPublishService autoSeatSlotPublishService
    ) {
        this.reservationService = reservationService;
        this.autoSeatSlotPublishService = autoSeatSlotPublishService;
    }

    @Scheduled(fixedDelayString = "${smart-seat.auto-seat-slots.fixed-delay-ms:300000}")
    public void publishTomorrowSeatSlots() {
        AutoSeatSlotPublishResult result = autoSeatSlotPublishService.publishTomorrowSlots();
        if (result.createdCount() > 0 || result.skippedCount() > 0) {
            log.info(
                    "Auto published tomorrow seat slots for {} areas and {} seats: created {}, skipped {}",
                    result.areaCount(),
                    result.seatCount(),
                    result.createdCount(),
                    result.skippedCount()
            );
        }
    }

    @Scheduled(fixedDelayString = "${smart-seat.reservation-expiration.fixed-delay-ms:60000}")
    public void expireOverdueReservations() {
        int expiredCount = reservationService.expireOverdueReservations(EXPIRE_BATCH_SIZE);
        if (expiredCount > 0) {
            log.info("Expired {} overdue reservations", expiredCount);
        }
    }

    @Scheduled(fixedDelayString = "${smart-seat.wifi-presence.fixed-delay-ms:60000}")
    public void releaseWifiOfflineReservations() {
        int releasedCount = reservationService.releaseWifiOfflineReservations(EXPIRE_BATCH_SIZE);
        if (releasedCount > 0) {
            log.info("Released {} reservations after WiFi presence timeout", releasedCount);
        }
    }

    @Scheduled(fixedDelayString = "${smart-seat.seat-lock.fixed-delay-ms:60000}")
    public void releaseExpiredSeatLocks() {
        int releasedCount = reservationService.releaseExpiredSeatLocks(EXPIRE_BATCH_SIZE);
        if (releasedCount > 0) {
            log.info("Released {} reservations after seat lock timeout", releasedCount);
        }
    }
}
