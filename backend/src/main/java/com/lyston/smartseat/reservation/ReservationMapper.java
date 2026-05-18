package com.lyston.smartseat.reservation;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface ReservationMapper extends BaseMapper<Reservation> {

    @Update("""
            UPDATE reservations
            SET status = 'CHECKED_IN',
                checked_in_at = #{now},
                updated_at = #{now}
            WHERE id = #{reservationId}
              AND user_id = #{userId}
              AND checkin_code = #{checkinCode}
              AND status = 'RESERVED'
              AND expires_at >= #{now}
            """)
    int markCheckedIn(
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("checkinCode") String checkinCode,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE reservations
            SET status = 'CHECKED_OUT',
                checked_out_at = #{now},
                updated_at = #{now}
            WHERE id = #{reservationId}
              AND user_id = #{userId}
              AND status = 'CHECKED_IN'
            """)
    int markCheckedOut(
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE reservations
            SET status = 'CANCELLED',
                updated_at = #{now}
            WHERE id = #{reservationId}
              AND user_id = #{userId}
              AND status = 'RESERVED'
            """)
    int markCancelled(
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE reservations
            SET status = 'EXPIRED',
                updated_at = #{now}
            WHERE id = #{reservationId}
              AND user_id = #{userId}
              AND status = 'RESERVED'
              AND expires_at < #{now}
            """)
    int markExpired(
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Select("""
            SELECT r.*
            FROM reservations r
            JOIN seats s
              ON s.id = r.seat_id
            JOIN tables t
              ON t.id = s.table_id
            WHERE r.user_id = #{userId}
              AND t.qr_token = #{tableQrToken}
              AND t.status = 'ACTIVE'
              AND r.status = 'RESERVED'
              AND r.checkin_code = #{checkinCode}
            ORDER BY r.reserved_at DESC
            LIMIT 1
            """)
    Reservation findReservedForTableCheckin(
            @Param("userId") Long userId,
            @Param("tableQrToken") String tableQrToken,
            @Param("checkinCode") String checkinCode
    );

    @Update("""
            UPDATE reservations
            SET status = 'ADMIN_RELEASED',
                checked_out_at = CASE WHEN status = 'CHECKED_IN' THEN #{now} ELSE checked_out_at END,
                updated_at = #{now}
            WHERE id = #{reservationId}
              AND status IN ('RESERVED', 'CHECKED_IN')
            """)
    int markAdminReleased(
            @Param("reservationId") Long reservationId,
            @Param("now") LocalDateTime now
    );

    @Select("""
            SELECT id, user_id, seat_id, seat_slot_id, status, checkin_code, reserved_at,
                   checked_in_at, checked_out_at, expires_at, created_at, updated_at
            FROM reservations
            WHERE status = 'RESERVED'
              AND expires_at < #{now}
            ORDER BY expires_at
            LIMIT #{limit}
            """)
    List<Reservation> findExpiredReservations(@Param("now") LocalDateTime now, @Param("limit") int limit);

    @Select("""
            SELECT COUNT(*)
            FROM reservations r
            JOIN seat_slots ss
              ON ss.id = r.seat_slot_id
            WHERE r.user_id = #{userId}
              AND r.status IN ('RESERVED', 'CHECKED_IN')
              AND ss.slot_date = #{slotDate}
              AND ss.start_time < #{endTime}
              AND ss.end_time > #{startTime}
            """)
    int countActiveOverlappingReservations(
            @Param("userId") Long userId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Select("""
            SELECT COUNT(*)
            FROM reservations r
            JOIN seat_slots ss
              ON ss.id = r.seat_slot_id
            WHERE r.user_id = #{userId}
              AND r.status IN ('RESERVED', 'CHECKED_IN')
              AND ss.slot_date = #{slotDate}
            """)
    int countDailyActiveReservations(
            @Param("userId") Long userId,
            @Param("slotDate") LocalDate slotDate
    );

    @Select("""
            SELECT id, user_id, seat_id, seat_slot_id, status, checkin_code, reserved_at,
                   checked_in_at, checked_out_at, expires_at, created_at, updated_at
            FROM reservations
            WHERE user_id = #{userId}
            ORDER BY created_at DESC, id DESC
            LIMIT #{limit}
            """)
    List<Reservation> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
