# API 手测示例

本文档记录当前后端核心接口。默认后端地址为：

```text
http://localhost:18080
```

## 1. 健康检查

```bash
curl http://localhost:18080/api/health
```

## 2. 登录和请求头

演示账号：

- 学生：`20260001`
- 管理员：`admin`

登录：

```bash
curl -X POST http://localhost:18080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentNo": "20260001"
  }'
```

后续受保护接口需要带登录返回的 token：

```text
X-Auth-Token: 替换为登录返回的 token
```

查询当前登录用户：

```bash
curl http://localhost:18080/api/auth/me \
  -H "X-Auth-Token: 替换为登录返回的 token"
```

## 3. 查询和发布座位时段

查询区域 `1` 某天的座位时段：

```bash
curl "http://localhost:18080/api/seat-slots?areaId=1&date=2026-05-14" \
  -H "X-Auth-Token: 替换为学生或管理员 token"
```

返回中的 `id` 是后续预约使用的 `seatSlotId`。

管理员按模板批量发布开放时段：

```bash
curl -X POST http://localhost:18080/api/seat-slots/publish \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "areaId": 1,
    "slotDate": "2026-05-15",
    "periods": [
      { "startTime": "08:00:00", "endTime": "10:00:00" },
      { "startTime": "10:00:00", "endTime": "12:00:00" }
    ],
    "seatIds": [1, 2]
  }'
```

重复发布相同座位、日期和时间段时不会报错，会返回 `skippedCount` 说明跳过数量。

撤销未被预约的开放时段：

```bash
curl -X DELETE http://localhost:18080/api/seat-slots/1 \
  -H "X-Auth-Token: 替换为管理员 token"
```

只有 `AVAILABLE` 且没有绑定预约的时段可以撤销。

管理员标记空闲时段为异常占用：

```bash
curl -X POST http://localhost:18080/api/admin/seat-slots/1/abnormal \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "reason": "设备故障，暂不开放"
  }'
```

只有 `AVAILABLE` 且没有绑定预约的时段可以直接标记异常。

管理员恢复异常时段：

```bash
curl -X POST http://localhost:18080/api/admin/seat-slots/1/restore \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "reason": "维护完成，恢复开放"
  }'
```

只有未绑定预约的 `ABNORMAL` 时段可以直接恢复为空闲。已绑定预约的异常时段应走管理员释放流程。

管理员释放已预约或使用中的座位时段：

```bash
curl -X POST http://localhost:18080/api/admin/seat-slots/1/release \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "reason": "学生离座超时，管理员现场确认空座"
  }'
```

释放、标记异常和恢复操作都会写入 `audit_logs`。

## 4. 区域和座位资源

查询所有区域：

```bash
curl http://localhost:18080/api/areas \
  -H "X-Auth-Token: 替换为学生或管理员 token"
```

新增区域：

```bash
curl -X POST http://localhost:18080/api/areas \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "name": "图书馆二楼 C 区",
    "floor": "2F",
    "description": "安静学习区"
  }'
```

编辑区域：

```bash
curl -X PUT http://localhost:18080/api/areas/1 \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "name": "Library Area A",
    "floor": "1F",
    "description": "Demo public study area",
    "status": "ACTIVE"
  }'
```

停用或启用区域：

```bash
curl -X PATCH http://localhost:18080/api/areas/1/status \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "status": "INACTIVE"
  }'
```

查询区域 `1` 下的座位资源：

```bash
curl "http://localhost:18080/api/seats?areaId=1" \
  -H "X-Auth-Token: 替换为管理员 token"
```

新增座位资源：

```bash
curl -X POST http://localhost:18080/api/seats \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "areaId": 1,
    "seatNo": "A-005"
  }'
```

编辑座位资源：

```bash
curl -X PUT http://localhost:18080/api/seats/1 \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
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
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "status": "INACTIVE"
  }'
```

区域和座位都采用逻辑停用，不做物理删除，避免破坏历史预约记录。

## 5. 创建预约

```bash
curl -X POST http://localhost:18080/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "seatSlotId": 1
  }'
```

后端会从登录 token 识别当前学生，不再从请求体传 `userId`。预约接口已接入 Redis 短窗口限流，数据库条件更新仍是防超卖的最终保障：

```sql
UPDATE seat_slots
SET status = 'RESERVED'
WHERE id = ? AND status = 'AVAILABLE';
```

## 6. 签到

使用预约返回的 `checkinCode`：

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-in \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "checkinCode": "替换为预约返回的签到码"
  }'
```

成功后预约状态变为 `CHECKED_IN`，座位时段状态变为 `USING`。

## 7. 查询我的预约

查询当前登录学生的最近预约：

```bash
curl "http://localhost:18080/api/reservations?limit=50" \
  -H "X-Auth-Token: 替换为学生 token"
```

## 8. 签退

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-out \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

成功后预约状态变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。

## 9. 取消预约

```bash
curl -X POST http://localhost:18080/api/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

成功后预约状态变为 `CANCELLED`，座位时段重新变为 `AVAILABLE`。

## 10. 释放超时未签到预约

当前既保留手动触发接口，也已经提供定时任务入口。默认每 60 秒扫描一次超时未签到预约。

```bash
curl -X POST "http://localhost:18080/api/reservations/expire-overdue?limit=100" \
  -H "X-Auth-Token: 替换为管理员 token"
```

返回值是本次释放的预约数量。释放成功后预约状态变为 `EXPIRED`，座位时段重新变为 `AVAILABLE`。

## 11. 查询管理员看板

查询今天的座位使用汇总：

```bash
curl http://localhost:18080/api/admin/dashboard \
  -H "X-Auth-Token: 替换为管理员 token"
```

查询指定日期：

```bash
curl "http://localhost:18080/api/admin/dashboard?date=2026-05-14" \
  -H "X-Auth-Token: 替换为管理员 token"
```

返回内容包含总时段、空闲、已预约、使用中、异常占用、活跃预约数，以及各区域利用率。

## 12. 前端联调说明

当前前端学生端已经接入：

- 登录、退出和当前用户识别。
- 查询座位时段。
- 创建预约。
- 查询我的预约。
- 显示预约返回的签到码。
- 使用签到码签到。
- 签退释放座位。
- 取消预约释放座位。

当前前端管理端已经接入：

- 区域管理页新增、编辑、停用、启用区域。
- 座位管理页查询区域座位。
- 座位管理页新增、编辑、停用、启用座位资源。
- 开放时段页按区域、座位、日期和多个时间段模板批量发布可预约资源。
- 开放时段页撤销未被预约的空闲时段。
- 开放时段页填写原因后标记异常占用和恢复异常时段。
- 开放时段页填写原因后释放已预约、使用中或异常占用的座位时段。
- 占用看板页查询区域利用率和统计卡片。

本地启动前端后访问：

```text
http://localhost:5173
```

前端默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:18080`。
