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
