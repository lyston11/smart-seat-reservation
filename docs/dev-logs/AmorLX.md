# AmorLX 开发日志

## 2026-05-23

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-server-deployment
- 目标: 查询 `lyston_server` 上的项目部署现状，并补充可长期复用的 Docker 化服务器部署配置。

### 本次改动
- 通过 `ssh lyston_server` 确认服务器当前只有 `smart-seat-mysql` 数据库容器和 `/srv/projects/smart-seat-db` 目录，未发现本项目后端 jar、前端静态站点或应用容器。
- 新增后端 Dockerfile，使用 Maven + Java 21 多阶段构建，运行 Spring Boot jar。
- 新增前端 Dockerfile，使用 Node 22 构建 React/Vite 静态资源，并用 Nginx 托管。
- 新增前端容器 Nginx 配置，支持 SPA fallback、`/api/` 反向代理、Swagger 文档代理。
- 新增应用部署 compose，复用服务器已有 `smart-seat-db_default` Docker 网络连接 MySQL，只暴露前端容器到宿主机 `127.0.0.1:18081`。
- 新增部署环境变量示例和服务器 Docker 部署说明，真实密码仍要求只放在服务器本地 `deploy/.env`，不提交到 Git。
- README 增加服务器 Docker 部署文档入口。

### 涉及文件
- .dockerignore
- backend/Dockerfile
- frontend/Dockerfile
- frontend/nginx.conf
- deploy/.env.example
- deploy/docker-compose.app.yml
- docs/deployment/SERVER_DOCKER_DEPLOYMENT.md
- docs/plans/2026-05-23-server-docker-deployment.md
- README.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已确认本地当前分支不是 `main`，并从最新 `origin/main` 创建 `feature/AmorLX-server-deployment`。
- 已读取 `docs/dev-logs/AmorLX.md` 和 `docs/dev-logs/lyston11.md`。
- 已运行 `docker compose --env-file deploy/.env -f deploy/docker-compose.app.yml config`，本地配置可解析；`deploy/.env` 由示例文件临时复制，未提交。
- 已运行 `npm run test`，前端 59 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 本地首次尝试 Docker 镜像构建时 Docker Desktop daemon 未启动；用户打开 Docker 后，已在本机顺序完成 `smart-seat-backend:local` 和 `smart-seat-frontend:local` 镜像构建。
- 已将当前工作树临时同步到服务器 `/tmp/smart-seat-deploy-check`，运行 compose config 校验通过，确认 external network `smart-seat-db_default` 可解析。
- 服务器直接并行构建前后端镜像在 2GB 内存机器上超时并造成高负载，已将 Dockerfile 和部署文档调整为低内存顺序构建方案。
- 服务器恢复后已确认无 `smart-seat-backend` / `smart-seat-frontend` 容器或最终镜像；已删除 `/tmp/smart-seat-deploy-check` 临时目录，并清理 Docker BuildKit 可回收缓存 2.086GB，现有 MySQL、fast-note、Hermes、fast-node 容器保持运行。

### 遗留问题
- 服务器目前没有完整应用部署；本次先补可复用部署配置，后续需要把代码同步到服务器并执行构建启动。
- 若要绑定正式域名，还需要在服务器 Nginx 中新增或调整 server block，并在改动前确认域名规划。
- 当前演示服务器内存较小且无 swap，不建议在服务器上并行构建前后端镜像；优先使用顺序构建、本机/CI 构建后发布镜像，或先增加 swap。

### 对其他成员的影响
- 本次不修改业务接口、数据库迁移、签到验证、预约状态机和前端业务页面。
- 后续部署时需要服务器维护者提供 MySQL 业务用户密码，但不应把真实密码写入仓库。

## 2026-05-23

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-reservation-ui-polish
- 目标: 添加桌椅布局限位，避免整套桌椅在学生选座图和管理员桌子预览中相互重叠。

### 本次改动
- 管理员桌子布局预览新增桌子碰撞检测，拖拽或键盘移动桌子时如果会压到其他启用桌子，会保持在原位置。
- 管理员预览会对历史上已经靠得过近的启用桌子做展示层自动错位，避免管理员看到重叠桌椅。
- 学生端和管理员学生视角座位图的坐标归一化改为按完整桌子和座位占用范围计算，而不是只判断坐标点是否重复。
- 自动错位时按桌椅整体高度向下排布，并让预览舞台高度跟随扩展，避免桌子被固定高度裁掉。
- 补充桌椅重叠限位的回归测试和实施记录。

### 涉及文件
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- docs/plans/2026-05-22-reservation-ui-polish.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- TableLayoutPreview.test.tsx`，确认旧实现允许桌子移动到其他桌子上方。
- 已先运行 `npm run test -- SeatMap.test.tsx`，确认旧实现只处理重复坐标，近距离桌椅仍可能重叠。
- 已运行 `npm run test -- TableLayoutPreview.test.tsx`，8 个桌子预览测试通过。
- 已运行 `npm run test -- SeatMap.test.tsx`，9 个座位图测试通过。
- 已运行 `npm run test`，前端 59 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/admin/tables`，通过 API 创建近距离演示桌 `OL47899A` 和 `OL47899B`，确认第二张桌子展示层自动下移，不再与第一张桌椅重叠。

### 遗留问题
- 当前限位是在渲染和管理员移动层面避免重叠，后续若需要多人共同编辑同一平面图，建议在后端保存坐标时也增加碰撞校验。
- 自动错位只改变展示位置，不回写数据库坐标；如果管理员希望永久调整，应在桌子管理页拖拽保存布局。

### 对其他成员的影响
- 本次只修改预约端和管理员桌子可视化渲染，不修改签到验证、WiFi/IP 校验、签到码校验、签到时间窗和后端预约状态机。

## 2026-05-23

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-reservation-ui-polish
- 目标: 修复管理员新增或启用桌子后只有桌子预览、没有真实座位，导致学生端和管理员学生视角座位图不显示的问题。

### 本次改动
- `POST/PUT /api/tables` 支持 `seatCount`，取值范围为 `1-12`。
- 后端新增空桌自动生成座位逻辑：只有桌子启用且当前没有真实座位时才补座位，避免覆盖已有座位、预约和签到数据。
- 四人长桌自动生成 `NORTH/NORTH/SOUTH/SOUTH` 布局，座位编号从 `1` 到 `4`，桌内顺序与学生端显示保持一致。
- 启用历史无座位桌子时，会按桌型尺寸推断座位数并补齐真实座位。
- 管理员桌子页新增 `1人桌` 预设和 `座位数` 字段，新增、编辑和保存布局时都会保持桌型和座位数一致。
- 更新 API 示例、接口契约和预约端 UI 实施记录。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/table/CreateStudyTableRequest.java
- backend/src/main/java/com/lyston/smartseat/table/UpdateStudyTableRequest.java
- backend/src/main/java/com/lyston/smartseat/table/StudyTableService.java
- backend/src/test/java/com/lyston/smartseat/table/StudyTableServiceTest.java
- frontend/src/api/tables.ts
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/App.test.tsx
- docs/API_EXAMPLES.md
- docs/architecture/API_CONTRACT.md
- docs/plans/2026-05-22-reservation-ui-polish.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "submits the selected table seat count"`，确认旧实现提交体缺少 `seatCount`。
- 已先运行 `mvn -Dtest=StudyTableServiceTest test`，确认旧服务缺少 `SeatMapper` 依赖和 `seatCount` 请求字段。
- 已运行 `mvn -Dtest=StudyTableServiceTest test`，8 个后端桌子服务测试通过。
- 已运行 `npm run test -- App.test.tsx`，28 个前端页面测试通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `npm run test`，前端 56 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已重启本地前端和后端；后端使用临时演示库 `smart_seat_pr21_admin_tables` 跑通 16 个 Flyway 迁移。
- 已用浏览器打开 `http://127.0.0.1:5173/admin/tables`，通过 API 创建 `QA627346` 演示桌，确认后端生成 4 个真实座位；管理员桌子页能看到该桌和“学生视角座位图”，点击 `QA627346 · 1号` 后显示系统座位号 `QA627346-01`。

### 遗留问题
- 本次自动补座位只在桌子没有真实座位时执行；如果未来需要调整已有桌子的座位数量，需要设计单独的座位增删和预约影响确认流程。
- 本地旧演示库仍有 Flyway V15 校验和冲突，演示时已改用新的临时库，未对旧库执行 repair 或重置。

### 对其他成员的影响
- 桌子接口新增可选字段 `seatCount`，旧调用不传仍兼容。
- 本次不修改签到验证、WiFi/IP 校验、签到码校验和后端预约状态机。

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
