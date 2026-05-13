package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface SeatSlotMapper extends BaseMapper<SeatSlot> {

    @Select("""
            SELECT id, seat_id, area_id, slot_date, start_time, end_time, status,
                   reserved_by, reservation_id, version, created_at, updated_at
            FROM seat_slots
            WHERE area_id = #{areaId}
              AND slot_date = #{slotDate}
            ORDER BY start_time, seat_id
            """)
    List<SeatSlot> findByAreaAndDate(@Param("areaId") Long areaId, @Param("slotDate") LocalDate slotDate);

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
