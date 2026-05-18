package com.lyston.smartseat.table;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface StudyTableMapper extends BaseMapper<StudyTable> {

    @Select("""
            SELECT id, area_id, table_no, name, status, qr_token, row_no, column_no, display_order,
                   position_x, position_y, width_px, height_px, rotation_deg, created_at, updated_at
            FROM tables
            WHERE area_id = #{areaId}
            ORDER BY COALESCE(position_y, 999999), COALESCE(position_x, 999999),
                     COALESCE(row_no, 9999), COALESCE(column_no, 9999), COALESCE(display_order, 9999), table_no
            """)
    List<StudyTable> findByAreaId(@Param("areaId") Long areaId);

    @Select("""
            SELECT COUNT(*)
            FROM tables
            WHERE area_id = #{areaId}
              AND table_no = #{tableNo}
              AND (#{excludedTableId} IS NULL OR id <> #{excludedTableId})
            """)
    int countDuplicateTableNo(
            @Param("areaId") Long areaId,
            @Param("tableNo") String tableNo,
            @Param("excludedTableId") Long excludedTableId
    );

    @Select("""
            SELECT COUNT(*)
            FROM tables
            WHERE area_id = #{areaId}
            """)
    int countByAreaId(@Param("areaId") Long areaId);

    @Select("""
            SELECT COUNT(*)
            FROM seats
            WHERE table_id = #{tableId}
            """)
    int countSeatsByTableId(@Param("tableId") Long tableId);

    @Select("""
            SELECT COUNT(*)
            FROM seats s
            JOIN seat_slots ss ON ss.seat_id = s.id
            WHERE s.table_id = #{tableId}
              AND ss.status IN ('RESERVED', 'USING', 'ABNORMAL')
            """)
    int countBusySlotsByTableId(@Param("tableId") Long tableId);
}
