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
            SELECT r.id, r.user_id, r.seat_id, r.seat_slot_id, r.status, r.checkin_code, r.reserved_at,
                   r.checked_in_at, r.checked_out_at, r.expires_at, r.created_at, r.updated_at
            FROM reservations r
            WHERE r.status = 'RESERVED'
              AND r.expires_at < #{now}
            ORDER BY r.expires_at
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
            SELECT r.id, r.user_id, r.seat_id, r.seat_slot_id, r.status, r.checkin_code, r.reserved_at,
                   r.checked_in_at, r.checked_out_at, r.expires_at, r.created_at, r.updated_at,
                   s.seat_no, s.seat_label, t.id AS table_id, t.table_no,
                   a.id AS area_id, a.name AS area_name, a.floor,
                   ss.slot_date, ss.start_time, ss.end_time
            FROM reservations r
            JOIN seat_slots ss
              ON ss.id = r.seat_slot_id
            JOIN seats s
              ON s.id = r.seat_id
            LEFT JOIN tables t
              ON t.id = s.table_id
            JOIN areas a
              ON a.id = ss.area_id
            WHERE r.user_id = #{userId}
            ORDER BY r.created_at DESC, r.id DESC
            LIMIT #{limit}
            """)
    List<Reservation> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
