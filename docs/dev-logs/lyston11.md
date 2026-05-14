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
