# AmorLX 开发日志

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 让学生预约端主要内容框体两端对齐，并作为一组居中显示。

### 本次改动
- 为学生选座页根节点增加居中页面标识，统一管理预约端内容宽度。
- 将室内导航、选座筛选、选择路径、预约概览、预约规则提示和座位预约工作区统一收敛到同一自适应内容轨道。
- 修复预约规则提示自身 `margin` 简写覆盖居中规则的问题，保留原上下间距并恢复左右自动居中。
- 补充页面结构回归测试，防止后续新增框体遗漏统一自适应类名。

### 涉及文件
- frontend/src/App.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "marks student reservation panels as adaptive content frames"`。
- 已运行 `npm run test`，前端 65 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已在浏览器打开 `http://127.0.0.1:5173/student/seats` 测量 6 个主要框体，均为 `left=319`、`right=1179`、`width=860`，页面横向溢出为 0。

### 遗留问题
- 本次只处理学生预约端主流程框体的宽度和居中对齐，不调整管理员端布局。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、数据库迁移和后端状态机。

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 让学生选座页其它主流程框体也跟随内容自动适配，避免仍按整页宽度撑出空白。

### 本次改动
- 为室内导航、选座筛选、选择路径、预约概览、预约规则提示和座位预约工作区统一增加 `student-seat-adaptive-frame` 标记。
- 桌面端主流程框体改为按内容宽度收缩，并为地图/筛选/路径/统计/座位工作区设置最小可读宽度。
- 预约规则提示设置内容宽度上限，避免标签过多时继续撑满整页。
- 移动端断点下统一恢复 `width: 100%` 和 `min-width: 0`，保留手机端单列响应式适配。
- 新增页面级回归测试，防止后续主流程框体丢失自适应标记。

### 涉及文件
- frontend/src/App.test.tsx
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "marks student reservation panels as adaptive content frames"`，确认旧实现缺少统一自适应框体标记。
- 已运行 `npm run test -- App.test.tsx -t "marks student reservation panels as adaptive content frames"`。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`。
- 已运行 `npm run test -- App.test.tsx CampusIndoorMap.test.tsx SeatMap.test.tsx`，47 个聚焦测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run test`，前端 65 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：室内导航约 `720px`、选座筛选约 `800px`、选择路径约 `741px`、统计约 `738px`、规则提示约 `860px`、座位工作区约 `855px`，页面横向溢出为 `0px`。

### 遗留问题
- 本次只统一学生选座页主流程框体宽度适配，没有重新设计整体页面排版或右侧预约面板的信息结构。

### 对其他成员的影响
- 仅影响学生预约端 UI 宽度和语义标签，不修改接口、数据库、签到验证、WiFi/IP 校验、签到码校验和预约状态机。

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 修复坐标画布已收缩后，“选择座位位置”外层框体仍按原工作区宽度铺满的问题。

### 本次改动
- `SeatMap` 在坐标布局模式下为外层 section 增加 `seat-map-section-coordinate` 状态类。
- 坐标布局外层座位框体改为按内容宽度收缩，并保留 `max-width: 100%` 防止移动端横向溢出。
- 新增回归测试，确保坐标座位图会标记外层 section，避免后续样式回退。

### 涉及文件
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- SeatMap.test.tsx`，确认旧实现外层 section 缺少坐标布局状态类。
- 已运行 `npm run test -- SeatMap.test.tsx`，12 个座位图测试通过。
- 已运行 `npm run test`，前端 64 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：外层座位框体宽度约 `519px`，内部房间容器约 `485px`，父级工作区约 `984px`，页面横向溢出为 `0px`。

### 遗留问题
- 本次只修复坐标布局的外层框体宽度，没有重新设计右侧已选座位面板或整体两栏比例。

### 对其他成员的影响
- 仅影响共用 `SeatMap` 的坐标布局显示宽度，不修改接口、数据库、签到验证、WiFi/IP 校验、签到码校验和预约状态机。

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 座位图画布根据实际显示的桌椅外接范围渲染，不再保留大片空白区域。

### 本次改动
- `SeatMap` 坐标布局新增内容边界归一化：在缩放、兜底定位和碰撞避让后，按完整桌椅外接矩形整体平移到画布左上角附近。
- 坐标画布宽高改为由桌椅外接范围加少量安全边距计算，不再使用固定最小房间宽高撑开。
- 坐标视口和外层房间容器改为按内容宽度收缩，同时保留最大宽度和内部滚动能力。
- 新增回归测试，覆盖源坐标离原点很远时，渲染后的桌椅仍从紧凑画布边距开始。
- 新增设计说明和实施计划，记录本次只调整共享座位图渲染，不改接口、数据库和签到闭环。

### 涉及文件
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-25-seat-map-content-bounds-design.md
- docs/plans/2026-05-25-seat-map-content-bounds.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- SeatMap.test.tsx`，确认旧实现会让远离原点的桌子保留大块空白。
- 已运行 `npm run test -- SeatMap.test.tsx`，11 个座位图测试通过。
- 已运行 `npm run test`，前端 63 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：座位图内容从 `24px` 安全边距开始，画布和外层房间容器按 T01-T10 内容收缩，不再保留大片空白。

### 遗留问题
- 本次没有实现根据浏览器容器动态改变默认缩放，只收缩画布内容边界。
- 如果后续管理员希望保留真实房间墙面比例，需要新增“房间尺寸模式”和“内容适配模式”的切换。

### 对其他成员的影响
- `SeatMap` 是学生端和管理员学生视角共用组件，两处都会获得更紧凑的坐标画布。
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、桌码签到、预约状态机、后端接口和数据库迁移。

## 2026-05-24

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 调整座位图缩放和演示显示效果，让默认演示区域至少展示 10 张桌子，按两列五行排列。

### 本次改动
- 学生/管理员共用的 `SeatMap` 坐标布局改为更紧凑的显示比例，默认适配缩放为 90%。
- 收紧坐标画布边距和定位桌子的左右座位区宽度，减少大房间演示时的空白。
- 新增 10 桌布局回归测试，固定 T01-T10 需要渲染为 2 列 x 5 行，并保持默认画布尺寸可控。
- 新增 Flyway V17 演示数据迁移，将 `Library Area A` 扩展为 T01-T10，每桌 4 个座位，座号从 1 到 4。
- V17 同时为演示区补齐当天和次日 08:00-22:00 的完整开放窗口，方便本地 demo 直接看到 40 个可预约座位。
- 新增设计说明和实施计划，记录本次只调整座位图和演示数据，不改签到验证闭环。

### 涉及文件
- backend/src/main/resources/db/migration/V17__expand_library_demo_seat_map.sql
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-24-seat-map-ten-table-density-design.md
- docs/plans/2026-05-24-seat-map-ten-table-density.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- SeatMap.test.tsx`，确认旧实现默认 100% 且 10 桌画布过高。
- 已运行 `npm run test -- SeatMap.test.tsx`，10 个座位图测试通过。
- 已运行 `npm run test`，前端 62 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已重启本地后端到临时库 `smart_seat_ui_preview`，确认 Flyway V17 成功执行，`Library Area A` 为 T01-T10、每桌 4 座。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证：桌面端 T01-T10 为两列五行、默认 90%；手机宽度 `390x844` 下无横向溢出。

### 遗留问题
- 本次只扩展 `Library Area A` 的 demo 数据；真实楼栋/区域的桌数仍需要管理员在桌子管理里维护。
- 当前只是座位图显示密度优化，没有做自动根据容器宽度计算最佳缩放。

### 对其他成员的影响
- 新增后端迁移版本 V17，后续新增 Flyway 迁移需从 V18 开始。
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、桌码签到、预约状态机和管理员释放流程。
- `SeatMap` 默认缩放从 100% 调为 90%，学生端和管理员学生视角座位图都会更紧凑。

## 2026-05-23

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 继续完善学生预约端 UI，让楼层、区域、预约时段和具体座位选择形成一套连续的响应式流程。

### 本次改动
- `CampusIndoorMap` 支持页面控制当前楼层，并在切换楼层时回传该楼层可见区域。
- 学生选座页新增 `选座筛选` 面板，把区域、日期、开始时间、结束时间和刷新座位集中到地图下方。
- 切换楼层时，如果当前区域不属于该楼层，会自动切到该楼层第一个可见区域，座位图随之加载对应区域。
- 右侧已选座位面板改为确认座位、状态和当前时段，避免时间选择藏在选座之后。
- 补充移动端响应式样式，手机宽度下筛选表单单列展示，侧栏回到正常文档流。
- 新增设计说明和实施计划，明确本阶段只做预约端 UI，不改签到验证和后端状态机。

### 涉及文件
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-23-student-seat-mobile-flow-design.md
- docs/plans/2026-05-23-student-seat-mobile-flow.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- CampusIndoorMap.test.tsx App.test.tsx`，确认旧实现缺少楼层回调和顶层时间筛选。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx App.test.tsx`，34 个聚焦前端测试通过。
- 已运行 `npm run test`，前端 61 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats` 验证学生页：桌面端能看到室内导航、选座筛选、选择路径和座位图；手机宽度 `390x844` 下无横向溢出，筛选表单单列展示。
- 本地预览使用临时库 `smart_seat_ui_preview` 和临时 Redis 容器 `smart-seat-redis-preview`，避免修改旧开发库的 Flyway 状态。

### 遗留问题
- 当前只优化学生端预约页；管理员端若后续要做完整楼层筛选联动，可复用 `CampusIndoorMap` 的受控楼层能力。
- 本地默认库存在历史 Flyway V15 校验和不一致问题，预览时使用临时库绕开；若要继续使用旧库，需要团队确认后再执行 Flyway repair 或重建本地库。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、签到时间窗、预约状态机和后端接口。
- `CampusIndoorMap` 新增可选 props，旧调用方式仍兼容；其他页面可以继续只传 `areas`、`selectedAreaId` 和 `onSelectArea`。

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
