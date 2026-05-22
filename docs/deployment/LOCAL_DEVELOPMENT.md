# 本地开发与部署路线

## 1. 本地开发模式

推荐使用混合模式：

```text
MySQL / Redis 使用 Docker Compose
Spring Boot 后端在本机运行
Vite 前端在本机运行
```

这样既能保证每个人依赖环境一致，又能保留 IDE 调试和前端热更新体验。

项目初期默认采用“每位成员电脑本地一套数据库”的方式：

```text
成员 A：本机 MySQL / Redis / 后端 / 前端
成员 B：本机 MySQL / Redis / 后端 / 前端
成员 C：本机 MySQL / Redis / 后端 / 前端
```

各成员本地数据互不共享，数据库结构通过 Flyway 迁移脚本保持一致。需要演示统一数据时，再单独准备演示库或导入同一份测试数据。

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

默认配置会把 MySQL 和 Redis 只绑定到本机：

```dotenv
MYSQL_BIND_ADDRESS=127.0.0.1
REDIS_BIND_ADDRESS=127.0.0.1
```

不要改成 `0.0.0.0`，除非明确知道自己需要让其他设备访问本机数据库，并且已经配置好防火墙和强密码。

如果本机已经安装了 MySQL 或 Redis，端口冲突时优先改 `.env`：

```dotenv
MYSQL_PORT=13306
REDIS_PORT=16379
```

同时后端会自动读取这些端口环境变量；如果不是通过同一个终端环境启动后端，需要在 IDE 的运行配置里同步设置 `MYSQL_PORT` 和 `REDIS_PORT`。

启动 MySQL 和 Redis：

```bash
docker compose up -d
```

查看状态：

```bash
docker compose ps
```

查看 MySQL 日志：

```bash
docker compose logs mysql
```

查看 Redis 日志：

```bash
docker compose logs redis
```

停止服务：

```bash
docker compose down
```

如需清空本地数据：

```bash
docker compose down -v
```

清空数据会删除本机 Docker volume 中的 MySQL 和 Redis 数据。执行后下次启动后端时，Flyway 会重新建表并执行种子数据脚本。

## 4. 本地数据库连接信息

默认 MySQL 连接信息：

```text
Host: 127.0.0.1
Port: 3306
Database: smart_seat
User: smart_seat
Password: smart_seat_dev
```

默认 Redis 连接信息：

```text
Host: 127.0.0.1
Port: 6379
```

可以用 DataGrip、Navicat、DBeaver 等工具连接本地 MySQL。不要用 `root` 用户做日常开发连接，默认业务用户是 `smart_seat`。

本地数据库密码只是开发默认值，不要用于服务器、演示机或正式环境。

## 5. 启动后端

```bash
cd backend
mvn spring-boot:run
```

如果本机没有 Maven，需要先安装 Maven 3.9+，或后续由团队补充 Maven Wrapper 后使用 `./mvnw spring-boot:run`。

默认地址：

```text
http://localhost:18080
```

接口文档：

```text
http://localhost:18080/swagger-ui.html
```

健康检查：

```text
http://localhost:18080/api/health
```

## 6. 启动前端

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

## 7. 常见问题

### 端口被占用

如果 `docker compose up -d` 提示 `3306` 或 `6379` 被占用，说明本机已有 MySQL/Redis 或其他容器占用了端口。推荐改 `.env`：

```dotenv
MYSQL_PORT=13306
REDIS_PORT=16379
```

然后重新启动：

```bash
docker compose up -d
```

### 后端连不上数据库

先确认容器健康：

```bash
docker compose ps
```

再确认后端启动时读取到的端口和 `.env` 一致。IDE 启动后端时不会自动加载 `.env`，需要在运行配置中手动加入对应环境变量，或保持默认端口不变。

### 表结构不一致

不要手动改本地表结构后再提交代码。表结构变化必须写到 `backend/src/main/resources/db/migration/` 下的 Flyway 迁移脚本中。

如果只是本地调试产生了脏数据，可以清库重建：

```bash
docker compose down -v
docker compose up -d
```

### 团队数据不一致

初期各成员本地数据库不互通是正常现象。功能验证以接口逻辑和迁移脚本为准；需要共同演示时，提前约定同一份种子数据或导入脚本。

### 连接共享开发数据库

如果需要让学生端、管理员端和不同成员本地后端使用同一份开发数据，可以通过 SSH Tunnel 连接服务器共享开发库。数据库端口不直接暴露公网，本机只连接 `127.0.0.1:13306`：

推荐使用项目脚本：

```bash
bash scripts/connect-remote-db.sh
```

查看连接状态：

```bash
bash scripts/connect-remote-db.sh status
```

停止由脚本创建的隧道：

```bash
bash scripts/connect-remote-db.sh stop
```

如果本机 `13306` 已经被占用，可以临时指定其他本地端口：

```bash
REMOTE_DB_LOCAL_PORT=13307 bash scripts/connect-remote-db.sh
```

脚本内部执行的核心 SSH Tunnel 形式如下：

```bash
ssh -f -N -L 13306:127.0.0.1:3306 \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3 \
  root@64.23.134.124
```

后端环境变量：

```dotenv
MYSQL_HOST=127.0.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=smart_seat
MYSQL_USER=smart_seat
MYSQL_PASSWORD=smart_seat_dev
```

注意：如果后续服务器密码已改强密码，以服务器 `/srv/projects/smart-seat-db/.env` 为准。不要把生产级密码写入 Git。

如果脚本提示 SSH 无法连接，通常说明当前电脑的 SSH 公钥还没有加入服务器 `authorized_keys`，需要先找服务器维护者添加公钥。

## 8. 部署路线

### 开发阶段

```text
MySQL / Redis：Docker Compose
后端：本地 Maven 启动
前端：本地 Vite 启动
```

### 演示阶段

可以继续沿用单台电脑本地数据库进行演示，也可以准备一台演示服务器统一部署。演示服务器部署时，MySQL 和 Redis 仍不应暴露公网端口。

### 正式部署阶段

```text
前端：Nginx 托管静态文件
后端：Spring Boot jar 或 Docker 容器
数据库：独立 MySQL 实例
缓存：独立 Redis 实例
反向代理：Nginx
```

正式部署时必须修改默认密码，并通过环境变量注入配置。

## 9. 反向代理与签到 IP 检测

签到和 WiFi 在线检测依赖“后端识别到的客户端 IP”是否命中区域配置的 `checkin_ip_cidrs`。如果后端部署在 Nginx、网关或负载均衡后面，必须正确透传真实客户端 IP，否则后端只能看到代理服务器 IP。

推荐 Nginx 配置：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:18080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

后端不会盲目信任 `X-Forwarded-For`。只有当请求来源 `remoteAddr` 命中可信代理网段时，后端才会采用转发头里的第一个有效 IP。可信代理网段通过环境变量配置：

```dotenv
TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128,10.0.0.0/8
```

配置建议：

- 本地开发保留默认 `127.0.0.1/32,::1/128`。
- 单机 Nginx 代理到本机后端时，默认值即可让后端信任来自本机 Nginx 的转发头。
- Docker Compose 或内网代理部署时，把 Nginx/网关所在容器网段或内网网段加入 `TRUSTED_PROXY_CIDRS`。
- 不要把 `0.0.0.0/0` 或公网网段配置成可信代理，否则客户端可以伪造 `X-Forwarded-For` 绕过校园网 IP 检测。

管理员可以在“区域管理”中维护“签到校园网 IP 网段”，多个 CIDR 用英文逗号分隔，例如：

```text
10.10.0.0/16,172.16.20.0/24
```

保存区域时后端会校验 CIDR 格式。页面中的“测试当前 IP”按钮会调用后端测试接口，返回后端当前识别到的客户端 IP、是否来自可信代理转发、以及是否命中该区域网段。部署到演示服务器后，建议先用这项功能确认校园网签到规则生效，再开放比赛演示。
