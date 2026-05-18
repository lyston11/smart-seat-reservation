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

## 3. 资源模型

```text
areas
  -> tables
      -> seats
          -> seat_slots
              -> reservations
```

说明：

- `areas` 表示学院公共学习区域。
- `tables` 表示区域内真实桌子，保存桌号、布局位置、启停状态和固定二维码 token。
- `seats` 表示一张桌子上的具体座位，保存座位编号、桌上显示标签、桌边方位和同侧顺序。
- `seat_slots` 表示某个具体座位在某个日期和时间段的库存状态。
- `reservations` 始终预约到具体 `seatSlotId`，因此学生选择的是具体桌子的具体座位。

固定桌码贴在桌子旁或桌面上，不贴到单个座位。学生扫码后打开 `/student/table-checkin?token=<tableQrToken>`，再输入预约动态签到码。后端同时校验“当前学生有该桌子下的待签到预约”和“签到码正确且未过期”，从而形成物理桌码和预约凭证的闭环。

## 4. 状态流转

```text
seat_slots:
AVAILABLE -> RESERVED -> USING -> AVAILABLE
AVAILABLE -> RESERVED -> AVAILABLE

reservations:
RESERVED -> CHECKED_IN -> CHECKED_OUT
RESERVED -> CANCELLED
RESERVED -> EXPIRED
```

说明：

- `seat_slots` 表表示某个座位时段的当前库存状态，释放后应回到 `AVAILABLE`。
- `reservations` 表保存预约历史，取消、过期、签退等终态记录在这里。
- `checkin_records` 表保存签到、签退、取消、过期释放等动作审计。

桌码签到复用普通签到的状态流转：

```text
reservations: RESERVED -> CHECKED_IN
seat_slots:   RESERVED -> USING
```

如果二维码 token 无效、桌子停用、当前学生没有该桌子的待签到预约、签到码不匹配、预约已过期，签到都应失败，且不能泄露其他学生的预约信息。

## 5. 防超卖策略

预约接口必须使用数据库条件更新：

```sql
UPDATE seat_slots
SET status = 'RESERVED', reserved_by = ?
WHERE id = ? AND status = 'AVAILABLE';
```

应用层只根据影响行数判断成功或失败。禁止使用“先查询是否空闲，再更新状态”的方式处理高峰抢座。

## 6. Redis 使用边界

Redis 可以用于：

- 缓存某区域某天的座位状态图。
- 限制同一用户短时间内重复请求预约接口。
- 存储短期签到凭证。
- 缓存管理员看板的聚合数据。

Redis 不能作为座位最终状态来源。数据库事务提交后，再更新或失效缓存。
