# 服务器 Docker 部署说明

本文档用于在演示服务器上部署完整的学院公共区域学习座位预约系统。

当前服务器已存在独立 MySQL compose 项目：

```text
/srv/projects/smart-seat-db
smart-seat-mysql
smart-seat-db_default
```

应用部署不会把数据库端口暴露到公网。后端容器通过 Docker external network 访问 `smart-seat-mysql`，前端 Nginx 容器把 `/api/` 反向代理到后端容器。

## 1. 准备项目目录

```bash
mkdir -p /srv/projects/smart-seat-reservation
cd /srv/projects/smart-seat-reservation
git clone git@github.com:lyston11/smart-seat-reservation.git source
cd source
git checkout main
```

如果需要演示某个功能分支，先确认分支已经推到 GitHub，再切换：

```bash
git fetch origin
git checkout feature/your-branch
```

## 2. 准备环境变量

```bash
cp deploy/.env.example deploy/.env
```

编辑 `deploy/.env`，把 `MYSQL_PASSWORD` 改为服务器 `/srv/projects/smart-seat-db/.env` 中的业务用户密码。不要把真实密码提交到 Git。

保留以下默认值即可接入服务器现有 MySQL：

```dotenv
MYSQL_DATABASE=smart_seat
MYSQL_USER=smart_seat
MYSQL_DOCKER_NETWORK=smart-seat-db_default
FRONTEND_HTTP_PORT=18081
```

## 3. 在本机构建并导出镜像

不要在 2GB 演示服务器上构建前后端镜像。推荐在开发电脑或 CI 上构建，再把镜像 tar 包传到服务器。

在开发电脑执行：

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.app.yml build backend
docker compose --env-file deploy/.env -f deploy/docker-compose.app.yml build frontend
pwsh -File scripts/export-docker-images.ps1
```

Windows PowerShell 也可以使用：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-docker-images.ps1
```

默认会生成：

```text
deploy/artifacts/smart-seat-images-local.tar
```

上传到服务器：

```bash
scp deploy/artifacts/smart-seat-images-local.tar lyston_server:/srv/projects/smart-seat-reservation/
```

## 4. 在服务器加载镜像并启动应用

在服务器执行：

```bash
cd /srv/projects/smart-seat-reservation/source
scripts/load-docker-images.sh ../smart-seat-images-local.tar --up
```

这个脚本只执行 `docker load` 和 runtime compose 启动，不会触发 Docker build。

查看状态：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.runtime.yml ps
docker compose --env-file deploy/.env -f deploy/docker-compose.runtime.yml logs -f backend
```

本机检查：

```bash
curl -i http://127.0.0.1:18081/
curl -i http://127.0.0.1:18081/api/health
```

后端首次启动时会通过 Flyway 自动创建或迁移 `smart_seat` 数据库表。

## 5. 接入服务器 Nginx

如果需要通过域名访问，在宿主机 Nginx 中增加一个 server block，将流量转发到前端容器：

```nginx
server {
    listen 80;
    server_name seat.example.com;

    location / {
        proxy_pass http://127.0.0.1:18081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

修改后检查并重载：

```bash
nginx -t
systemctl reload nginx
```

## 6. 更新应用

在开发电脑重新构建并导出：

```bash
git fetch origin
git checkout main
git pull origin main
docker compose --env-file deploy/.env -f deploy/docker-compose.app.yml build backend
docker compose --env-file deploy/.env -f deploy/docker-compose.app.yml build frontend
pwsh -File scripts/export-docker-images.ps1
scp deploy/artifacts/smart-seat-images-local.tar lyston_server:/srv/projects/smart-seat-reservation/
```

在服务器只拉代码、加载镜像、重启 runtime compose：

```bash
cd /srv/projects/smart-seat-reservation/source
git fetch origin
git checkout main
git pull origin main
scripts/load-docker-images.sh ../smart-seat-images-local.tar --up
```

## 7. 停止应用

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.runtime.yml down
```

默认不会删除 Redis volume，也不会影响现有 MySQL 数据。

## 8. 注意事项

- 不要把 `deploy/.env`、服务器 MySQL 密码、Token 或私钥提交到 Git。
- 不要在演示服务器上运行 `docker compose ... -f deploy/docker-compose.app.yml build`。
- 服务器启动应用使用 `deploy/docker-compose.runtime.yml`，该文件没有 `build:` 配置。
- `deploy/docker-compose.app.yml` 只用于开发电脑或 CI 构建镜像。
- 如果后续开启校园网签到 IP 校验，要确认 `TRUSTED_PROXY_CIDRS` 只包含可信代理或 Docker 内网，不要设置为 `0.0.0.0/0`。
