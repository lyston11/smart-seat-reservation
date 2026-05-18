package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface SeatMapper extends BaseMapper<Seat> {

    @Select("""
            SELECT s.id, s.area_id, s.table_id, t.table_no, s.seat_no, s.seat_label, s.seat_side, s.seat_order,
                   s.row_no, s.column_no, s.display_order, s.status, s.created_at, s.updated_at
            FROM seats s
            LEFT JOIN tables t
              ON t.id = s.table_id
            WHERE s.area_id = #{areaId}
            ORDER BY COALESCE(t.row_no, 9999), COALESCE(t.column_no, 9999), COALESCE(t.display_order, 9999),
                     t.table_no, COALESCE(s.seat_order, 9999), s.seat_side,
                     COALESCE(s.row_no, 9999), COALESCE(s.column_no, 9999),
                     COALESCE(s.display_order, 9999), s.seat_no
            """)
    List<Seat> findByAreaId(@Param("areaId") Long areaId);

    @Select("""
            SELECT COUNT(*)
            FROM seats
            WHERE area_id = #{areaId}
              AND seat_no = #{seatNo}
              AND (#{excludedSeatId} IS NULL OR id <> #{excludedSeatId})
            """)
    int countDuplicateSeatNo(
            @Param("areaId") Long areaId,
            @Param("seatNo") String seatNo,
            @Param("excludedSeatId") Long excludedSeatId
    );

    @Select("""
            SELECT COUNT(*)
            FROM seats
            WHERE area_id = #{areaId}
            """)
    int countByAreaId(@Param("areaId") Long areaId);
}
