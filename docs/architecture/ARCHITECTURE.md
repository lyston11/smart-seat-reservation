# 系统架构说明

## 1. 总体架构

```text
浏览器
  |
  | HTTP / JSON
  v
React 前端
  |
  | REST API
  v
Spring Boot 后端
  |
  +-- MySQL：最终业务数据、预约状态、审计记录
  |
  +-- Redis：座位图缓存、限流、短期签到凭证
```

当前阶段采用单体后端，不拆微服务。这样更适合三人协作和课程项目交付，也方便把事务边界控制在一个应用内。

## 2. 后端分层

```text
controller  接收请求、参数校验、返回响应
service     业务规则、事务、状态流转
mapper      数据库读写
model       数据库实体
dto         请求和响应结构
common      统一响应、异常、通用工具
config      配置类
```

关键业务逻辑必须放在 service 层，controller 不写复杂业务判断。

## 3. 预约状态流转

```text
AVAILABLE -> RESERVED -> USING -> RELEASED
AVAILABLE -> RESERVED -> CANCELLED
AVAILABLE -> RESERVED -> EXPIRED
USING     -> ABNORMAL
ABNORMAL  -> RELEASED
```

说明：

- AVAILABLE：可预约。
- RESERVED：已预约，等待签到。
- USING：已签到，正在使用。
- RELEASED：正常释放。
- CANCELLED：学生取消。
- EXPIRED：超时未签到自动释放。
- ABNORMAL：管理员标记异常占用。

## 4. 防超卖策略

预约接口必须使用数据库条件更新：

```sql
UPDATE seat_slots
SET status = 'RESERVED', reserved_by = ?
WHERE id = ? AND status = 'AVAILABLE';
```

应用层只根据影响行数判断成功或失败。禁止使用“先查询是否空闲，再更新状态”的方式处理高峰抢座。

## 5. Redis 使用边界

Redis 可以用于：

- 缓存某区域某天的座位状态图。
- 限制同一用户短时间内重复请求预约接口。
- 存储短期签到凭证。
- 缓存管理员看板的聚合数据。

Redis 不能作为座位最终状态来源。数据库事务提交后，再更新或失效缓存。
