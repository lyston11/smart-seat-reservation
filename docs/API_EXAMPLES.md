# API 手测示例

本文档记录当前后端骨架可用的核心接口。默认后端地址为：

```text
http://localhost:18080
```

## 1. 健康检查

```bash
curl http://localhost:18080/api/health
```

## 2. 查询座位时段

查询区域 `1` 今天的座位时段：

```bash
curl "http://localhost:18080/api/seat-slots?areaId=1&date=2026-05-13"
```

返回中的 `id` 是后续预约使用的 `seatSlotId`。

管理员批量发布开放时段：

```bash
curl -X POST http://localhost:18080/api/seat-slots/publish \
  -H "Content-Type: application/json" \
  -d '{
    "areaId": 1,
    "slotDate": "2026-05-15",
    "startTime": "14:00:00",
    "endTime": "16:00:00",
    "seatIds": [1, 2]
  }'
```

重复发布相同座位、日期和时间段时不会报错，会返回 `skippedCount` 说明跳过数量。

## 3. 查询区域和座位资源

查询所有区域：

```bash
curl http://localhost:18080/api/areas
```

查询区域 `1` 下的座位资源：

```bash
curl "http://localhost:18080/api/seats?areaId=1"
```

这些接口用于管理员座位资源页和学生端区域选择。

新增座位资源：

```bash
curl -X POST http://localhost:18080/api/seats \
  -H "Content-Type: application/json" \
  -d '{
    "areaId": 1,
    "seatNo": "A-005"
  }'
```

编辑座位资源：

```bash
curl -X PUT http://localhost:18080/api/seats/1 \
  -H "Content-Type: application/json" \
  -d '{
    "areaId": 1,
    "seatNo": "A-001",
    "status": "ACTIVE"
  }'
```

停用或启用座位资源：

```bash
curl -X PATCH http://localhost:18080/api/seats/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE"
  }'
```

座位资源采用逻辑停用，不做物理删除，避免破坏历史预约记录。停用后学生端座位时段查询和管理员看板会过滤该座位。

## 4. 创建预约

```bash
curl -X POST http://localhost:18080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "seatSlotId": 1,
    "userId": 1
  }'
```

预约成功后会返回：

```json
{
  "reservationId": 1,
  "seatSlotId": 1,
  "seatId": 1,
  "userId": 1,
  "status": "RESERVED",
  "checkinCode": "...",
  "expiresAt": "..."
}
```

高并发抢座时，后端通过数据库条件更新保证只有一个请求成功：

```sql
UPDATE seat_slots
SET status = 'RESERVED'
WHERE id = ? AND status = 'AVAILABLE';
```

## 5. 签到

使用预约返回的 `checkinCode`：

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "checkinCode": "替换为预约返回的签到码"
  }'
```

成功后预约状态变为 `CHECKED_IN`，座位时段状态变为 `USING`。

## 6. 查询我的预约

查询用户 `1` 的最近预约：

```bash
curl "http://localhost:18080/api/reservations?userId=1&limit=50"
```

该接口用于学生端“我的预约”页面。当前身份仍通过 `userId` 模拟，后续接入登录鉴权后应改为从当前会话读取用户。

## 7. 签退

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-out \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。

## 8. 取消预约

```bash
curl -X POST http://localhost:18080/api/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CANCELLED`，座位时段重新变为 `AVAILABLE`。

## 9. 释放超时未签到预约

当前既保留手动触发接口，也已经提供定时任务入口。默认每 60 秒扫描一次超时未签到预约。

```bash
curl -X POST "http://localhost:18080/api/reservations/expire-overdue?limit=100"
```

返回值是本次释放的预约数量。释放成功后预约状态变为 `EXPIRED`，座位时段重新变为 `AVAILABLE`。

## 10. 查询管理员看板

查询今天的座位使用汇总：

```bash
curl http://localhost:18080/api/admin/dashboard
```

查询指定日期：

```bash
curl "http://localhost:18080/api/admin/dashboard?date=2026-05-14"
```

返回内容包含总时段、空闲、已预约、使用中、异常占用、活跃预约数，以及各区域利用率。

## 11. 前端联调说明

当前前端学生选座页已经接入：

- 查询座位时段。
- 创建预约。
- 查询我的预约。
- 显示预约返回的签到码。
- 使用签到码签到。
- 签退释放座位。
- 取消预约释放座位。

当前前端管理页骨架已经接入：

- 座位管理页查询区域座位。
- 座位管理页新增、编辑、停用、启用座位资源。
- 开放时段页按区域、座位、日期和时间段批量发布可预约资源。
- 占用看板页查询区域利用率和统计卡片。

本地启动前端后访问：

```text
http://localhost:5173
```

前端默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:18080`。
