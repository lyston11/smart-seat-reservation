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
            SELECT ss.id, ss.seat_id, ss.area_id, ss.slot_date, ss.start_time, ss.end_time, ss.status,
                   ss.reserved_by, ss.reservation_id, ss.version, ss.created_at, ss.updated_at
            FROM seat_slots ss
            JOIN seats s
              ON s.id = ss.seat_id
             AND s.status = 'ACTIVE'
            JOIN areas a
              ON a.id = ss.area_id
             AND a.status = 'ACTIVE'
            WHERE ss.area_id = #{areaId}
              AND ss.slot_date = #{slotDate}
            ORDER BY ss.start_time, s.seat_no
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
