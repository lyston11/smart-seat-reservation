# lyston11 开发日志

## 2026-05-13

### 任务
- Issue: 暂无
- 分支: feature/lyston11-initial-app
- 目标: 确定 Java 高并发技术路线，生成项目开发大纲，并搭建前后端初始工程结构。

### 本次改动
- 明确技术栈：React + TypeScript + Vite + Ant Design，Java 21 + Spring Boot 4 + MyBatis-Plus，MySQL 8.4，Redis 7。
- 新增项目开发大纲、系统架构说明、本地开发与部署路线。
- 新增 Docker Compose，用于本地启动 MySQL 和 Redis。
- 新增 Spring Boot 后端骨架，包含健康检查、座位时段查询、创建预约接口、统一响应、异常处理、Flyway 迁移和演示数据。
- 新增 React 前端骨架，包含学生选座页面、座位时段查询和预约操作。
- 新增 GitHub Actions CI 草案。

### 涉及文件
- README.md
- DEVELOPMENT.md
- .env.example
- .gitignore
- docker-compose.yml
- docs/PROJECT_OUTLINE.md
- docs/architecture/ARCHITECTURE.md
- docs/deployment/LOCAL_DEVELOPMENT.md
- docs/dev-logs/lyston11.md
- backend/
- frontend/
- .github/workflows/ci.yml

### 验证方式
- 已检查本地 Java、Node、npm、Docker、Docker Compose 版本。
- 已运行 `docker compose config`，Docker Compose 配置可解析。
- 前端依赖版本已通过 `npm view` 查询并修正。
- 本机缺少 Maven，尚未运行后端 `mvn test`。
- `npm install` 多次长时间无输出后被终止，尚未生成 `package-lock.json`，前端 lint/test/build 待网络稳定后执行。

### 遗留问题
- 本地当前没有 Maven 命令，需要安装 Maven 或补充 Maven Wrapper 后再运行后端测试。
- 后续需要补充登录鉴权、管理员功能、签到签退、超时释放、Redis 缓存和限流。

### 对其他成员的影响
- 后续成员需要基于本技术路线开发。
- 后端新功能应放入 `backend/src/main/java/com/lyston/smartseat/` 对应业务包。
- 前端新页面应放入 `frontend/src/pages/`，接口封装放入 `frontend/src/api/`。

## 2026-05-13

### 任务
- Issue: 暂无
- 分支: feature/lyston11-initial-app
- 目标: 继续补齐预约生命周期接口，让后端主流程从预约扩展到签到、签退、取消和超时释放。

### 本次改动
- 新增签到记录实体、动作常量和 Mapper。
- 新增预约签到、签退、取消、超时释放接口。
- 调整座位时段释放逻辑：取消、签退、过期后 `seat_slots` 回到 `AVAILABLE`，历史状态保存在 `reservations` 和 `checkin_records`。
- 修正预约表索引设计，允许同一座位时段释放后再次被其他学生预约。
- 前端学生选座页接入签到、签退和取消预约操作。
- 新增 API 手测示例文档。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/checkin/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/resources/db/migration/V1__init_schema.sql
- frontend/src/api/seatSlots.ts
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- docs/API_EXAMPLES.md
- docs/architecture/ARCHITECTURE.md
- docs/PROJECT_OUTLINE.md
- README.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已做静态阅读检查。
- 待运行 `mvn test`，当前本机仍缺少 Maven。

### 遗留问题
- 需要补 Maven Wrapper 或安装 Maven 后执行后端测试。
- 需要补登录鉴权，当前接口用 `userId` 模拟身份。
- `expire-overdue` 当前是手动触发接口，后续应改为定时任务。

### 对其他成员的影响
- 预约释放后的座位时段会重新变为 `AVAILABLE`，不要在前端把 `CANCELLED`、`EXPIRED` 当成座位当前状态。
- 预约历史状态以后从 `reservations.status` 读取。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-engineering-framework
- 目标: 按工程化要求搭建项目大框架和底层架构，为后续学生端、管理员端、看板和定时任务开发提供清晰模块边界。

### 本次改动
- 后端新增 `area` 模块，按 Entity / Mapper / Service / Controller / Response 分层提供区域列表接口。
- 后端新增 `seat` 资源模块，补充座位实体、Mapper、Service、Controller 和座位列表响应。
- 后端新增 `dashboard` 模块，提供管理员看板汇总接口和区域利用率聚合查询。
- 后端新增 `schedule` 模块，启用 Spring Scheduling，并添加超时预约定时释放任务。
- 前端新增 `layout` 层，将侧边栏、顶部标题和内容区从 `App.tsx` 拆出。
- 前端接入 React Router，建立学生选座、我的预约、座位管理、占用看板四个页面入口。
- 前端新增 `types` 层，集中维护 API、座位、预约、看板类型。
- 前端新增 `areas`、`seats`、`dashboard` API 文件，保留 `seatSlots` 作为预约主流程 API。
- 更新 App 测试，让测试适配路由上下文。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/area/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/dashboard/
- backend/src/main/java/com/lyston/smartseat/schedule/
- backend/src/main/java/com/lyston/smartseat/SmartSeatApplication.java
- backend/src/main/resources/application.yml
- frontend/src/layout/
- frontend/src/pages/
- frontend/src/api/
- frontend/src/types/
- frontend/src/App.tsx
- frontend/src/main.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已执行源码结构扫描，确认新增 Controller、Service、Mapper、定时任务入口存在。
- 已执行 `npm run build`，但当前本地未安装前端依赖，失败于 `tsc: command not found`。
- 已执行 `mvn test`，但当前本地缺少 Maven，失败于 `mvn: command not found`。

### 遗留问题
- 需要安装前端依赖并生成 `package-lock.json` 后运行 `npm run lint`、`npm run test`、`npm run build`。
- 需要安装 Maven 或补 Maven Wrapper 后运行 `mvn test`。
- 管理员座位页目前只提供列表骨架，增删改、维护状态切换和权限校验待后续实现。
- 我的预约页目前是页面入口和空状态，后续需要补预约历史接口。
- 看板接口已提供聚合骨架，后续可接 Redis 缓存和更细粒度统计。

### 对其他成员的影响
- 后续新增页面应接入 `frontend/src/layout/AppLayout.tsx` 下的路由结构。
- 前端接口类型优先放入 `frontend/src/types/`，不要在页面里重复声明。
- 后端新业务继续按模块拆分 Entity / Mapper / Service / Controller / Response，不要把业务逻辑写在 Controller。
- 超时预约释放已有定时任务入口，后续修改释放规则时要同步更新 `ReservationService` 和 `ReservationExpirationJob`。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 合并两个 feature 分支后，继续在合并分支上补齐学生端“我的预约”查询切片。

### 本次改动
- 提交 `feature/lyston11-engineering-framework` 的工程化框架改动。
- 创建合并开发分支 `feature/lyston11-merged-development`，该分支包含初始工程和工程化框架提交。
- 将本地 `prototype/` 备份加入 `.gitignore`，避免误提交原型文件。
- 后端在 `reservation` 模块新增按用户查询预约记录接口。
- 前端在 `seatSlots` API 中新增 `listUserReservations`。
- 前端“我的预约”页面接入预约记录查询，替换原空状态骨架。
- 更新 API 手测文档。

### 涉及文件
- .gitignore
- backend/src/main/java/com/lyston/smartseat/reservation/
- frontend/src/api/seatSlots.ts
- frontend/src/pages/MyReservationsPage.tsx
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已确认 `feature/lyston11-merged-development` 同时包含 `feature/lyston11-initial-app` 和 `feature/lyston11-engineering-framework`。
- 尚未运行前后端测试，原因同上：本地缺少 Maven，前端依赖尚未安装。

### 遗留问题
- 预约记录接口当前仍通过 `userId` 模拟身份，后续登录鉴权完成后需要改为当前登录用户。
- 前端预约记录目前只展示基础字段，后续可补座位编号、区域名称、时间段等聚合视图。

### 对其他成员的影响
- 后续开发统一基于 `feature/lyston11-merged-development` 继续。
- 不要提交 `prototype/` 目录，它只是本地原型备份。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 安装前后端依赖，跑通本地联调环境，并按要求避开 8080 端口。

### 本次改动
- 安装前端依赖并生成 `frontend/package-lock.json`。
- 安装并使用本地 Maven / JDK 21 运行后端测试和 Spring Boot 服务。
- 将 Maven 依赖缓存固定到仓库本地 `.m2/repository`，避免依赖用户全局 Maven 缓存。
- 修正 Spring Boot 4 下 Flyway 集成方式，使用 `spring-boot-starter-flyway` 配合 `flyway-mysql`。
- 确认 Docker Compose 中 MySQL 和 Redis 正常运行，Flyway 已完成 `V1__init_schema.sql` 和 `V2__seed_demo_data.sql`。
- 后端默认端口从 8080 调整为 `18080`，并同步更新 `.env.example`、Vite proxy 和本地开发/API 文档。
- 启动后端 `http://localhost:18080`，启动前端 `http://127.0.0.1:5173`。

### 涉及文件
- .env.example
- .gitignore
- backend/pom.xml
- backend/src/main/resources/application.yml
- frontend/package-lock.json
- frontend/vite.config.ts
- docs/API_EXAMPLES.md
- docs/deployment/LOCAL_DEVELOPMENT.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已验证 `http://127.0.0.1:18080/api/health` 返回 `UP`。
- 已验证 `http://127.0.0.1:5173/` 返回前端页面入口。
- 已验证 `http://127.0.0.1:5173/api/health` 可通过 Vite proxy 转发到后端。
- 已完成预约主流程冒烟：查询可用座位时段、创建预约、查询我的预约、签到、签退，签退后座位时段恢复为 `AVAILABLE`。

### 遗留问题
- 前端构建存在 Vite 大 chunk 提醒，当前不影响运行，后续可通过路由级懒加载和拆包优化。
- Vitest 下 Ant Design 触发 jsdom `getComputedStyle` 伪元素能力提示，当前测试仍通过，后续如增加视觉相关测试可补 mock。
- 当前接口仍以 `userId` 模拟身份，后续登录鉴权完成后需要改为从当前会话读取用户。

### 对其他成员的影响
- 本地联调后端默认使用 `18080`，不要再使用 8080。
- 前端开发服务默认使用 Vite 的 `5173`，`/api` 已代理到 `http://localhost:18080`。
- 运行 Maven 命令时建议继续使用仓库本地 `.m2/repository`，避免不同机器的全局缓存影响结果。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员端功能，将座位管理页从只读列表升级为可维护资源的管理页面。

### 本次改动
- 后端 `seat` 模块新增座位资源创建、编辑、状态更新接口。
- 新增 `CreateSeatRequest`、`UpdateSeatRequest`、`UpdateSeatStatusRequest` 和 `SeatStatus`，保持请求对象、状态常量与业务逻辑分层。
- 座位编号按区域做唯一性校验，避免同一区域重复座位编号。
- 座位停用采用逻辑状态 `INACTIVE`，不做物理删除，保护历史预约、签到记录和外键关系。
- 停用座位前检查是否存在 `RESERVED` 或 `USING` 状态的时段，避免误停正在预约或使用中的座位。
- 学生端座位时段查询过滤非启用区域和非启用座位。
- 管理员看板过滤非启用区域和非启用座位。
- 前端座位管理页接入区域下拉、座位新增弹窗、编辑弹窗、停用确认和启用操作。
- 更新 API 手测示例，补充座位资源维护接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/dashboard/DashboardMapper.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seats.ts
- frontend/src/pages/AdminSeatsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/seat.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080` 并验证 Spring Boot 正常启动。
- 已通过接口冒烟验证座位新增、编辑、停用、启用和列表查询。
- 已验证学生端座位时段查询仍正常返回启用座位的开放时段。
- 已验证管理员看板仍正常返回区域统计。

### 遗留问题
- 新增座位后目前不会自动生成开放时段，后续需要补管理员发布开放时段功能。
- 座位管理当前仍未接入管理员鉴权，后续登录与角色权限完成后需要限制到管理员角色。
- 停用座位只检查正在预约或使用中的时段，后续如引入未来预约计划，需要扩展停用规则。

### 对其他成员的影响
- 座位删除请继续走逻辑停用，不要直接删除 `seats` 记录。
- 学生端座位时段查询已经只看启用区域和启用座位，测试数据如果被停用，学生端会自动隐藏。
- 管理员看板统计也会过滤停用资源，统计口径需要和页面说明保持一致。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 按工程化结构继续开发管理员开放时段发布能力，让新增座位可以进入学生端可预约流程。

### 本次改动
- 新增 `SeatSlotService`，将座位时段查询从 Controller 直连 Mapper 调整为 Controller / Service / Mapper 分层。
- 后端新增 `POST /api/seat-slots/publish`，支持按区域、日期、开始时间、结束时间和座位集合批量发布开放时段。
- 新增 `PublishSeatSlotsRequest` 和 `PublishSeatSlotsResponse`，避免接口请求/响应结构散落在 Controller 中。
- 发布时段校验区域必须启用、座位必须属于该区域且启用、开始时间必须早于结束时间。
- 重复发布相同座位、日期和时间段时不报错，返回 `skippedCount` 说明跳过数量。
- 前端新增独立页面 `AdminSeatSlotsPage`，把开放时段管理从座位资源管理页拆出。
- 侧边栏新增“开放时段”入口，接入区域选择、日期选择、时间段选择、座位多选、发布和查询。
- 前端 API 和类型层新增 `publishSeatSlots`、`PublishSeatSlotsPayload`、`PublishSeatSlotsResult`。
- 更新 API 手测示例，补充开放时段发布接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotController.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotService.java
- backend/src/main/java/com/lyston/smartseat/seat/PublishSeatSlotsRequest.java
- backend/src/main/java/com/lyston/smartseat/seat/PublishSeatSlotsResponse.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/App.tsx
- frontend/src/api/seatSlots.ts
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/seat.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已通过接口冒烟验证 2026-05-15 14:00-16:00 对座位 1、2 第一次发布创建 2 个时段，第二次重复发布跳过 2 个时段。
- 已验证前端代理 `http://127.0.0.1:5173/api/seat-slots?areaId=1&date=2026-05-15` 正常返回发布后的开放时段。

### 遗留问题
- 开放时段发布当前只支持单个时间段批量发布到多个座位，后续可以扩展为一天多时间段模板。
- 当前未提供开放时段撤销接口，后续需要在未预约状态下允许管理员撤销误发布时段。
- 仍未接入管理员鉴权，后续登录与角色权限完成后需要限制发布操作。

### 对其他成员的影响
- 时段相关业务逻辑以后优先放入 `SeatSlotService`，不要再让 Controller 直接访问 Mapper。
- 发布开放时段采用幂等风格，重复发布同一 seat/date/time 会跳过而不是抛错。
- 新增座位后需要通过开放时段页发布时段，学生端才会看到可预约资源。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员开放时段生命周期，支持撤销误发布但尚未被预约的开放时段。

### 本次改动
- 后端新增 `DELETE /api/seat-slots/{seatSlotId}`，用于撤销开放时段。
- 撤销逻辑继续放在 `SeatSlotService`，Controller 只负责参数接收和响应封装。
- Mapper 新增条件删除，只允许删除 `AVAILABLE`、未绑定预约人、未绑定预约记录的时段。
- 前端开放时段列表新增“撤销”操作，并对非空闲状态禁用按钮。
- 撤销前增加确认弹窗，降低误操作风险。
- 更新 API 手测示例，补充撤销开放时段说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotController.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotService.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已通过接口冒烟验证：先发布 2026-05-16 18:00-20:00 的临时时段，再调用撤销接口，最终列表中不再存在该时段。

### 遗留问题
- 撤销接口当前采用物理删除空闲时段；后续如需要完整审计轨迹，可扩展 `seat_slots.status` 或新增操作日志。
- 已预约或使用中的时段暂不支持管理员强制撤销，后续应设计异常占用释放流程。
- 管理员鉴权仍待接入，撤销接口后续需要限制到管理员角色。

### 对其他成员的影响
- 撤销开放时段只适用于尚未被预约的 `AVAILABLE` 时段。
- 不要绕过 `SeatSlotService` 直接删除时段，避免破坏预约状态一致性。
- 后续若引入时段审计，需要同步改造撤销逻辑和管理员页面文案。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 增加管理员异常释放能力，补齐座位时段被预约或使用后的人工处理闭环。

### 本次改动
- 新增 `admin` 模块，提供管理员座位时段释放 Controller / Service / Request / Response。
- 新增 `POST /api/admin/seat-slots/{seatSlotId}/release`，支持释放 `RESERVED`、`USING`、`ABNORMAL` 时段。
- 新增预约状态 `ADMIN_RELEASED`，区分学生主动取消、超时过期和管理员人工释放。
- 新增签到记录动作 `ADMIN_RELEASE`，记录管理员释放操作。
- 座位时段释放后回到 `AVAILABLE`，并清空 `reserved_by` 和 `reservation_id`。
- 前端开放时段页对已预约、使用中、异常占用状态展示“释放”操作。
- 前端“我的预约”页面新增 `ADMIN_RELEASED` 状态展示。
- 更新 API 手测示例，补充管理员释放接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/java/com/lyston/smartseat/checkin/CheckinAction.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationMapper.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationStatus.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/pages/MyReservationsPage.tsx
- frontend/src/types/reservation.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已完成管理员释放冒烟：发布 2026-05-17 18:00-20:00 临时时段，用户 1 预约后由管理员 2 释放，座位时段恢复 `AVAILABLE`，预约状态变为 `ADMIN_RELEASED`。

### 遗留问题
- 当前管理员释放只校验传入 `adminUserId` 非空，后续登录鉴权完成后需要从当前管理员会话读取。
- 释放原因目前未记录，后续可扩展请求体增加 `reason` 字段并写入审计日志。
- `ABNORMAL` 状态目前还没有前端标记入口，后续可以补异常占用标记和恢复流程。

### 对其他成员的影响
- 管理员释放属于独立 admin 模块，后续管理员动作优先放入 `backend/src/main/java/com/lyston/smartseat/admin/`。
- 学生端预约历史需要识别 `ADMIN_RELEASED`，不要把它当作普通取消或过期。
- 座位时段释放后会重新开放，前端应重新拉取时段列表，避免显示旧状态。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续按工程化架构推进登录/角色权限、区域 CRUD、开放时段模板、管理员释放审计、Redis 缓存限流和关键业务测试。

### 本次改动
- 新增 `auth` 模块，提供演示登录、退出、当前用户接口和 `X-Auth-Token` 请求头会话。
- 新增 `user` 模块，封装用户实体、角色常量、用户查询和用户响应结构。
- 新增 `RequireRole` 注解、MVC 拦截器和当前用户参数解析器，对学生端和管理员端接口做角色限制。
- 学生预约、签到、签退、取消和我的预约接口改为从登录态读取当前学生，不再从请求体或查询参数传 `userId`。
- 管理员释放接口改为从登录态读取管理员，并要求填写 `reason`。
- 新增 `audit` 模块和 `audit_logs` 迁移表，管理员释放、区域创建、区域更新、区域状态变更会记录审计日志。
- 新增 `cache` 模块，接入座位时段 Redis 缓存和预约接口短窗口限流；座位状态变化后失效对应区域日期缓存。
- 区域管理从只读扩展为新增、编辑、启用、停用，并补充区域名称唯一校验和停用前忙碌时段保护。
- 开放时段发布支持 `periods` 多时间段模板，一次可以给多个座位生成多个开放时段。
- 前端新增登录页、区域管理页；侧边栏按角色展示管理入口；请求层自动携带 `X-Auth-Token`。
- 前端学生页和我的预约页移除手填用户 ID；开放时段页移除手填管理员 ID，释放时弹窗填写原因。
- 更新 API 手测文档，所有受保护接口示例统一展示 token 请求头。
- 新增后端业务单测，覆盖预约原子更新失败、预约成功缓存失效、签退状态流转、管理员释放审计。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/auth/
- backend/src/main/java/com/lyston/smartseat/user/
- backend/src/main/java/com/lyston/smartseat/audit/
- backend/src/main/java/com/lyston/smartseat/cache/
- backend/src/main/java/com/lyston/smartseat/area/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/resources/db/migration/V3__add_audit_logs.sql
- backend/src/test/java/com/lyston/smartseat/reservation/
- backend/src/test/java/com/lyston/smartseat/admin/
- frontend/src/api/
- frontend/src/layout/
- frontend/src/pages/
- frontend/src/types/
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过，当前共 5 个测试。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 当前登录是课程项目演示级 token 登录，没有密码、加密和刷新 token；后续如做正式系统需要接入真实认证。
- Redis 缓存和限流已接入第一版，后续可增加缓存命中统计、限流配置化和异常监控。
- 前端构建仍有 Vite 大 chunk 提醒，后续可通过路由懒加载拆包。
- `ABNORMAL` 状态仍缺少管理员主动标记入口，后续可补异常占用标记和恢复流程。

### 对其他成员的影响
- 受保护接口后续都需要带 `X-Auth-Token`，不要再从前端传 `userId` 或 `adminUserId` 模拟身份。
- 管理员接口应继续使用 `@RequireRole(UserRole.ADMIN)` 限制权限。
- 学生接口应继续从 `CurrentUser` 读取当前用户，业务层仍保留状态和所有权校验。
- 新增会影响座位状态的功能时，需要同步失效 `SeatSlotCacheService` 对应区域日期缓存。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员异常占用闭环，并优化前端工程化拆包。

### 本次改动
- 管理员开放时段页新增“标异常”和“恢复”操作，原因填写弹窗复用释放流程。
- 后端新增管理员标记异常和恢复异常接口，路径为 `/api/admin/seat-slots/{seatSlotId}/abnormal` 和 `/api/admin/seat-slots/{seatSlotId}/restore`。
- 仅允许未绑定预约的 `AVAILABLE` 时段直接标记异常，仅允许未绑定预约的 `ABNORMAL` 时段直接恢复。
- 已绑定预约的异常时段继续走管理员释放流程，释放后关联预约进入 `ADMIN_RELEASED`。
- 新增异常标记和恢复审计动作，管理员原因会写入 `audit_logs`。
- `SeatSlotResponse` 补充 `reservationId`，前端据此区分异常恢复和异常释放。
- 前端路由改为 `React.lazy` + `Suspense`，拆分页面级 chunk，降低首包体积并消除大 chunk 提醒。
- 更新 API 示例文档，补充异常标记和恢复 curl 示例。
- 补充管理员时段服务单测，覆盖标异常、恢复和审计原因。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/java/com/lyston/smartseat/audit/AuditAction.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotResponse.java
- backend/src/test/java/com/lyston/smartseat/admin/AdminSeatSlotServiceTest.java
- frontend/src/App.tsx
- frontend/src/App.test.tsx
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/
- docs/API_EXAMPLES.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过，当前共 7 个测试。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过，页面级 chunk 已拆分。

### 遗留问题
- 异常占用目前是管理员手动标记，后续可结合签到超时、设备上报或座位传感器自动触发。
- 审计日志已经记录原因，后续可补后台审计查询页面。
- 前端管理员开放时段页操作较多，后续可抽出表格 action 组件，进一步降低页面复杂度。

### 对其他成员的影响
- 后续新增座位状态流转时，应继续通过 `SeatSlotMapper` 条件更新保证并发安全。
- 管理员状态变更必须保留原因字段并写审计，避免比赛答辩时无法解释操作来源。
- 前端新增页面建议继续走懒加载，保持页面级拆包。
