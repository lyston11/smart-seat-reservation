package com.lyston.smartseat.area;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface AreaMapper extends BaseMapper<Area> {

    @Select("""
            SELECT id, name, floor, building_code, floor_code, area_type, map_x, map_y,
                   description, status, open_time, close_time, checkin_ip_cidrs, created_at, updated_at
            FROM areas
            ORDER BY id
            """)
    List<Area> findAllOrderById();

    @Select("""
            SELECT id, name, floor, building_code, floor_code, area_type, map_x, map_y,
                   description, status, open_time, close_time, checkin_ip_cidrs, created_at, updated_at
            FROM areas
            WHERE status = 'ACTIVE'
            ORDER BY id
            """)
    List<Area> findActiveAreasForAutoPublish();

    @Select("""
            SELECT COUNT(*)
            FROM areas
            WHERE name = #{name}
              AND (#{excludedAreaId} IS NULL OR id <> #{excludedAreaId})
            """)
    int countDuplicateName(@Param("name") String name, @Param("excludedAreaId") Long excludedAreaId);
}
