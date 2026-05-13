# 本地开发与部署路线

## 1. 本地开发模式

推荐使用混合模式：

```text
MySQL / Redis 使用 Docker Compose
Spring Boot 后端在本机运行
Vite 前端在本机运行
```

这样既能保证每个人依赖环境一致，又能保留 IDE 调试和前端热更新体验。

## 2. 环境要求

- Java 21
- Maven 3.9+
- Node.js 22+
- npm 10+
- Docker
- Docker Compose

## 3. 启动依赖服务

第一次启动前复制环境变量：

```bash
cp .env.example .env
```

启动 MySQL 和 Redis：

```bash
docker compose up -d
```

查看状态：

```bash
docker compose ps
```

停止服务：

```bash
docker compose down
```

如需清空本地数据：

```bash
docker compose down -v
```

## 4. 启动后端

```bash
cd backend
mvn spring-boot:run
```

如果本机没有 Maven，需要先安装 Maven 3.9+，或后续由团队补充 Maven Wrapper 后使用 `./mvnw spring-boot:run`。

默认地址：

```text
http://localhost:8080
```

接口文档：

```text
http://localhost:8080/swagger-ui.html
```

健康检查：

```text
http://localhost:8080/api/health
```

## 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认地址：

```text
http://localhost:5173
```

前端通过 Vite proxy 转发 `/api` 请求到后端。

## 6. 部署路线

### 开发阶段

```text
MySQL / Redis：Docker Compose
后端：本地 Maven 启动
前端：本地 Vite 启动
```

### 演示阶段

补充 `docker-compose.full.yml`，将前端、后端、MySQL、Redis 一起容器化。

### 正式部署阶段

```text
前端：Nginx 托管静态文件
后端：Spring Boot jar 或 Docker 容器
数据库：独立 MySQL 实例
缓存：独立 Redis 实例
反向代理：Nginx
```

正式部署时必须修改默认密码，并通过环境变量注入配置。
