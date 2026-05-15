package com.lyston.smartseat.user;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface UserMapper extends BaseMapper<User> {

    @Select("""
            SELECT id, name, student_no, password_hash, role, created_at, updated_at
            FROM users
            WHERE student_no = #{studentNo}
            """)
    User findByStudentNo(@Param("studentNo") String studentNo);
}
