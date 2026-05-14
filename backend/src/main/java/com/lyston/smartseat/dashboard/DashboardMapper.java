package com.lyston.smartseat.dashboard;

import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface DashboardMapper {

    @Select("""
            SELECT
                COUNT(*) AS totalSlots,
                COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) AS availableSlots,
                COALESCE(SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END), 0) AS reservedSlots,
                COALESCE(SUM(CASE WHEN status = 'USING' THEN 1 ELSE 0 END), 0) AS usingSlots,
                COALESCE(SUM(CASE WHEN status = 'ABNORMAL' THEN 1 ELSE 0 END), 0) AS abnormalSlots,
                COALESCE(SUM(CASE WHEN reservation_id IS NOT NULL AND status IN ('RESERVED', 'USING') THEN 1 ELSE 0 END), 0)
                    AS activeReservations,
                COALESCE(SUM(CASE WHEN status = 'USING' THEN 1 ELSE 0 END), 0) AS checkedInReservations
            FROM seat_slots
            WHERE slot_date = #{date}
            """)
    DashboardSummary summarizeByDate(@Param("date") LocalDate date);

    @Select("""
            SELECT
                a.id AS areaId,
                a.name AS areaName,
                COUNT(ss.id) AS totalSlots,
                COALESCE(SUM(CASE WHEN ss.status = 'RESERVED' THEN 1 ELSE 0 END), 0) AS reservedSlots,
                COALESCE(SUM(CASE WHEN ss.status = 'USING' THEN 1 ELSE 0 END), 0) AS usingSlots,
                CASE
                    WHEN COUNT(ss.id) = 0 THEN 0
                    ELSE ROUND(
                        COALESCE(SUM(CASE WHEN ss.status IN ('RESERVED', 'USING') THEN 1 ELSE 0 END), 0)
                            / COUNT(ss.id),
                        4
                    )
                END AS usageRate
            FROM areas a
            LEFT JOIN seat_slots ss
              ON ss.area_id = a.id
             AND ss.slot_date = #{date}
            GROUP BY a.id, a.name
            ORDER BY a.id
            """)
    List<AreaUsageSummary> summarizeAreaUsage(@Param("date") LocalDate date);
}
