# API 手测示例

本文档记录当前后端核心接口。默认后端地址为：

```text
http://localhost:18080
```

接口分组、统一响应格式和前端 API 模块边界见：[API 接口契约说明](./architecture/API_CONTRACT.md)。

## 1. 健康检查

```bash
curl http://localhost:18080/api/health
```

## 2. 登录和请求头

演示账号：

- 学生：`20260001`，密码：`123456`
- 管理员：`admin`，密码：`admin`

登录：

```bash
curl -X POST http://localhost:18080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "studentNo": "20260001",
    "password": "123456"
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

返回中的 `id` 是后续预约使用的 `seatSlotId`，`seatNo` 是前端座位地图展示的真实座位编号。桌位可视化字段包括：

```text
tableId / tableNo / tableRowNo / tableColumnNo / tableDisplayOrder
tablePositionX / tablePositionY / tableWidthPx / tableHeightPx / tableRotationDeg
seatLabel / seatSide / seatOrder
```

前端会按学生当前选择的开始/结束时间展示座位状态，并优先使用桌子坐标字段渲染真实平面图。长方形桌子建议使用 `NORTH` 两个座位和 `SOUTH` 两个座位表达“上方两个、下方两个”的常见四人桌布局。

座位时段响应的 `status` 可能返回 `LOCKED`。这是为了座位图独立展示“已锁位”的派生展示状态：数据库中的 `seat_slots.status` 仍是 `USING`，接口会根据关联预约 `reservations.status = LOCKED` 返回 `LOCKED`，前端会禁用该座位并显示“已锁位”。

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

系统也会按北京时间自动开放预约时段。默认配置为 `AUTO_SEAT_SLOTS_ENABLED=true`、`AUTO_SEAT_SLOTS_ZONE_ID=Asia/Shanghai`、`AUTO_SEAT_SLOTS_OPEN_HOUR=18`、`AUTO_SEAT_SLOTS_DELAY_MS=300000`：达到开放小时后，定时任务会为启用区域的启用座位发布次日 `openTime-closeTime` 完整窗口，重复执行会跳过已存在的窗口。

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

管理员释放已预约、使用中或已锁位的座位时段：

```bash
curl -X POST http://localhost:18080/api/admin/seat-slots/1/release \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "reason": "学生离座超时，管理员现场确认空座"
  }'
```

释放、标记异常和恢复操作都会写入 `audit_logs`。

查询最近审计日志：

```bash
curl "http://localhost:18080/api/admin/audit-logs?limit=50" \
  -H "X-Auth-Token: 替换为管理员 token"
```

按动作、操作人、目标类型和时间范围筛选审计日志：

```bash
curl "http://localhost:18080/api/admin/audit-logs?action=AREA_CHANGE&actorUserId=2&targetType=AREA&startAt=2026-05-15T08:00:00&endAt=2026-05-15T18:00:00&limit=50" \
  -H "X-Auth-Token: 替换为管理员 token"
```

`action` 可选值包括 `ADMIN_RELEASE_SEAT_SLOT`、`ADMIN_MARK_SEAT_SLOT_ABNORMAL`、`ADMIN_RESTORE_SEAT_SLOT` 和 `AREA_CHANGE`。其中 `AREA_CHANGE` 会覆盖区域新增、编辑和状态变更三类日志。

## 4. 区域、桌子和座位资源

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
    "description": "安静学习区",
    "openTime": "08:00:00",
    "closeTime": "22:00:00"
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
    "status": "ACTIVE",
    "openTime": "08:00:00",
    "closeTime": "22:00:00"
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

查询区域 `1` 下的桌子资源：

```bash
curl "http://localhost:18080/api/tables?areaId=1" \
  -H "X-Auth-Token: 替换为学生或管理员 token"
```

普通桌子列表不会返回 `qrToken`，避免固定桌码被学生端列表直接暴露。

新增桌子资源：

```bash
curl -X POST http://localhost:18080/api/tables \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "areaId": 1,
    "tableNo": "T02",
    "name": "图书馆一楼 A 区 T02",
    "rowNo": 1,
    "columnNo": 2,
    "displayOrder": 2,
    "positionX": 340,
    "positionY": 80,
    "widthPx": 260,
    "heightPx": 96,
    "rotationDeg": 0
  }'
```

编辑桌子资源：

```bash
curl -X PUT http://localhost:18080/api/tables/1 \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "areaId": 1,
    "tableNo": "T01",
    "name": "图书馆一楼 A 区 T01",
    "status": "ACTIVE",
    "rowNo": 1,
    "columnNo": 1,
    "displayOrder": 1,
    "positionX": 80,
    "positionY": 80,
    "widthPx": 260,
    "heightPx": 96,
    "rotationDeg": 0
  }'
```

停用或启用桌子资源：

```bash
curl -X PATCH http://localhost:18080/api/tables/1/status \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "status": "INACTIVE"
  }'
```

查询桌子固定签到二维码信息：

```bash
curl http://localhost:18080/api/tables/1/checkin-qr \
  -H "X-Auth-Token: 替换为管理员 token"
```

返回示例：

```json
{
  "tableId": 1,
  "tableNo": "T01",
  "qrToken": "demo-area-1-table-t01",
  "checkinPath": "/student/table-checkin?token=demo-area-1-table-t01"
}
```

`checkinPath` 用于生成贴在桌面上的固定二维码。学生扫码进入签到页后，仍需要输入预约详情中的动态签到码。

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
    "tableId": 1,
    "seatNo": "A-005",
    "seatLabel": "1",
    "seatSide": "NORTH",
    "seatOrder": 1,
    "rowNo": 3,
    "columnNo": 1,
    "displayOrder": 5
  }'
```

编辑座位资源：

```bash
curl -X PUT http://localhost:18080/api/seats/1 \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "areaId": 1,
    "tableId": 1,
    "seatNo": "A-001",
    "seatLabel": "1",
    "seatSide": "NORTH",
    "seatOrder": 1,
    "rowNo": 1,
    "columnNo": 1,
    "displayOrder": 1,
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

区域、桌子和座位都采用逻辑停用，不做物理删除，避免破坏历史预约记录。

区域资源的 `openTime` 和 `closeTime` 控制学生可预约的每日起止时间。桌子资源的 `positionX`、`positionY`、`widthPx`、`heightPx` 和 `rotationDeg` 用于控制真实平面图坐标；`rowNo`、`columnNo` 和 `displayOrder` 保留为排序和旧布局兜底。座位资源的 `seatLabel`、`seatSide` 和 `seatOrder` 用于控制具体座位在桌子周围的显示位置，`seatSide` 可选值为 `NORTH`、`EAST`、`SOUTH`、`WEST`、`SINGLE`。历史数据会通过迁移自动补一个演示布局。

## 5. 创建预约

查询当前预约规则：

```bash
curl http://localhost:18080/api/reservations/rules \
  -H "X-Auth-Token: 替换为学生或管理员 token"
```

返回内容包含 `checkinLeadMinutes`、`checkinGraceMinutes`、`maxAdvanceDays`、`dailyActiveReservationLimit` 和 `wifiOfflineReleaseMinutes`。这些规则也会在学生选座页和管理员规则页动态展示。

管理员更新预约规则：

```bash
curl -X PUT http://localhost:18080/api/reservations/rules \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为管理员 token" \
  -d '{
    "checkinLeadMinutes": 10,
    "checkinGraceMinutes": 10,
    "maxAdvanceDays": 7,
    "dailyActiveReservationLimit": 3,
    "wifiOfflineReleaseMinutes": 15
  }'
```

规则更新后会写入审计日志，目标类型为 `RESERVATION_RULE`。

```bash
curl -X POST http://localhost:18080/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "seatSlotId": 1
  }'
```

学生自选具体座位和时间段时，也可以直接提交 `seatId`、日期和起止时间。后端会校验所选时间是否落在区域开放时间内、是否有管理员发布的可用窗口覆盖、座位是否存在重叠活跃占用，并在成功后创建一条精确 `seat_slots` 记录用于后续签到、签退和管理员释放：

```bash
curl -X POST http://localhost:18080/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "seatId": 1,
    "slotDate": "2026-05-19",
    "startTime": "09:30:00",
    "endTime": "17:30:00"
  }'
```

后端会从登录 token 识别当前学生，不再从请求体传 `userId`。预约接口已接入 Redis 短窗口限流，并会拒绝已开始/过去时段、拒绝超过提前预约天数的时段、拒绝同一学生在重叠时间段内重复持有活跃预约，也会限制每日活跃预约数量。数据库条件更新仍是防超卖的最终保障：

```sql
UPDATE seat_slots
SET status = 'RESERVED'
WHERE id = ? AND status = 'AVAILABLE';
```

## 6. 签到

签到需要同时满足三项条件：

- 签到码正确，且预约仍为 `RESERVED`。
- 当前时间在预约开始前 `checkinLeadMinutes` 分钟到开始后 `checkinGraceMinutes` 分钟之间，默认前后各 10 分钟。
- 请求来源 IP 命中该区域 `checkin_ip_cidrs` 配置的校园网网段。浏览器无法直接读取 WiFi 名称，系统以服务端解析到的请求 IP 或可信代理传入的 `X-Forwarded-For` / `X-Real-IP` 作为可部署校验依据。

使用预约返回的 `checkinCode`：

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-in \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "checkinCode": "替换为预约返回的签到码"
  }'
```

成功后预约状态变为 `CHECKED_IN`，座位时段状态变为 `USING`，并记录 `lastWifiSeenAt` 和 `lastWifiIp`。

桌面固定二维码签到：

```bash
curl -X POST http://localhost:18080/api/reservations/table-check-in \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "tableQrToken": "demo-area-1-table-t01",
    "checkinCode": "替换为预约返回的签到码"
  }'
```

桌码签到会先根据 `tableQrToken` 定位活动桌子，再匹配当前学生在该桌子下的 `RESERVED` 预约，并校验动态签到码和过期时间。二维码只证明学生到达了物理桌子，签到码仍用于证明预约归属。

使用中 WiFi 在线心跳：

```bash
curl -X POST http://localhost:18080/api/reservations/1/wifi-presence \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

学生端会对 `CHECKED_IN` 预约定时调用该接口。若超过 `wifiOfflineReleaseMinutes` 分钟没有有效校园网 IP 心跳，系统会视为学生离开座位。

## 7. 锁位、恢复和释放

锁位只面向已签到使用中的预约。后端不会让前端按“上午/下午/晚上”多选，而是根据单笔连续预约是否跨过 12:00、18:00 自动计算锁位次数：只预约上午没有锁位，连续跨上午和下午有 1 次，连续跨全天有 2 次，分开的多笔预约不累计。

```bash
curl -X POST http://localhost:18080/api/reservations/1/seat-lock \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

成功后预约状态变为 `LOCKED`，返回 `lockedUntilAt`、`seatLockQuota` 和 `seatLockUsedCount`。锁位截止时间取“当前时间 + seatLockMinutes”和“预约结束时间”的较早值。

重新签到恢复使用：

```bash
curl -X POST http://localhost:18080/api/reservations/1/seat-lock/reactivate \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{
    "checkinCode": "替换为预约返回的签到码"
  }'
```

主动释放锁位：

```bash
curl -X POST http://localhost:18080/api/reservations/1/seat-lock/release \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

手动触发过期锁位释放：

```bash
curl -X POST "http://localhost:18080/api/admin/reservations/release-expired-seat-locks?limit=100" \
  -H "X-Auth-Token: 替换为管理员 token"
```

## 8. 查询我的预约

查询当前登录学生的最近预约：

```bash
curl "http://localhost:18080/api/reservations?limit=50" \
  -H "X-Auth-Token: 替换为学生 token"
```

## 9. 签退

```bash
curl -X POST http://localhost:18080/api/reservations/1/check-out \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

成功后预约状态变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。

## 10. 取消预约

```bash
curl -X POST http://localhost:18080/api/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: 替换为学生 token" \
  -d '{}'
```

成功后预约状态变为 `CANCELLED`，座位时段重新变为 `AVAILABLE`。

## 11. 释放超时未签到预约

当前既保留手动触发接口，也已经提供定时任务入口。默认每 60 秒扫描一次超时未签到预约。

```bash
curl -X POST "http://localhost:18080/api/admin/reservations/expire-overdue?limit=100" \
  -H "X-Auth-Token: 替换为管理员 token"
```

返回值是本次释放的预约数量。释放成功后预约状态变为 `EXPIRED`，座位时段重新变为 `AVAILABLE`。

释放 WiFi 离线使用中预约：

```bash
curl -X POST "http://localhost:18080/api/admin/reservations/release-wifi-offline?limit=100" \
  -H "X-Auth-Token: 替换为管理员 token"
```

当前既保留手动触发接口，也已经提供定时任务入口。默认每 60 秒扫描一次，超过 `wifiOfflineReleaseMinutes` 分钟未检测到有效校园网 IP 的 `CHECKED_IN` 预约会变为 `WIFI_RELEASED`，未结束的座位时段重新变为 `AVAILABLE`。

## 12. 查询管理员看板

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

返回内容包含总时段、空闲、待签到、使用中、异常占用、活跃预约数、已签到人数，以及按利用率排序的区域排行榜。

## 13. 前端联调说明

当前前端学生端已经接入：

- 登录、退出和当前用户识别。
- 查询座位时段。
- 动态展示预约规则。
- 按日期、开始时间、结束时间和具体座位创建预约。
- 学生选座页固定展示次日预约，按规则提示每日开放时间和连续跨时段锁位权益。
- 查询我的预约。
- 显示预约返回的签到码。
- 使用签到码签到。
- 扫描桌面固定二维码后进入 `/student/table-checkin?token=<tableQrToken>`，输入签到码完成桌码签到。
- 签退释放座位。
- 取消预约释放座位。
- 对使用中预约执行锁位、重新签到恢复和主动释放锁位。

当前前端管理端已经接入：

- 区域管理页新增、编辑、停用、启用区域。
- 区域管理页维护学生可预约的每日开放开始/结束时间。
- 桌子管理页按区域维护桌子坐标、尺寸和旋转角度，查看并复制固定桌码签到链接。
- 座位管理页查询区域座位。
- 座位管理页新增、编辑、停用、启用座位资源，并维护所属桌子、桌上标签、桌边方位和同侧顺序。
- 开放时段页按区域、座位、日期和多个时间段模板批量发布可预约资源。
- 开放时段页撤销未被预约的空闲时段。
- 开放时段页填写原因后标记异常占用和恢复异常时段。
- 开放时段页填写原因后释放已预约、使用中、已锁位或异常占用的座位时段。
- 占用看板页查询区域利用率和统计卡片。
- 审计日志页按动作、操作人、对象和时间范围筛选管理员操作记录。
- 预约规则页维护签到宽限、提前预约天数和每日活跃预约上限。

本地启动前端后访问：

```text
http://localhost:5173
```

前端默认通过 Vite proxy 将 `/api` 转发到 `http://localhost:18080`。
