package com.lyston.smartseat.seat;

import static org.assertj.core.api.Assertions.assertThat;

import com.lyston.smartseat.reservation.ReservationStatus;
import org.junit.jupiter.api.Test;

class SeatSlotResponseTest {

    @Test
    void fromShouldExposeLockedStatusWhenLinkedReservationIsLocked() {
        SeatSlot slot = new SeatSlot();
        slot.setId(1L);
        slot.setSeatId(10L);
        slot.setAreaId(1L);
        slot.setStatus(SeatSlotStatus.USING);
        slot.setReservationId(100L);
        slot.setReservationStatus(ReservationStatus.LOCKED);

        SeatSlotResponse response = SeatSlotResponse.from(slot);

        assertThat(response.status()).isEqualTo(ReservationStatus.LOCKED);
    }
}
