# API 手测示例

本文档记录当前后端骨架可用的核心接口。默认后端地址为：

```text
http://localhost:8080
```

## 1. 健康检查

```bash
curl http://localhost:8080/api/health
```

## 2. 查询座位时段

查询区域 `1` 今天的座位时段：

```bash
curl "http://localhost:8080/api/seat-slots?areaId=1&date=2026-05-13"
```

返回中的 `id` 是后续预约使用的 `seatSlotId`。

## 3. 查询区域和座位资源

查询所有区域：

```bash
curl http://localhost:8080/api/areas
```

查询区域 `1` 下的座位资源：

```bash
curl "http://localhost:8080/api/seats?areaId=1"
```

这些接口用于管理员座位资源页和学生端区域选择。后续新增区域/座位维护能力时，应继续放在对应资源模块下。

## 4. 创建预约

```bash
curl -X POST http://localhost:8080/api/reservations \
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
curl -X POST http://localhost:8080/api/reservations/1/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "checkinCode": "替换为预约返回的签到码"
  }'
```

成功后预约状态变为 `CHECKED_IN`，座位时段状态变为 `USING`。

## 6. 签退

```bash
curl -X POST http://localhost:8080/api/reservations/1/check-out \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。

## 7. 取消预约

```bash
curl -X POST http://localhost:8080/api/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CANCELLED`，座位时段重新变为 `AVAILABLE`。

## 8. 释放超时未签到预约

当前既保留手动触发接口，也已经提供定时任务入口。默认每 60 秒扫描一次超时未签到预约。

```bash
curl -X POST "http://localhost:8080/api/reservations/expire-overdue?limit=100"
```

返回值是本次释放的预约数量。释放成功后预约状态变为 `EXPIRED`，座位时段重新变为 `AVAILABLE`。

## 9. 查询管理员看板

查询今天的座位使用汇总：

```bash
curl http://localhost:8080/api/admin/dashboard
```

查询指定日期：

```bash
curl "http://localhost:8080/api/admin/dashboard?date=2026-05-14"
```

返回内容包含总时段、空闲、已预约、使用中、异常占用、活跃预约数，以及各区域利用率。

## 10. 前端联调说明

当前前端学生选座页已经接入：

- 查询座位时段。
- 创建预约。
- 显示预约返回的签到码。
- 使用签到码签到。
- 签退释放座位。
- 取消预约释放座位。

当前前端管理页骨架已经接入：

- 座位管理页查询区域座位。
- 占用看板页查询区域利用率和统计卡片。

本地启动前端后访问：

```text
http://localhost:5173
```

前端默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:8080`。
