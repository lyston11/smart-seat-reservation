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

## 3. 创建预约

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

## 4. 签到

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

## 5. 签退

```bash
curl -X POST http://localhost:8080/api/reservations/1/check-out \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。

## 6. 取消预约

```bash
curl -X POST http://localhost:8080/api/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

成功后预约状态变为 `CANCELLED`，座位时段重新变为 `AVAILABLE`。

## 7. 释放超时未签到预约

当前先提供手动触发接口，后续可以改为定时任务。

```bash
curl -X POST "http://localhost:8080/api/reservations/expire-overdue?limit=100"
```

返回值是本次释放的预约数量。释放成功后预约状态变为 `EXPIRED`，座位时段重新变为 `AVAILABLE`。

## 8. 前端联调说明

当前前端学生选座页已经接入：

- 查询座位时段。
- 创建预约。
- 显示预约返回的签到码。
- 使用签到码签到。
- 签退释放座位。
- 取消预约释放座位。

本地启动前端后访问：

```text
http://localhost:5173
```

前端默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:8080`。
