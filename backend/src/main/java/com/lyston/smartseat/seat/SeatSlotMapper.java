package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface SeatSlotMapper extends BaseMapper<SeatSlot> {

    @Select("""
            SELECT ss.id, ss.seat_id, s.seat_no,
                   t.id AS table_id, t.table_no, t.row_no AS table_row_no,
                   t.column_no AS table_column_no, t.display_order AS table_display_order,
                   t.position_x AS table_position_x, t.position_y AS table_position_y,
                   t.width_px AS table_width_px, t.height_px AS table_height_px,
                   t.rotation_deg AS table_rotation_deg,
                   s.seat_label, s.seat_side, s.seat_order,
                   s.row_no, s.column_no, s.display_order,
                   ss.area_id, ss.slot_date, ss.start_time, ss.end_time, ss.status,
                   ss.reserved_by, ss.reservation_id, ss.version, ss.created_at, ss.updated_at
            FROM seat_slots ss
            JOIN seats s
              ON s.id = ss.seat_id
             AND s.status = 'ACTIVE'
            JOIN tables t
              ON t.id = s.table_id
             AND t.status = 'ACTIVE'
            JOIN areas a
              ON a.id = ss.area_id
             AND a.status = 'ACTIVE'
            WHERE ss.area_id = #{areaId}
              AND ss.slot_date = #{slotDate}
            ORDER BY ss.start_time,
                     COALESCE(t.position_y, 999999), COALESCE(t.position_x, 999999),
                     COALESCE(t.row_no, 9999), COALESCE(t.column_no, 9999),
                     COALESCE(t.display_order, 9999), t.table_no,
                     s.seat_side, COALESCE(s.seat_order, 9999),
                     COALESCE(s.display_order, 9999), s.seat_no
            """)
    List<SeatSlot> findByAreaAndDate(@Param("areaId") Long areaId, @Param("slotDate") LocalDate slotDate);

    @Select("""
            SELECT COUNT(*)
            FROM seat_slots
            WHERE seat_id = #{seatId}
              AND status IN ('RESERVED', 'USING')
            """)
    int countBusySlotsBySeatId(@Param("seatId") Long seatId);

    @Select("""
            SELECT COUNT(*)
            FROM seat_slots
            WHERE area_id = #{areaId}
              AND status IN ('RESERVED', 'USING', 'ABNORMAL')
            """)
    int countBusySlotsByAreaId(@Param("areaId") Long areaId);

    @Select("""
            SELECT COUNT(*)
            FROM seat_slots
            WHERE seat_id = #{seatId}
              AND slot_date = #{slotDate}
              AND start_time = #{startTime}
              AND end_time = #{endTime}
            """)
    int countBySeatAndPeriod(
            @Param("seatId") Long seatId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Select("""
            SELECT ss.id, ss.seat_id, s.seat_no,
                   t.id AS table_id, t.table_no, t.row_no AS table_row_no,
                   t.column_no AS table_column_no, t.display_order AS table_display_order,
                   t.position_x AS table_position_x, t.position_y AS table_position_y,
                   t.width_px AS table_width_px, t.height_px AS table_height_px,
                   t.rotation_deg AS table_rotation_deg,
                   s.seat_label, s.seat_side, s.seat_order,
                   s.row_no, s.column_no, s.display_order,
                   ss.area_id, ss.slot_date, ss.start_time, ss.end_time, ss.status,
                   ss.reserved_by, ss.reservation_id, ss.version, ss.created_at, ss.updated_at,
                   a.open_time, a.close_time
            FROM seat_slots ss
            JOIN seats s
              ON s.id = ss.seat_id
             AND s.status = 'ACTIVE'
            JOIN tables t
              ON t.id = s.table_id
             AND t.status = 'ACTIVE'
            JOIN areas a
              ON a.id = ss.area_id
             AND a.status = 'ACTIVE'
            WHERE ss.seat_id = #{seatId}
              AND ss.slot_date = #{slotDate}
              AND ss.status = 'AVAILABLE'
              AND ss.reserved_by IS NULL
              AND ss.reservation_id IS NULL
              AND ss.start_time <= #{startTime}
              AND ss.end_time >= #{endTime}
              AND a.open_time <= #{startTime}
              AND a.close_time >= #{endTime}
            ORDER BY ss.start_time, ss.end_time
            LIMIT 1
            FOR UPDATE
            """)
    SeatSlot findAvailableWindowForSeat(
            @Param("seatId") Long seatId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Select("""
            SELECT COUNT(*)
            FROM seat_slots
            WHERE seat_id = #{seatId}
              AND slot_date = #{slotDate}
              AND status IN ('RESERVED', 'USING', 'ABNORMAL')
              AND start_time < #{endTime}
              AND end_time > #{startTime}
            """)
    int countActiveOverlappingSlotsBySeat(
            @Param("seatId") Long seatId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Update("""
            DELETE FROM seat_slots
            WHERE id = #{seatSlotId}
              AND status = 'AVAILABLE'
              AND reserved_by IS NULL
              AND reservation_id IS NULL
            """)
    int deleteAvailableSlot(@Param("seatSlotId") Long seatSlotId);

    @Update("""
            UPDATE seat_slots
            SET status = 'AVAILABLE',
                reserved_by = NULL,
                reservation_id = NULL,
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND status IN ('RESERVED', 'USING', 'ABNORMAL')
              AND reservation_id = #{reservationId}
            """)
    int adminReleaseOccupiedSlot(
            @Param("seatSlotId") Long seatSlotId,
            @Param("reservationId") Long reservationId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE seat_slots
            SET status = 'ABNORMAL',
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND status = 'AVAILABLE'
              AND reserved_by IS NULL
              AND reservation_id IS NULL
            """)
    int markAvailableSlotAbnormal(@Param("seatSlotId") Long seatSlotId, @Param("now") LocalDateTime now);

    @Update("""
            UPDATE seat_slots
            SET status = 'AVAILABLE',
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND status = 'ABNORMAL'
              AND reserved_by IS NULL
              AND reservation_id IS NULL
            """)
    int restoreAbnormalSlot(@Param("seatSlotId") Long seatSlotId, @Param("now") LocalDateTime now);

    @Update("""
            UPDATE seat_slots
            SET status = 'RESERVED',
                reserved_by = #{userId},
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND status = 'AVAILABLE'
            """)
    int reserveAvailableSlot(
            @Param("seatSlotId") Long seatSlotId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE seat_slots
            SET reservation_id = #{reservationId},
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND status = 'RESERVED'
              AND reserved_by = #{userId}
            """)
    int attachReservation(
            @Param("seatSlotId") Long seatSlotId,
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE seat_slots
            SET status = 'USING',
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND reservation_id = #{reservationId}
              AND reserved_by = #{userId}
              AND status = 'RESERVED'
            """)
    int markUsing(
            @Param("seatSlotId") Long seatSlotId,
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE seat_slots
            SET status = 'AVAILABLE',
                reserved_by = NULL,
                reservation_id = NULL,
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND reservation_id = #{reservationId}
              AND reserved_by = #{userId}
              AND status = 'USING'
            """)
    int releaseUsingSlot(
            @Param("seatSlotId") Long seatSlotId,
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Update("""
            UPDATE seat_slots
            SET status = 'AVAILABLE',
                reserved_by = NULL,
                reservation_id = NULL,
                version = version + 1,
                updated_at = #{now}
            WHERE id = #{seatSlotId}
              AND reservation_id = #{reservationId}
              AND reserved_by = #{userId}
              AND status = 'RESERVED'
            """)
    int releaseReservedSlot(
            @Param("seatSlotId") Long seatSlotId,
            @Param("reservationId") Long reservationId,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );
}
