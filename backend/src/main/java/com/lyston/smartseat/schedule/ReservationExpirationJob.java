package com.lyston.smartseat.schedule;

import com.lyston.smartseat.reservation.ReservationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpirationJob.class);
    private static final int EXPIRE_BATCH_SIZE = 100;

    private final ReservationService reservationService;

    public ReservationExpirationJob(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @Scheduled(fixedDelayString = "${smart-seat.reservation-expiration.fixed-delay-ms:60000}")
    public void expireOverdueReservations() {
        int expiredCount = reservationService.expireOverdueReservations(EXPIRE_BATCH_SIZE);
        if (expiredCount > 0) {
            log.info("Expired {} overdue reservations", expiredCount);
        }
    }
}
