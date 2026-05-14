package com.lyston.smartseat.reservation;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDateTime;
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
            SELECT id, user_id, seat_id, seat_slot_id, status, checkin_code, reserved_at,
                   checked_in_at, checked_out_at, expires_at, created_at, updated_at
            FROM reservations
            WHERE user_id = #{userId}
            ORDER BY created_at DESC, id DESC
            LIMIT #{limit}
            """)
    List<Reservation> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
