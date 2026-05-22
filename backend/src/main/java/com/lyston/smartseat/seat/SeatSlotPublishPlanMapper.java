package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface SeatSlotPublishPlanMapper extends BaseMapper<SeatSlotPublishPlan> {

    @Select("""
            SELECT id, area_id, start_date, end_date, status, created_at, updated_at
            FROM seat_slot_publish_plans
            WHERE area_id = #{areaId}
            ORDER BY status, start_date, id
            """)
    List<SeatSlotPublishPlan> findByAreaId(@Param("areaId") Long areaId);

    @Select("""
            SELECT id, area_id, start_date, end_date, status, created_at, updated_at
            FROM seat_slot_publish_plans
            WHERE status = 'ACTIVE'
              AND start_date <= #{slotDate}
              AND (end_date IS NULL OR end_date >= #{slotDate})
            ORDER BY area_id, id
            """)
    List<SeatSlotPublishPlan> findActivePlansForDate(@Param("slotDate") LocalDate slotDate);

    @Select("""
            SELECT start_time, end_time
            FROM seat_slot_publish_plan_periods
            WHERE plan_id = #{planId}
            ORDER BY start_time, end_time
            """)
    List<PublishSeatSlotPeriod> findPeriodsByPlanId(@Param("planId") Long planId);

    @Select("""
            SELECT seat_id
            FROM seat_slot_publish_plan_seats
            WHERE plan_id = #{planId}
            ORDER BY seat_id
            """)
    List<Long> findSeatIdsByPlanId(@Param("planId") Long planId);

    @Insert("""
            INSERT INTO seat_slot_publish_plan_periods (plan_id, start_time, end_time, created_at)
            VALUES (#{planId}, #{period.startTime}, #{period.endTime}, #{now})
            """)
    int insertPeriod(
            @Param("planId") Long planId,
            @Param("period") PublishSeatSlotPeriod period,
            @Param("now") LocalDateTime now
    );

    @Insert("""
            INSERT INTO seat_slot_publish_plan_seats (plan_id, seat_id, created_at)
            VALUES (#{planId}, #{seatId}, #{now})
            """)
    int insertSeat(
            @Param("planId") Long planId,
            @Param("seatId") Long seatId,
            @Param("now") LocalDateTime now
    );

    @Delete("""
            DELETE FROM seat_slot_publish_exceptions
            WHERE area_id = #{areaId}
              AND slot_date = #{slotDate}
            """)
    int deleteException(@Param("areaId") Long areaId, @Param("slotDate") LocalDate slotDate);

    @Insert("""
            INSERT INTO seat_slot_publish_exceptions (area_id, slot_date, reason, created_at)
            VALUES (#{areaId}, #{slotDate}, #{reason}, #{now})
            ON DUPLICATE KEY UPDATE reason = VALUES(reason)
            """)
    int upsertException(
            @Param("areaId") Long areaId,
            @Param("slotDate") LocalDate slotDate,
            @Param("reason") String reason,
            @Param("now") LocalDateTime now
    );

    @Select("""
            SELECT COUNT(*)
            FROM seat_slot_publish_exceptions
            WHERE area_id = #{areaId}
              AND slot_date = #{slotDate}
            """)
    int countException(@Param("areaId") Long areaId, @Param("slotDate") LocalDate slotDate);

    @Update("""
            UPDATE seat_slot_publish_plans
            SET end_date = #{endDate},
                status = CASE WHEN #{endDate} < start_date THEN 'PAUSED' ELSE status END,
                updated_at = #{now}
            WHERE id = #{planId}
              AND status = 'ACTIVE'
            """)
    int stopPlanFrom(
            @Param("planId") Long planId,
            @Param("endDate") LocalDate endDate,
            @Param("now") LocalDateTime now
    );
}
