package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface SeatMapper extends BaseMapper<Seat> {

    @Select("""
            SELECT id, area_id, seat_no, status, created_at, updated_at
            FROM seats
            WHERE area_id = #{areaId}
            ORDER BY seat_no
            """)
    List<Seat> findByAreaId(@Param("areaId") Long areaId);
}
