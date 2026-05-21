# AmorLX 开发日志

## 2026-05-21

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-auto-slots-locked-seat-map
- 目标: 根据北京时间自动开放预约时段，并在座位图中将锁位状态独立展示。

### 本次改动
- 新增自动开放时段服务，默认按 `Asia/Shanghai` 和每日 18:00 规则为次日启用区域、启用座位发布完整开放窗口。
- 自动开放复用现有 `SeatSlotService.publishSeatSlots`，重复执行时跳过已存在窗口，并跳过无效开放时间配置，避免影响其他区域。
- 座位时段查询关联预约状态，接口在预约为 `LOCKED` 时返回展示状态 `LOCKED`，不改变 `seat_slots.status` 的持久化状态机。
- 学生端和管理端座位图新增 `已锁位` 状态、紫色样式和不可预约行为。
- 管理员开放时段页支持对展示为 `LOCKED` 的座位执行释放操作。
- 锁位和重新签到恢复会清理对应区域日期的座位图缓存，避免座位图短时间显示旧状态。
- 更新架构说明和 API 手测示例，说明自动开放配置和 `LOCKED` 展示态来源。
- 根据 `docs/architecture/API_CONTRACT.md` 补齐前端 `apiPaths.reservationRules` 常量，预约规则 API 模块不再现场拼接 `/rules` 路径。
- 在 API 契约文档中补充 `GET /api/seat-slots` 允许返回派生展示态 `LOCKED`。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/AutoSeatSlotPublishService.java
- backend/src/main/java/com/lyston/smartseat/seat/AutoSeatSlotPublishProperties.java
- backend/src/main/java/com/lyston/smartseat/seat/AutoSeatSlotPublishResult.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotResponse.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationService.java
- backend/src/main/java/com/lyston/smartseat/schedule/ReservationExpirationJob.java
- frontend/src/components/SeatMap.tsx
- frontend/src/components/AdminSeatSlotActions.tsx
- frontend/src/api/endpoints.ts
- frontend/src/api/reservationRules.ts
- frontend/src/constants/seatSlotStatus.ts
- frontend/src/types/seat.ts
- docs/architecture/API_CONTRACT.md
- docs/architecture/ARCHITECTURE.md
- docs/API_EXAMPLES.md

### 验证方式
- 已运行 `mvn -Dtest=AutoSeatSlotPublishServiceTest test`。
- 已运行 `mvn -Dtest=SeatSlotResponseTest test`。
- 已运行 `mvn "-Dtest=ReservationServiceTest#lockSeatShouldUseOneQuotaAndCapLockEndAtReservationEnd,ReservationServiceTest#reactivateSeatLockShouldReturnToCheckedInAndRefreshWifiPresence" test`。
- 已运行 `npm run test -- SeatMap.test.tsx`。
- 已运行 `npm run test -- AdminSeatSlotActions.test.tsx`。
- 已运行 `npm run test -- endpoints.test.ts`。
- 已运行 `mvn test`，后端 67 个测试通过。
- 已运行 `npm run test`，前端 28 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误。

### 遗留问题
- 当前自动开放策略是达到开放小时后发布次日完整窗口，不做更复杂的运行中补发当天剩余窗口。
- 区域开放时间建议继续保持半小时边界，前端已有 15 分钟输入步进，但自动开放会跳过非半小时配置。

### 对其他成员的影响
- 座位图接口 `status` 新增展示值 `LOCKED`，前端统计、筛选或导出逻辑如直接枚举状态需要同步识别。
- `LOCKED` 不应写入 `seat_slots.status`，涉及座位图展示时应继续从预约状态派生。
- 自动开放时段配置可通过 `AUTO_SEAT_SLOTS_ENABLED`、`AUTO_SEAT_SLOTS_ZONE_ID`、`AUTO_SEAT_SLOTS_OPEN_HOUR` 和 `AUTO_SEAT_SLOTS_DELAY_MS` 调整。
