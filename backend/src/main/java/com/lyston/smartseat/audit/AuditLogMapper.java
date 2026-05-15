package com.lyston.smartseat.audit;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface AuditLogMapper extends BaseMapper<AuditLog> {

    @Select("""
            SELECT id, actor_user_id, action, target_type, target_id, reason, created_at
            FROM audit_logs
            ORDER BY created_at DESC, id DESC
            LIMIT #{limit}
            """)
    List<AuditLog> findRecent(@Param("limit") int limit);
}
