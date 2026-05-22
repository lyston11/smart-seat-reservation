# AmorLX 开发日志

## 2026-05-22

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-reservation-ui-polish
- 目标: 修正室内地图 C/D 楼显示，明确 A/B 与 C/D 是两组独立楼栋，B/C 之间不相连。

### 本次改动
- 学生端室内地图改为两组楼栋渲染：`A 楼 - A/B 连廊 - B 楼` 与 `C 楼 - C/D 连廊 - D 楼`。
- A、B、C、D 四栋楼在有开放区域的楼层中保持常驻占位，即使 C/D 楼暂未配置具体自习区，也会显示为空楼栋区域。
- 连廊仍只在 2F 和 3F 显示；1F 不显示 A/B 或 C/D 连廊，避免误导。
- 补充回归测试，覆盖 C/D 楼无具体房间时仍显示楼栋，并确认 C/D 连廊不会和 B 楼混在同一组。
- 更新连廊楼层可见性实施记录。

### 涉及文件
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-22-connector-floor-visibility.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- CampusIndoorMap.test.tsx`，确认新增 C/D 楼常驻和楼栋组测试失败于旧实现缺少 `A/B 教学楼组`、`C/D 教学楼组`。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`，4 个组件测试通过。
- 已运行 `npm run test`，前端 55 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：1F 显示 A/B 教学楼组和 C/D 教学楼组，C 楼、D 楼为空楼栋占位且无连廊；切换 2F 后 A/B 连廊位于 A/B 组内，C/D 连廊位于 C/D 组内，C/D 组不包含 B 楼。

### 遗留问题
- 当前只修正楼栋结构展示，真实 C/D 楼自习区、桌子和座位仍需要后续通过管理员配置或演示数据补齐。

### 对其他成员的影响
- 本次只改预约端地图展示，不修改签到验证、开放时段发布、后端预约状态机和数据库结构。

## 2026-05-22

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-reservation-ui-polish
- 目标: 修正室内地图连廊显示规则，确保 A/B 与 C/D 连廊只在 2F-3F 出现，1F 不显示连廊避免误导。

### 本次改动
- 将预约端室内地图分区扩展为 A 楼、A/B 连廊、B 楼、C 楼、C/D 连廊、D 楼。
- A/B 与 C/D 连廊只在 2F、3F 渲染，1F 和其他楼层即使有误配连廊区域也不会显示连廊栏。
- 兼容旧 `CONNECTOR` 元数据为 A/B 连廊，同时新增 `CONNECTOR_AB`、`CONNECTOR_CD`、`C`、`D` 楼栋编码支持。
- 管理员区域管理页新增 C 楼、D 楼、A/B 连廊、C/D 连廊选项，方便后续长期维护公共区域地图。
- 合并远端最新 `main`，保留同事对桌椅布局溢出的缩放修复，并保留本分支座位图缩放控件。
- 新增实施记录 `docs/plans/2026-05-22-connector-floor-visibility.md`。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/area/AreaService.java
- backend/src/test/java/com/lyston/smartseat/area/AreaServiceTest.java
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/pages/AdminAreasPage.tsx
- frontend/src/types/seat.ts
- frontend/src/styles/main.css
- docs/architecture/API_CONTRACT.md
- docs/API_EXAMPLES.md
- docs/plans/2026-05-22-connector-floor-visibility.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- CampusIndoorMap.test.tsx`，确认新增连廊楼层规则测试失败于 1F 仍显示 A/B 连廊。
- 已先运行 `mvn -Dtest=AreaServiceTest test`，确认新增 `CONNECTOR_CD` 测试失败于后端拒绝楼栋编码。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`，3 个组件测试通过。
- 已运行 `mvn -Dtest=AreaServiceTest test`，6 个后端区域测试通过。
- 已运行 `mvn test`，后端 92 个测试通过。
- 已运行 `npm run test`，前端 54 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已重启本地前端和后端；后端使用临时演示库 `smart_seat_pr21` 跑通最新 Flyway 迁移，避免本机旧分支 V15 迁移记录影响演示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：1F 不显示 A/B 或 C/D 连廊，误配到 1F 的连廊区域不会展示；切换 2F 后显示 A/B 连廊和 C/D 连廊；切换 3F 后显示 C/D 连廊。

### 遗留问题
- 本次只修正连廊楼层可见性和 C/D 元数据支持，后续如果需要真实 C/D 桌椅座位演示，还需要继续补 C/D 区域的桌子和座位数据。

### 对其他成员的影响
- 区域 `buildingCode` 允许值扩展，不影响旧的 `CONNECTOR` 数据。
- 本次不修改签到验证、WiFi/IP 校验、签到码校验和后端预约状态机。

## 2026-05-22

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-reservation-ui-polish
- 目标: 继续完善学生预约端 UI，让楼层、区域、时间和具体座位选择更连贯，并修正桌内座位编号展示，增强多方向桌椅和缩放查看体验。

### 本次改动
- 新增前端 `seatDisplay` 工具，学生座位图按每张桌内部顺序显示 `1号`、`2号`、`3号`、`4号`，避免历史全局座位标签造成跳号。
- `SeatMap` 使用桌内编号生成座位按钮和 Tooltip，保留无桌子旧数据的兜底显示。
- 学生选座页新增“选择路径”条，将楼层、区域、预约时段、桌座串联展示，减少地图选择与座位确认之间的割裂感。
- 新增响应式样式，路径条在桌面多列展示，手机端自动变为单列。
- 坐标座位图新增缩放控件，支持缩小、放大和适配，画布缩放使用平滑动画。
- 桌子根据宽高和旋转角度标记横向、纵向、旋转状态，横向长桌和侧向桌使用不同桌面纹理方向。
- 修复坐标画布撑宽导致缩放控件被右侧已选座位面板覆盖的问题。
- 管理员桌子管理页新增“学生视角座位图”，复用学生端桌椅渲染、桌内编号和缩放控件，方便管理员按学生反馈定位具体桌座。
- 管理员座位图将座位启用/停用状态展示为管理语义，点击座位后显示桌座路径、系统座位号和状态。
- 更新 `SeatMap` 和 `App` 测试，覆盖桌内编号和选择路径。
- 新增实施记录 `docs/plans/2026-05-22-reservation-ui-polish.md`。

### 涉及文件
- frontend/src/utils/seatDisplay.ts
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/plans/2026-05-22-reservation-ui-polish.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- SeatMap.test.tsx`，覆盖桌内编号、缩放控件和多方向桌子展示。
- 已运行 `npm run test -- App.test.tsx`，覆盖管理员桌子页学生视角座位图。
- 已运行 `npm run test`，前端 53 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats`，确认缩放控件可见，点击放大后比例从 100% 变为 110%，且控件不再被右侧面板覆盖。
- 已用浏览器打开 `http://127.0.0.1:5173/admin/tables`，确认管理员座位图可见，点击 `T01 · 1号` 后显示系统座位号和启用状态。

### 遗留问题
- 本次只完成前端展示层的桌内编号和管理员对照视图，管理员端批量生成/编辑座位标签仍可在后续继续优化。
- 预约记录历史展示仍保留后端返回的座位号和标签，不在本次修改范围内。

### 对其他成员的影响
- 不修改签到验证、二维码 token、IP 校验、签到码校验和后端预约状态机。
- 学生座位图展示从全局 `seatLabel` 转为桌内局部编号，后续前端新增选座入口时应复用 `seatDisplay` 工具。

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
