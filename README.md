# Smart Seat Reservation

学院公共区域学习座位预约系统。

## 技术栈

```text
前端：React + TypeScript + Vite + Ant Design
后端：Java 21 + Spring Boot 4 + MyBatis-Plus
数据库：MySQL 8.4
缓存：Redis 7
本地依赖：Docker Compose
```

## 快速开始

复制环境变量：

```bash
cp .env.example .env
```

启动本地依赖：

```bash
docker compose up -d
```

项目初期默认每位成员在自己电脑上运行一套本地 MySQL / Redis。`docker-compose.yml` 默认只绑定 `127.0.0.1`，不会把数据库端口暴露到局域网。

如果需要连接团队共享开发数据库，先确认自己的 SSH 公钥已加入服务器，然后运行：

```bash
bash scripts/connect-remote-db.sh
```

脚本会尝试把本机 `127.0.0.1:13306` 转发到服务器 MySQL。连接成功后，后端设置 `MYSQL_PORT=13306` 即可使用共享数据。

当前阶段服务器只作为团队共享数据库使用。本项目后端和前端仍在各成员电脑本地运行，不要把完整应用部署到共享数据库服务器。

启动后端：

```bash
cd backend
mvn spring-boot:run
```

本机需要安装 Maven 3.9+。后续可以补充 Maven Wrapper，统一使用 `./mvnw`。

启动前端：

```bash
cd frontend
npm install
npm run dev
```

更多说明：

- [项目开发大纲](./docs/PROJECT_OUTLINE.md)
- [系统架构说明](./docs/architecture/ARCHITECTURE.md)
- [API 接口契约说明](./docs/architecture/API_CONTRACT.md)
- [本地开发与部署路线](./docs/deployment/LOCAL_DEVELOPMENT.md)
- [API 手测示例](./docs/API_EXAMPLES.md)

## 协作开发

本项目采用「一个主仓库 + 功能分支 + Issue + Pull Request」的协作方式。

团队成员开始开发前，请先阅读：[项目开发协作规范](./DEVELOPMENT.md)。

使用 AI 辅助开发前，请先让 AI 阅读并遵守：[AI 开发规范](./AGENTS.md)。
