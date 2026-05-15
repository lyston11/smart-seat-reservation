package com.lyston.smartseat.audit;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface AuditLogMapper extends BaseMapper<AuditLog> {

    @Select("""
            <script>
            SELECT id, actor_user_id, action, target_type, target_id, reason, created_at
            FROM audit_logs
            WHERE 1 = 1
            <if test="actions != null and actions.size() &gt; 0">
              AND action IN
              <foreach collection="actions" item="action" open="(" separator="," close=")">
                #{action}
              </foreach>
            </if>
            <if test="actorUserId != null">
              AND actor_user_id = #{actorUserId}
            </if>
            <if test="targetType != null and targetType != ''">
              AND target_type = #{targetType}
            </if>
            <if test="startAt != null">
              AND created_at &gt;= #{startAt}
            </if>
            <if test="endAt != null">
              AND created_at &lt;= #{endAt}
            </if>
            ORDER BY created_at DESC, id DESC
            LIMIT #{limit}
            </script>
            """)
    List<AuditLog> findByFilters(
            @Param("actions") List<String> actions,
            @Param("actorUserId") Long actorUserId,
            @Param("targetType") String targetType,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("limit") int limit
    );
}
