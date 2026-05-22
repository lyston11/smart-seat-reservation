# AmorLX 开发日志

## 2026-05-22

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-area-map-metadata
- 目标: 为预约端室内地图新增长期稳定的区域地图元数据，避免继续依赖区域名称推断 A/B 楼和连廊。

### 本次改动
- 新增 `areas` 地图元数据字段：`buildingCode`、`floorCode`、`areaType`、`mapX`、`mapY`，并通过 Flyway V16 为演示区域回填基础配置。
- 后端 Area API 支持创建、编辑和返回地图元数据，服务层统一做大小写规范化、楼层兜底和坐标范围校验。
- 预约端 `CampusIndoorMap` 优先使用结构化楼栋和楼层字段，旧数据继续保留名称/描述推断兜底。
- 管理员区域管理页新增楼栋分区、地图楼层、区域类型和地图坐标维护入口，并在表格中紧凑展示地图配置。
- 更新 API 契约、API 手测示例、设计文档和实施计划。

### 涉及文件
- backend/src/main/resources/db/migration/V16__add_area_map_metadata.sql
- backend/src/main/java/com/lyston/smartseat/area/
- backend/src/test/java/com/lyston/smartseat/area/AreaServiceTest.java
- frontend/src/types/seat.ts
- frontend/src/api/areas.ts
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/pages/AdminAreasPage.tsx
- frontend/src/App.test.tsx
- docs/architecture/API_CONTRACT.md
- docs/API_EXAMPLES.md
- docs/plans/2026-05-22-area-map-metadata-design.md
- docs/plans/2026-05-22-area-map-metadata.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `mvn -Dtest=AreaServiceTest test`。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx App.test.tsx`。
- 已运行 `mvn test`，后端 84 个测试通过。
- 已运行 `npm run test`，前端 48 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- 本次只新增结构化字段和维护入口，没有实现完整地图拖拽编辑器。
- `mapX/mapY` 当前用于稳定排序和后续扩展，室内地图仍保持三段式 A 楼、A/B 连廊、B 楼响应式布局。

### 对其他成员的影响
- 区域接口新增可选字段，旧数据和旧 mock 不填写也能继续工作。
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、锁位恢复和后端签到状态机。
- 后续新增区域时建议在区域管理页填写地图元数据，学生端地图会优先按结构化字段归类。

## 2026-05-21

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-auto-slots-locked-seat-map
- 目标: 在学生预约端新增楼栋、楼层和 A/B 连廊的室内地图式区域入口，继续为手机端响应式同一套页面做准备。

### 本次改动
- 新增 `CampusIndoorMap` 组件，按区域名称、楼层和描述推断 A 楼、B 楼、A/B 连廊三类空间分区。
- 学生选座页在原区域下拉前增加室内导航图，点击地图区域会复用现有 `applySelectedArea` 流程加载对应区域桌椅和座位状态。
- 地图支持楼层切换，当前选区高亮展示，区域卡片展示开放时间。
- 新增响应式样式，桌面横向展示 A 楼、连廊、B 楼，手机端自动收为单列。
- 新增设计文档和实施计划，明确本阶段不引入 GIS/地图引擎、不改后端签到验证逻辑，后续可演进为结构化楼栋和坐标配置。

### 涉及文件
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-21-indoor-reservation-map-design.md
- docs/plans/2026-05-21-indoor-reservation-map.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`。
- 已运行 `npm run test -- App.test.tsx`。
- 已运行 `npm run test`，前端 31 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 67 个测试通过。

### 遗留问题
- 当前 A/B 楼和连廊根据区域名称、楼层、描述推断，长期稳定运行建议后续为区域补充结构化 `buildingCode`、`areaType`、地图坐标等配置。
- 本次只完成预约端区域导航和具体选座衔接，没有新增管理员地图编辑器。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、签到时间窗和后端状态机。
- 其他成员新增区域时，如果希望预约端地图准确归类，可在区域名称或描述中包含 `A 楼`、`B 楼`、`连廊` 等关键词。

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
