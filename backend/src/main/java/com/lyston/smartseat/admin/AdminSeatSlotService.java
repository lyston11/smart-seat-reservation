package com.lyston.smartseat.admin;

import com.lyston.smartseat.checkin.CheckinAction;
import com.lyston.smartseat.checkin.CheckinRecord;
import com.lyston.smartseat.checkin.CheckinRecordMapper;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.reservation.Reservation;
import com.lyston.smartseat.reservation.ReservationMapper;
import com.lyston.smartseat.reservation.ReservationResponse;
import com.lyston.smartseat.seat.SeatSlot;
import com.lyston.smartseat.seat.SeatSlotMapper;
import com.lyston.smartseat.seat.SeatSlotStatus;
import java.time.LocalDateTime;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSeatSlotService {

    private static final Set<String> RELEASABLE_SLOT_STATUSES = Set.of(
            SeatSlotStatus.RESERVED,
            SeatSlotStatus.USING,
            SeatSlotStatus.ABNORMAL
    );

    private final SeatSlotMapper seatSlotMapper;
    private final ReservationMapper reservationMapper;
    private final CheckinRecordMapper checkinRecordMapper;

    public AdminSeatSlotService(
            SeatSlotMapper seatSlotMapper,
            ReservationMapper reservationMapper,
            CheckinRecordMapper checkinRecordMapper
    ) {
        this.seatSlotMapper = seatSlotMapper;
        this.reservationMapper = reservationMapper;
        this.checkinRecordMapper = checkinRecordMapper;
    }

    @Transactional
    public AdminSeatSlotReleaseResponse releaseSeatSlot(
            Long seatSlotId,
            AdminSeatSlotReleaseRequest request
    ) {
        LocalDateTime now = LocalDateTime.now();
        SeatSlot slot = requireSeatSlot(seatSlotId);
        if (!RELEASABLE_SLOT_STATUSES.contains(slot.getStatus())) {
            throw new BusinessException("SEAT_SLOT_NOT_RELEASABLE", "Seat slot cannot be released by admin");
        }
        if (slot.getReservationId() == null) {
            throw new BusinessException("SEAT_SLOT_RESERVATION_MISSING", "Seat slot has no active reservation");
        }

        Reservation reservation = requireReservation(slot.getReservationId());
        int reservationRows = reservationMapper.markAdminReleased(reservation.getId(), now);
        if (reservationRows != 1) {
            throw new BusinessException("RESERVATION_ADMIN_RELEASE_FAILED", "Reservation cannot be released by admin");
        }

        int slotRows = seatSlotMapper.adminReleaseOccupiedSlot(slot.getId(), reservation.getId(), now);
        if (slotRows != 1) {
            throw new BusinessException("SEAT_SLOT_ADMIN_RELEASE_FAILED", "Seat slot cannot be released by admin");
        }

        recordAdminRelease(reservation, request.adminUserId(), now);
        Reservation updatedReservation = requireReservation(reservation.getId());
        return new AdminSeatSlotReleaseResponse(
                slot.getId(),
                reservation.getId(),
                request.adminUserId(),
                SeatSlotStatus.AVAILABLE,
                ReservationResponse.from(updatedReservation)
        );
    }

    private SeatSlot requireSeatSlot(Long seatSlotId) {
        SeatSlot slot = seatSlotMapper.selectById(seatSlotId);
        if (slot == null) {
            throw new BusinessException("SEAT_SLOT_NOT_FOUND", "Seat slot not found");
        }
        return slot;
    }

    private Reservation requireReservation(Long reservationId) {
        Reservation reservation = reservationMapper.selectById(reservationId);
        if (reservation == null) {
            throw new BusinessException("RESERVATION_NOT_FOUND", "Reservation not found");
        }
        return reservation;
    }

    private void recordAdminRelease(Reservation reservation, Long adminUserId, LocalDateTime now) {
        CheckinRecord record = new CheckinRecord();
        record.setReservationId(reservation.getId());
        record.setUserId(adminUserId);
        record.setAction(CheckinAction.ADMIN_RELEASE);
        record.setOccurredAt(now);
        checkinRecordMapper.insert(record);
    }
}
