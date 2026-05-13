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
- [本地开发与部署路线](./docs/deployment/LOCAL_DEVELOPMENT.md)
- [API 手测示例](./docs/API_EXAMPLES.md)

## 协作开发

本项目采用「一个主仓库 + 功能分支 + Issue + Pull Request」的协作方式。

团队成员开始开发前，请先阅读：[项目开发协作规范](./DEVELOPMENT.md)。

使用 AI 辅助开发前，请先让 AI 阅读并遵守：[AI 开发规范](./AGENTS.md)。
