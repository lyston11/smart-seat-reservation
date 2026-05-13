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
