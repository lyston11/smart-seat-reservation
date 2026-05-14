package com.lyston.smartseat.area;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Select;

public interface AreaMapper extends BaseMapper<Area> {

    @Select("""
            SELECT id, name, floor, description, status, created_at, updated_at
            FROM areas
            ORDER BY id
            """)
    List<Area> findAllOrderById();
}
