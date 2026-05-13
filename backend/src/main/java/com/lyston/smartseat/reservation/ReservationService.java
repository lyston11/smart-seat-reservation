package com.lyston.smartseat.reservation;

import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final int CHECKIN_GRACE_MINUTES = 15;

    private final SeatSlotMapper seatSlotMapper;
    private final ReservationMapper reservationMapper;

    public ReservationService(SeatSlotMapper seatSlotMapper, ReservationMapper reservationMapper) {
        this.seatSlotMapper = seatSlotMapper;
        this.reservationMapper = reservationMapper;
    }

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request) {
        LocalDateTime now = LocalDateTime.now();
        int affectedRows = seatSlotMapper.reserveAvailableSlot(request.seatSlotId(), request.userId(), now);
        if (affectedRows != 1) {
            throw new BusinessException("SEAT_SLOT_NOT_AVAILABLE", "Seat slot is not available");
        }

        SeatSlot slot = seatSlotMapper.selectById(request.seatSlotId());
        if (slot == null) {
            throw new BusinessException("SEAT_SLOT_NOT_FOUND", "Seat slot not found");
        }

        Reservation reservation = new Reservation();
        reservation.setUserId(request.userId());
        reservation.setSeatId(slot.getSeatId());
        reservation.setSeatSlotId(slot.getId());
        reservation.setStatus(ReservationStatus.RESERVED);
        reservation.setCheckinCode(generateCheckinCode());
        reservation.setReservedAt(now);
        reservation.setExpiresAt(now.plusMinutes(CHECKIN_GRACE_MINUTES));
        reservationMapper.insert(reservation);

        int attachedRows = seatSlotMapper.attachReservation(slot.getId(), reservation.getId(), request.userId(), now);
        if (attachedRows != 1) {
            throw new BusinessException("RESERVATION_ATTACH_FAILED", "Failed to bind reservation to seat slot");
        }

        return new ReservationResponse(
                reservation.getId(),
                slot.getId(),
                slot.getSeatId(),
                reservation.getUserId(),
                reservation.getStatus(),
                reservation.getCheckinCode(),
                reservation.getExpiresAt()
        );
    }

    private String generateCheckinCode() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
