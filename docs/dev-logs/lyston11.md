# lyston11 开发日志

## 2026-05-19

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 继续缩小桌位图桌子尺寸，并在管理员新增/编辑桌子时提供二人桌、三人桌、四人桌默认参数。

### 本次改动
- 桌位平面图整体继续缩小，四人桌、三人桌、二人桌、单人桌和未配置桌都按更紧凑的视觉比例渲染，便于一个区域展示更多桌子。
- 学生端真实座位地图同步缩小坐标桌，桌面和周围座位区域都按展示比例压缩，避免桌子占据过多空间。
- 管理员桌子弹窗新增桌型预设：`2人桌`、`3人桌`、`4人桌`、`自定义`。
- 新增桌子默认使用 `4人桌` 参数；切换预设会立即应用对应默认宽高并刷新实时预览。
- 默认预设模式隐藏 `桌宽 px`、`桌高 px`、`旋转角度`，仅在选择 `自定义` 时展示，减少管理员理解像素参数的负担。
- 桌子列表将“桌面尺寸”调整为“桌型”，优先按 active 座位数显示二/三/四人桌，未配置时按尺寸预设或自定义显示。
- 补充测试覆盖桌子缩小后的渲染尺寸、学生端坐标桌缩放，以及管理员桌型预设默认隐藏自定义尺寸字段。

### 涉及文件
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、22 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过且无告警。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/admin/tables` 验证：桌子缩小，主页面展示“桌型”列，新增弹窗默认选中 `4人桌`，有 `2人桌`、`3人桌`、`4人桌`、`自定义` 预设，默认不展示 px 字段，切换 `自定义` 后才展示 `桌宽 px`、`桌高 px`、`旋转角度`。

### 遗留问题
- 预设目前负责桌面尺寸和预览座位数，不自动创建座位；如果需要“一键创建 2/3/4 个座位”，后续应作为显式批量生成座位功能开发，避免座位编号冲突。

### 对其他成员的影响
- 后端接口和数据库结构未变，桌型预设只在前端转成现有 `widthPx/heightPx/rotationDeg` 字段提交。
- 主平面图仍按真实 active 座位数识别桌型，座位未配置的桌子会按尺寸预设给出列表文案，但平面图会提示“未配置座位”。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 继续优化桌位平面图，移除硬编码场地元素，合理压缩桌子显示，并区分二人桌、三人桌、四人桌等桌型。

### 本次改动
- 桌位平面图移除固定写死的“入口 / 采光窗 / 服务台”，避免展示不存在的场地设施。
- 平面图新增缩放舞台，根据桌位范围自动压缩到可视区域，避免桌子过大或区域无法一次性观察。
- 桌子视觉尺寸从数据库保存尺寸中解耦，预览会按桌型采用更适合管理界面的尺寸，保存仍沿用原有 `positionX/positionY/widthPx/heightPx` 数据。
- 管理员桌位图会读取当前区域座位数量，按 active 座位数显示 `2人桌`、`3人桌`、`4人桌`、`单人桌` 或 `未配置座位`。
- 不同桌型使用不同轮廓：二人桌偏圆角胶囊形，三人桌三角形，四人桌矩形，并用座位小圆点表达座位分布。
- 学生端座位地图同步移除固定“入口 / 采光窗 / 服务台”，避免前后体验不一致。
- 补充测试覆盖桌型文案、二人桌样式、无硬编码场地元素，以及管理员页面加载座位后展示桌型。

### 涉及文件
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、21 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过且无告警。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/admin/tables` 验证：桌位图展示 `4人桌` 和 `未配置座位`，且不再展示“入口 / 采光窗 / 服务台”。

### 遗留问题
- 当前桌型根据座位数量推断，后续如果需要更精细的圆桌、吧台、沙发位等类型，建议后端新增 `tableType` 字段。

### 对其他成员的影响
- 管理员桌位图会额外请求 `/api/seats?areaId=...` 来统计桌型；后端接口无变化。
- 平面图不再展示硬编码设施，若后续确实需要入口、窗户等设施，应该作为可配置场地元素建模，而不是写死在前端。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 修正管理员桌子位置编辑体验，避免要求管理员手填 `X/Y 坐标`，改为平面图拖拽式布局管理。

### 本次改动
- 桌子管理列表移除“平面坐标”列，不再在管理界面暴露像素坐标。
- 区域桌位平面图支持直接拖动桌子调整位置，拖动后显示待保存数量，并提供“保存布局”“撤销调整”操作。
- 拖拽位置按 10px 网格吸附并限制在平面图范围内，避免桌子被拖出可视区域。
- 桌位平面图支持键盘方向键微调位置，兼顾无鼠标操作。
- 编辑/新增桌子弹窗移除 `X 坐标`、`Y 坐标` 输入框，保留桌号、名称、行列、展示顺序、桌面尺寸、旋转角度、状态等业务字段。
- 编辑弹窗实时预览也支持拖动桌子调整位置，内部仍复用后端 `positionX/positionY` 字段保存，不改数据库结构。
- 补充组件测试覆盖拖拽移动、键盘移动；补充页面测试覆盖拖动桌子后保存布局调用现有更新接口，并确认页面不再展示“平面坐标”。

### 涉及文件
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、20 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过且无告警。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/admin/tables` 验证：桌子列表不再展示“平面坐标”，页面无 `X 坐标` / `Y 坐标` 输入，方向键微调 T01 后出现“有 1 张桌子待保存”。

### 遗留问题
- 当前拖拽保存仍是逐张桌子调用现有 `PUT /api/tables/{id}`；后续如桌子数量大，可以补后端批量保存布局接口。

### 对其他成员的影响
- 后端接口和数据库字段未变，已有 `positionX/positionY` 数据继续有效。
- 管理员以后调整桌位主要通过平面图拖拽完成，坐标不再作为表单输入项展示。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 优化管理员开放时段批量发布交互，解决座位逐个选择效率低、时间段模板不清晰的问题。

### 本次改动
- 管理员开放时段页从单行表单升级为批量发布工作区，拆分为基础信息、开放时间、发布座位和发布预览。
- 开放时间新增“上午 / 下午 / 晚间 / 全天常用”快捷模板，仍保持半小时步进，并在前端校验空时段、重复时段、结束早于开始和超过 12 段。
- 座位选择新增“全选当前区域座位”“清空”和按桌选择按钮，管理员可以按 T01/T02 等桌号批量选中或反选座位。
- 座位下拉按桌分组，选项显示 `桌号 · 座位编号 (标签)`，同时过滤历史 `LEGACY` 桌位，避免开发遗留数据出现在发布范围。
- 发布前展示预计发布数量，按“已选座位数 x 有效时间段数”计算，便于比赛演示时解释批量生成逻辑。
- 开放时段列表的座位列从裸座位 ID 改为展示真实座位编号和桌号，减少管理员排查成本。
- 补充前端测试，覆盖按桌批量选座、应用快捷时间模板并提交 `periods + seatIds` 的发布 payload。

### 涉及文件
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、17 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过且无告警。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/admin/seat-slots` 验证：页面展示批量发布工作区，点击“晚间”和 T01 后显示 `T01 4/4`、`已选 4 / 16 个座位`、`预计发布 4 个座位时段`。

### 遗留问题
- 当前按桌批量选择基于已有桌号分组；后续如果做拖拽式平面图发布，可以继续把桌面布局预览嵌入开放时段页。

### 对其他成员的影响
- 本次未改后端接口，继续复用 `/api/seat-slots/publish` 的 `periods` 和 `seatIds` 批量发布能力。
- 管理员端发布座位时不再展示 `LEGACY` 开发兜底桌，真实数据维护仍以桌子管理和座位管理页为准。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 修复管理员桌子管理页显示问题，避免操作列被裁剪和历史 `LEGACY` 桌位干扰平面图。

### 本次改动
- 管理员桌子列表隐藏 `LEGACY` 开发兜底桌，只展示真实维护桌子 T01-T04。
- 管理员桌子平面图同步过滤 `LEGACY`，避免其与 T01 坐标重叠导致桌子叠在一起。
- 桌子列表移除冗余区域 ID 列，压缩列宽，并将操作列固定到右侧，保证“编辑 / 签到码 / 停用”完整可见。
- 表格容器从裁剪改为可滚动，避免宽表格在窄屏或浏览器缩放下截断右侧操作。
- 新增 `V10__disable_legacy_demo_tables.sql`，把历史 `LEGACY` 桌子置为停用，避免新环境继续出现遗留演示桌。
- 补充桌位平面图测试，覆盖 `LEGACY` 桌不会出现在预览中的场景。

### 涉及文件
- backend/src/main/resources/db/migration/V10__disable_legacy_demo_tables.sql
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、16 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/admin/tables` 验证：表格只显示 T01-T04，操作列完整可见，平面图没有 `LEGACY` 重叠桌。

### 遗留问题
- 已存在本地数据库需要应用 V10 后才会把 `LEGACY` 表记录置为停用；前端已同时过滤，未迁移前也不会再影响页面展示。

### 对其他成员的影响
- 管理员桌子管理页默认不再展示 `LEGACY` 开发兜底桌；如需排查历史数据，可直接查数据库或临时调整过滤。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 收紧学生端预约时间规则，避免分钟级自由输入，并限制学生只能预约当天。

### 本次改动
- 学生选座页日期从可选日期控件改为只读今日日期，学生端不能再选择明天或未来日期。
- 已选座位面板的开始/结束时间从原生 time 输入改为半小时档位下拉，时间只能选择 `08:00`、`08:30`、`09:00` 这类整点/半点。
- 前端规则提示更新为“仅支持预约当天”和“时间最小粒度为半小时”。
- 后端预约服务新增强校验：自定义预约必须是当天，开始/结束时间必须落在整点或半点，绕过前端直接调接口也会被拒绝。
- 后端引入统一 `Clock` Bean，预约服务测试使用固定时间，保证当天预约规则可稳定测试。
- 补充后端测试覆盖非当天预约、非半小时粒度预约的拒绝场景；更新前端测试使用半小时下拉完成预约。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/config/TimeConfig.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationService.java
- backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- frontend/src/test/setup.ts
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、15 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 45 个测试通过。
- 已运行 `git diff --check`，通过。
- 已在浏览器打开 `http://127.0.0.1:5174/student/seats` 验证：日期只显示今日，开始/结束时间为半小时下拉选择。

### 遗留问题
- 管理员端开放时段目前仍可按更细时间发布；学生端预约已收紧为半小时，后续可同步给管理员端时间范围也加半小时步进。

### 对其他成员的影响
- 学生端预约 API 现在会拒绝非当天或非整点/半点的自定义预约请求。
- `ReservationService` 构造函数新增 `Clock` 依赖，测试或手动实例化该服务时需要传入时间源。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 修复学生端选座流程和座位平面图展示问题，让学生按“先选位置，再选时间”完成预约，并展示多张真实桌位。

### 本次改动
- 学生选座页从顶部选择时间改为右侧座位详情面板选择时间，主流程调整为先选区域/日期，再在座位地图中选择位置，最后选择开始/结束时间并预约。
- 座位地图新增当前选中座位高亮，未开放座位允许点击查看位置和状态，但预约按钮保持禁用并提示等待管理员开放。
- 修复坐标桌位布局，桌面外层容器会预留上下左右座位空间，避免一张桌四个座位和桌面错位或挤压。
- 座位图对坐标冲突和 `LEGACY` 开发遗留桌位做兜底归位，避免历史演示数据覆盖正式桌位。
- 新增 `V9__add_demo_room_tables.sql` 演示数据迁移，为 `Library Area A` 补齐 T01-T04 四张桌、16 个 active 真实座位，并下线 `A-DEV-%` / `B-DEV-%` 开发座位。
- 学生端不再默认自动选中第一个座位，页面初始态会提示“请先在座位地图中选择一个位置”。
- 更新前端测试，覆盖新预约流程和坐标桌位偏移后的布局断言。

### 涉及文件
- backend/src/main/resources/db/migration/V9__add_demo_room_tables.sql
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- frontend/src/components/SeatMap.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、15 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 43 个测试通过。
- 已用真实本地后端接口验证 `Library Area A` 返回 16 个 active 座位，T01/T02/T03/T04 每张桌 4 个座位。
- 已在浏览器打开 `http://127.0.0.1:5174/student/seats` 验证学生端显示 4 张桌、16 个座位，初始状态未自动选座，右侧提示先选择位置。

### 遗留问题
- 当前日期如果管理员没有开放时段，座位会显示“未开放”，比赛演示前建议由管理员发布当天或未来日期的常用开放时段。
- 后续可以继续把桌位编辑器升级为拖拽式，让管理员直接拖桌子调整平面图。

### 对其他成员的影响
- 学生端选座交互已变更为“点座位只选中，不立即预约”；真正创建预约需要点击右侧“预约该座位”。
- 演示数据库会新增多张桌和更多真实座位，旧的 `A-DEV-%` / `B-DEV-%` 开发座位会被置为 `INACTIVE`。

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 修复学生端和管理员端数据“不互通、像 mock”的问题，打通真实区域、桌子、座位、开放时段、预约和看板状态链路。

### 本次改动
- 学生端座位页改为同时读取 `/api/seat-slots` 和 `/api/seats`，以数据库真实座位作为座位地图基础。
- 当管理员已维护真实座位但当前日期/时段未开放时，学生端不再显示空白，而是显示真实座位并标记为“未开放”且不可预约。
- 后端开放 `GET /api/seats` 给学生和管理员共同读取，座位新增返回桌位行列、坐标、尺寸、旋转等布局字段。
- 前端座位地图新增 `UNPUBLISHED` 状态，支持真实座位未开放展示，并把统计口径调整为不把“未开放”算作占用。
- 修复学生签退/取消接口契约，`POST /api/reservations/{id}/check-out` 和 `/cancel` 支持无请求体，避免前端空 body 调用触发 500。
- 全局异常处理新增未处理异常日志，并把请求体缺失/不可读统一返回 400，方便开发阶段定位问题。
- 补充前端测试，覆盖“真实座位存在但没有开放时段时显示未开放座位”的学生端场景。
- 使用真实本地后端跑通管理员发布时段、学生预约、管理员看板统计、学生取消释放的完整联动链路。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/common/GlobalExceptionHandler.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationController.java
- backend/src/main/java/com/lyston/smartseat/seat/
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/constants/seatSlotStatus.ts
- frontend/src/types/seat.ts
- frontend/src/App.test.tsx
- frontend/src/components/SeatMap.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端 3 个测试文件、15 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 43 个测试通过。
- 已用真实 API 冒烟验证：学生读取真实区域和座位，管理员发布 `2026-05-23 18:00-20:00`，学生预约后座位状态变为 `RESERVED` 且看板活跃预约为 1，学生取消后座位回到 `AVAILABLE` 且看板活跃预约为 0。

### 遗留问题
- 现在学生端会展示真实未开放座位，但管理员侧还可以继续加“一键开放今日/明日常用时段”，减少比赛演示时手动选择座位和时间段的步骤。
- 本次真实联调产生的临时预约已通过正式取消接口清理；未来如做自动 E2E，建议使用独立测试库或专门 demo seed 接口。

### 对其他成员的影响
- 学生端座位地图现在依赖 `/api/seats` 返回桌位布局字段，后端调整座位响应结构时需要同步前端 `Seat` 类型。
- `UNPUBLISHED` 是前端合成状态，不会写入数据库；后端真实状态仍是 `AVAILABLE`、`RESERVED`、`USING`、`ABNORMAL`。
- 签退/取消接口无需请求体，前端可以直接按空 body 或无 body 调用。

## 2026-05-18

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 继续增强学生端预约管理能力，补齐筛选、详情、签到倒计时和首页快捷处理体验。

### 本次改动
- 我的预约页新增状态筛选和日期筛选，预约记录多起来后可以按待签到、使用中、已完成、已取消、已过期快速定位。
- 我的预约页新增预约详情弹窗，集中展示区域、楼层、桌号、座位编号、预约日期、时间段、签到码和签到截止时间。
- 预约详情弹窗和活跃预约卡片复用同一套签到、签退、取消操作入口，操作成功后自动刷新列表。
- 待签到预约新增签到倒计时，剩余 5 分钟内自动红色高亮，已超时会显示超过签到截止。
- 学生首页新增今日预约时间线，按开始时间排序展示当天预约，并提供快速签到/签退。
- 学生首页新增最近常用区域统计，按预约次数展示常用学习区域。
- 抽取并复用预约筛选、日期、倒计时、排序等展示工具，保持学生首页和我的预约页的状态文案一致。
- 稳定前端测试环境中的 `ResizeObserver` mock，避免 Ant Design 下拉组件测试时被全局清理影响。

### 涉及文件
- frontend/src/pages/MyReservationsPage.tsx
- frontend/src/pages/StudentHomePage.tsx
- frontend/src/utils/reservationDisplay.ts
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- frontend/src/test/setup.ts
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run test`，前端 3 个测试文件、13 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 43 个测试通过。
- 已运行 `git diff --check`，通过。
- 已启动前端临时服务到 `5174` 端口做冒烟检查，未使用 `8080`；登录接口 `POST /api/auth/login` 返回成功。

### 遗留问题
- 学生端筛选目前在前端本地完成，后续预约记录量很大时可扩展为后端分页和服务端筛选。
- 预约详情目前采用弹窗形态，后续如果要支持分享或扫码入口，可升级为独立详情路由。

### 对其他成员的影响
- 本次未新增后端接口和数据库字段，主要是前端体验增强。
- 预约状态中文文案统一在 `reservationDisplay.ts` 维护，后续新增状态时需要同步筛选选项和颜色。

## 2026-05-18

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 继续增强学生端，让学生首页、选座、预约管理形成完整可演示闭环。

### 本次改动
- 新增学生首页 `/student/home`，展示当前活跃预约、最近预约记录、签到宽限和可提前预约天数。
- 登录后学生默认进入学生首页，侧边栏新增“学生首页”入口。
- 学生选座页新增可预约/已占用统计卡片，并把当前预约从内部 ID 输入框升级为可读的座位、区域、桌号、时间和签到截止信息。
- 我的预约页从简单表格升级为预约管理页，支持在活跃预约卡片里直接签到、签退和取消。
- 后端预约响应补充 `seatNo`、`seatLabel`、`tableNo`、`areaName`、`floor`、`slotDate`、`startTime`、`endTime`，前端不再只能展示座位 ID 和时段 ID。
- 抽取预约状态、时间和位置展示工具，学生端页面复用同一套中文状态和格式化逻辑。
- 补充前端测试，覆盖学生首页活跃预约展示和我的预约页直接签到。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java
- frontend/src/App.tsx
- frontend/src/App.test.tsx
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/LoginPage.tsx
- frontend/src/pages/StudentHomePage.tsx
- frontend/src/pages/MyReservationsPage.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/types/reservation.ts
- frontend/src/utils/reservationDisplay.ts
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端 3 个测试文件、12 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 43 个测试通过。

### 遗留问题
- 学生首页目前是预约概览和快捷入口，后续可继续补常用区域收藏、学习时长统计和签到提醒。
- 我的预约页仍保留表格历史记录，后续可增加按状态/日期筛选。

### 对其他成员的影响
- `GET /api/reservations` 和预约创建/签到/签退/取消响应新增展示字段，旧字段保持兼容。
- 前端学生端路由默认入口调整为 `/student/home`，原 `/student/seats` 仍可直接访问。

## 2026-05-18

### 任务
- Issue: 暂无
- 分支: feature/lyston11-visual-table-layout-editor
- 目标: 在最新 `main` 基础上继续完善管理员桌位可视化维护能力，让桌子坐标、尺寸和旋转角度有直观预览。

### 本次改动
- 新增 `TableLayoutPreview` 组件，按桌子坐标、尺寸和旋转角度渲染区域桌位平面图。
- 管理员桌子管理页新增“区域桌位平面图”，支持点击平面图中的桌子直接进入编辑。
- 桌子新增/编辑弹窗增加实时预览，管理员修改 X/Y 坐标、桌面尺寸和旋转角度时可以即时看到布局变化。
- 新增桌位平面图组件测试，覆盖坐标渲染、选中状态、停用桌子隐藏和点击选择。

### 涉及文件
- frontend/src/components/TableLayoutPreview.tsx
- frontend/src/components/TableLayoutPreview.test.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端 3 个测试文件、10 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run build`，前端生产构建通过。
- 已在 `backend` 目录运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 43 个测试通过。
- 已运行 `git diff --check`，通过。

### 遗留问题
- 当前仍是坐标输入 + 预览模式，后续可继续升级为拖拽式桌位编辑器。
- 平面图暂不支持墙体、柱子、门窗自定义维护；比赛演示可以先用固定房间元素表达空间感。

### 对其他成员的影响
- 没有新增后端接口或数据库字段，复用已有 `tables.positionX / positionY / widthPx / heightPx / rotationDeg`。
- 管理员维护桌位时建议同步维护真实坐标和尺寸，学生端选座平面图会复用这些数据。

## 2026-05-18

### 任务
- Issue: 暂无
- 分支: feature/codex-table-checkin-impl
- 目标: 支持真实长桌坐标布局和学生自选预约起止时间。

### 本次改动
- `areas` 新增每日开放开始/结束时间，管理员区域管理页可维护 `openTime` 和 `closeTime`。
- `tables` 新增平面图坐标、尺寸和旋转角字段，管理员桌子管理页可维护桌子位置和长方形桌面尺寸。
- 学生选座页新增开始时间、结束时间输入，默认使用当前区域开放时段，可最长选择完整开放日。
- 预约接口兼容原 `seatSlotId` 预约，并新增 `seatId + slotDate + startTime + endTime` 自选时段预约。
- 后端会校验自选时段落在管理员发布的可用窗口和区域开放时间内，拒绝座位重叠活跃占用，并为成功预约创建或复用精确座位时段。
- 签到过期时间改为基于 `slotDate + startTime + checkinGraceMinutes` 计算，避免未来预约刚创建就过早过期。
- 学生端座位图优先使用桌子坐标渲染真实平面图，长桌支持上方两个座位、下方两个座位的布局。
- V8 迁移为演示数据补充桌子坐标，并把 A 区四个演示座位调整为 `NORTH/NORTH/SOUTH/SOUTH`。
- API 示例文档补充区域开放时间、桌子坐标字段和自选时间预约示例。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/area/
- backend/src/main/java/com/lyston/smartseat/table/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/resources/db/migration/V8__add_coordinate_layout_and_open_hours.sql
- backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java
- frontend/src/components/SeatMap.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/pages/AdminAreasPage.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/api/
- frontend/src/types/seat.ts
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- frontend/src/components/SeatMap.test.tsx
- docs/API_EXAMPLES.md
- docs/plans/2026-05-18-layout-and-flexible-time-design.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dtest=ReservationServiceTest test`，预约服务 16 个测试通过。
- 已运行 `mvn test`，后端 42 个测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端 2 个测试文件、9 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，不影响通过结果。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 桌子位置当前通过数字坐标维护，后续可继续做拖拽式平面图编辑器和批量导入。
- 自选时间依赖管理员先发布覆盖该日期、座位和时间范围的可用窗口；后续如要完全按区域开放时间自动开放，可再加后台自动生成或虚拟窗口逻辑。

### 对其他成员的影响
- 座位时段响应新增 `tablePositionX`、`tablePositionY`、`tableWidthPx`、`tableHeightPx`、`tableRotationDeg`，前端座位图会优先使用这些字段。
- 新增区域时建议设置 `openTime` / `closeTime`；不传时后端默认 `08:00:00` 到 `22:00:00`。
- 新增桌子时建议维护坐标和尺寸；不传时后端默认 `80,80,220,96,0`。
- 调整预约创建逻辑时要保留学生重叠预约、座位重叠预约、开放窗口和提前预约天数校验。

## 2026-05-18

### 任务
- Issue: Task 9
- 分支: feature/codex-table-checkin-impl
- 目标: 补充桌子资源、桌码签到和具体桌位座位字段的 API 与架构文档。

### 本次改动
- API 手测文档补充座位时段响应中的桌子/座位布局字段说明。
- API 手测文档新增桌子列表、新增、编辑、状态更新和固定签到二维码接口示例。
- API 手测文档更新座位新增/编辑示例，加入 `tableId`、`seatLabel`、`seatSide`、`seatOrder`。
- API 手测文档新增 `POST /api/reservations/table-check-in` 桌码签到示例和校验说明。
- 架构文档补充 `areas -> tables -> seats -> seat_slots -> reservations` 资源层级。
- 架构文档说明固定桌码只证明物理桌子位置，动态签到码继续证明预约归属。

### 涉及文件
- docs/API_EXAMPLES.md
- docs/architecture/ARCHITECTURE.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。
- 文档为 Markdown 说明，无额外构建步骤。

### 遗留问题
- 后续如增加桌码批量打印、桌子级统计或区域差异化预约规则，需要继续同步 API 与架构文档。

### 对其他成员的影响
- 后续接口示例应以 `tables` 作为座位资源的上层实体，不再只用 `seats.tableNo` 这类松散字段表达桌子。
- 桌码签到文档明确要求 `tableQrToken + checkinCode` 双凭证校验，后续改动不要绕过预约码校验。

## 2026-05-18

### 任务
- Issue: Task 8
- 分支: feature/codex-table-checkin-impl
- 目标: 添加管理员桌子管理和固定桌码入口，并把座位管理升级为选择具体桌子的具体座位。

### 本次改动
- 新增管理员桌子管理页 `/admin/tables`，支持按区域查询桌子、新增/编辑桌号、名称、布局行列、展示顺序和状态。
- 桌子管理页新增固定签到码弹窗，通过 `GET /api/tables/{id}/checkin-qr` 获取桌码链接并使用 Ant Design QRCode 展示。
- 管理员菜单和路由新增“桌子管理”，继续放在 `RoleRoute allowedRoles={['ADMIN']}` 下。
- 座位管理页新增所属桌子、桌上标签、桌边方位和同侧顺序字段，新增/编辑座位会提交 `tableId`、`seatLabel`、`seatSide`、`seatOrder`。
- 座位管理页切换区域时同步刷新桌子下拉和座位列表，避免跨区域选错桌子。
- 修复桌码签到页 token 切换成功态的 React hooks lint 问题。
- 补充/修复前端测试，覆盖管理员桌子管理路由、登录后回到桌码签到页、SeatMap 旧数据兜底清理。

### 涉及文件
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/pages/AdminSeatsPage.tsx
- frontend/src/App.tsx
- frontend/src/layout/AppLayout.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/pages/TableCheckinPage.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm install --cache .npm-cache`，恢复前端本地依赖；随后已删除临时 `.npm-cache`。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端 2 个测试文件、6 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle`，但不影响通过结果。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。

### 遗留问题
- 桌子二维码当前在弹窗中展示和复制链接，后续可补导出打印版 PDF 或批量打印入口。
- 座位管理仍保留区域平面行列字段；真实房间如果需要 CAD 级布局，后续可继续扩展桌子/障碍物坐标。

### 对其他成员的影响
- 管理员新增座位现在必须先创建并选择所属桌子，后端会校验桌子属于同一区域且启用状态可承载启用座位。
- 普通桌子列表仍不暴露 `qrToken`，固定桌码必须通过管理员二维码接口获取。
- 学生端可视化选座依赖 `seatLabel`、`seatSide`、`seatOrder` 来呈现具体桌边座位，新增座位时应认真维护这些字段。

## 2026-05-18

### 任务
- Issue: Task 7 follow-up
- 分支: feature/codex-table-checkin-impl
- 目标: 修复桌码签到未登录跳转后丢失 `token` 的真实扫码登录流程，并补充页面鲁棒性。

### 本次改动
- `ProtectedRoute` 未登录跳转 `/login` 时，通过 router state 保留原始 `pathname + search`。
- 登录成功后优先跳回安全的内部 `location.state.from`，否则继续使用学生/管理员默认入口。
- 桌码签到页在 URL token 变化时重置成功状态，避免切换二维码后停留在旧签到成功页。
- 补充前端回归测试，覆盖未登录访问 `/student/table-checkin?token=...` 后登录返回原桌码签到页。

### 涉及文件
- frontend/src/App.tsx
- frontend/src/pages/LoginPage.tsx
- frontend/src/pages/TableCheckinPage.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已尝试运行 `npm run test -- App.test.tsx`，失败于 `vitest: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run lint`，失败于 `eslint: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run test`，失败于 `vitest: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run build`，失败于 `tsc: not recognized`，当前前端依赖/可执行文件不完整。
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。

### 遗留问题
- 当前无法在本地完成自动化 lint/test/build 验证，需要恢复前端依赖后重新运行。

### 对其他成员的影响
- 未登录扫码进入桌码签到页时，登录后会回到原始 `/student/table-checkin?token=<tableQrToken>`。

## 2026-05-18

### 任务
- Issue: Task 7
- 分支: feature/codex-table-checkin-impl
- 目标: 添加学生端桌码签到页面，支持扫描 `/student/table-checkin?token=<tableQrToken>` 后输入签到码完成签到。

### 本次改动
- 新增 `TableCheckinPage`，读取 URL 中的 `token`，展示缺少 token、输入签到码、提交 loading、签到成功和后续导航状态。
- 桌码签到提交调用 `tableCheckInReservation({ tableQrToken: token, checkinCode })`，后端错误通过 Ant Design message 展示。
- 新增受保护路由 `/student/table-checkin`，并补充布局标题“桌码签到”。
- 补充前端路由测试，覆盖 token 和签到码提交到 `/api/reservations/table-check-in` 的请求体。

### 涉及文件
- frontend/src/pages/TableCheckinPage.tsx
- frontend/src/App.tsx
- frontend/src/layout/AppLayout.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已尝试运行 `npm run lint`，失败于 `eslint: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run test -- App.test.tsx`，失败于 `vitest: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run test`，失败于 `vitest: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run build`，失败于 `tsc: not recognized`，当前前端依赖/可执行文件不完整。
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。

### 遗留问题
- 当前无法在本地完成自动化 lint/test/build 验证，需要恢复前端依赖后重新运行。

### 对其他成员的影响
- 新增学生端受保护路由 `/student/table-checkin`，桌面二维码路径可继续使用 `/student/table-checkin?token=<tableQrToken>`。
- 桌码签到页依赖 `frontend/src/api/seatSlots.ts` 中的 `tableCheckInReservation` 和后端 `/api/reservations/table-check-in`。

## 2026-05-18

### 任务
- Issue: Task 6
- 分支: feature/codex-table-checkin-impl
- 目标: 构建学生端可视化桌位-座位地图，按时间段和桌位展示具体座位。

### 本次改动
- `SeatMap` 改为先按时间段分组，再按桌位分组，兼容无桌位历史座位的兜底分组。
- 桌位内座位按方位、顺序和座位号排序，支持 NORTH/WEST/EAST/SOUTH/SINGLE 位置展示。
- 座位按钮继续复用既有状态颜色和文案，非空闲座位禁用，空闲座位点击后调用 `onReserve(slot.id)`。
- 保留入口、采光窗、服务台等房间提示，并补充组件测试覆盖桌位分组、座位排序、禁用和预约点击。

### 涉及文件
- frontend/src/components/SeatMap.tsx
- frontend/src/components/SeatMap.test.tsx
- frontend/src/styles/main.css

### 验证方式
- 已尝试运行 `npm run lint`，失败于 `eslint: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run test`，失败于 `vitest: not recognized`，当前前端依赖/可执行文件不完整。
- 已尝试运行 `npm run build`，失败于 `tsc: not recognized`，当前前端依赖/可执行文件不完整。
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。

### 遗留问题
- 当前无法在本地完成自动化 lint/test/build 验证，需要恢复前端依赖后重新运行。

### 对其他成员的影响
- 学生端座位地图现在优先使用桌位字段 `tableId`、`tableNo`、`tableRowNo`、`tableColumnNo`、`tableDisplayOrder` 和座位方位字段；后端不要删除这些响应字段。

## 2026-05-18

### 任务
- Issue: Task 5
- 分支: feature/codex-table-checkin-impl
- 目标: 添加前端桌位类型和 API 封装，为后续桌位管理与桌码签到页面做类型/API 准备。

### 本次改动
- 新增 `StudyTable`、`StudyTableQr` 和桌位状态类型，普通桌位列表类型不包含 `qrToken`。
- 扩展 `Seat`、`SeatSlot`、座位创建/更新 payload，加入桌位和单座布局字段。
- 新增 `tables` API 封装，支持桌位列表、新增、编辑、状态更新和获取签到二维码。
- 新增桌码签到 API，调用 `/api/reservations/table-check-in`。

### 涉及文件
- frontend/src/types/seat.ts
- frontend/src/types/reservation.ts
- frontend/src/api/tables.ts
- frontend/src/api/seatSlots.ts
- frontend/src/api/seats.ts

### 验证方式
- 已运行 `npm run build`，失败于 `tsc: command not found`，当前前端依赖/可执行文件不完整。
- 已运行 `git diff --check`，通过；仅提示工作区文件后续会被 Git 转为 CRLF。

### 遗留问题
- 本任务只补类型和 API；桌位管理、桌码签到 UI 后续任务实现。

### 对其他成员的影响
- 后续前端桌位 UI 应复用 `frontend/src/api/tables.ts` 和 `StudyTableQr`，不要从普通桌位列表中读取 `qrToken`。

## 2026-05-18

### 任务
- Issue: 暂无
- 分支: feature/codex-table-checkin-impl
- 目标: 本地完整验收桌子固定二维码签到闭环，修复扫码签到后学生端无法继续签退的前端状态恢复缺口。

### 本次改动
- 安装并验证 Maven 后，使用 Docker Compose 启动 MySQL 8.4 和 Redis 7.4。
- 启动后端和前端，完成管理员发布座位时段、学生选择 T01 桌具体座位、桌码签到、签退释放的本地联调。
- 学生选座页加载最近预约，自动恢复 `RESERVED` / `CHECKED_IN` 活跃预约到顶部操作栏。
- 签退或取消后清空顶部当前预约，避免已结束预约继续显示为可操作。
- 新增前端测试，覆盖扫码签到后回到学生选座页仍能签退的场景。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `docker compose up -d`，`smart-seat-mysql` 和 `smart-seat-redis` 均为 healthy。
- 已启动后端 `mvn spring-boot:run`，`GET /api/health` 返回 `UP`。
- 已启动前端 `npm run dev -- --host 127.0.0.1`，`http://127.0.0.1:5173` 返回 200。
- 已手动验收：学生预约 T01 桌 1 号座位，扫码访问 `/student/table-checkin?token=demo-area-1-table-t01` 输入签到码，预约变为 `CHECKED_IN`，座位时段变为 `USING`。
- 已手动验收：回到学生选座页签退，预约变为 `CHECKED_OUT`，座位时段重新变为 `AVAILABLE`。
- 已运行 `npm run test -- App.test.tsx`，前端路由相关测试 5 个通过。

### 遗留问题
- Vite / jsdom 验证中仍有 Ant Design `addonBefore` 废弃警告，可后续统一改为 `Space.Compact`。
- Flyway 对 MySQL 8.4 提示版本高于其最新验证版本 8.1，目前迁移已成功，后续可视比赛或部署要求固定 MySQL 小版本。

### 对其他成员的影响
- 学生选座页现在会额外请求 `/api/reservations?limit=10` 用于恢复当前活跃预约。
- 若后续新增预约状态，需要同步判断是否属于学生端可继续操作的活跃状态。

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

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 合并两个 feature 分支后，继续在合并分支上补齐学生端“我的预约”查询切片。

### 本次改动
- 提交 `feature/lyston11-engineering-framework` 的工程化框架改动。
- 创建合并开发分支 `feature/lyston11-merged-development`，该分支包含初始工程和工程化框架提交。
- 将本地 `prototype/` 备份加入 `.gitignore`，避免误提交原型文件。
- 后端在 `reservation` 模块新增按用户查询预约记录接口。
- 前端在 `seatSlots` API 中新增 `listUserReservations`。
- 前端“我的预约”页面接入预约记录查询，替换原空状态骨架。
- 更新 API 手测文档。

### 涉及文件
- .gitignore
- backend/src/main/java/com/lyston/smartseat/reservation/
- frontend/src/api/seatSlots.ts
- frontend/src/pages/MyReservationsPage.tsx
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已确认 `feature/lyston11-merged-development` 同时包含 `feature/lyston11-initial-app` 和 `feature/lyston11-engineering-framework`。
- 尚未运行前后端测试，原因同上：本地缺少 Maven，前端依赖尚未安装。

### 遗留问题
- 预约记录接口当前仍通过 `userId` 模拟身份，后续登录鉴权完成后需要改为当前登录用户。
- 前端预约记录目前只展示基础字段，后续可补座位编号、区域名称、时间段等聚合视图。

### 对其他成员的影响
- 后续开发统一基于 `feature/lyston11-merged-development` 继续。
- 不要提交 `prototype/` 目录，它只是本地原型备份。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 安装前后端依赖，跑通本地联调环境，并按要求避开 8080 端口。

### 本次改动
- 安装前端依赖并生成 `frontend/package-lock.json`。
- 安装并使用本地 Maven / JDK 21 运行后端测试和 Spring Boot 服务。
- 将 Maven 依赖缓存固定到仓库本地 `.m2/repository`，避免依赖用户全局 Maven 缓存。
- 修正 Spring Boot 4 下 Flyway 集成方式，使用 `spring-boot-starter-flyway` 配合 `flyway-mysql`。
- 确认 Docker Compose 中 MySQL 和 Redis 正常运行，Flyway 已完成 `V1__init_schema.sql` 和 `V2__seed_demo_data.sql`。
- 后端默认端口从 8080 调整为 `18080`，并同步更新 `.env.example`、Vite proxy 和本地开发/API 文档。
- 启动后端 `http://localhost:18080`，启动前端 `http://127.0.0.1:5173`。

### 涉及文件
- .env.example
- .gitignore
- backend/pom.xml
- backend/src/main/resources/application.yml
- frontend/package-lock.json
- frontend/vite.config.ts
- docs/API_EXAMPLES.md
- docs/deployment/LOCAL_DEVELOPMENT.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已验证 `http://127.0.0.1:18080/api/health` 返回 `UP`。
- 已验证 `http://127.0.0.1:5173/` 返回前端页面入口。
- 已验证 `http://127.0.0.1:5173/api/health` 可通过 Vite proxy 转发到后端。
- 已完成预约主流程冒烟：查询可用座位时段、创建预约、查询我的预约、签到、签退，签退后座位时段恢复为 `AVAILABLE`。

### 遗留问题
- 前端构建存在 Vite 大 chunk 提醒，当前不影响运行，后续可通过路由级懒加载和拆包优化。
- Vitest 下 Ant Design 触发 jsdom `getComputedStyle` 伪元素能力提示，当前测试仍通过，后续如增加视觉相关测试可补 mock。
- 当前接口仍以 `userId` 模拟身份，后续登录鉴权完成后需要改为从当前会话读取用户。

### 对其他成员的影响
- 本地联调后端默认使用 `18080`，不要再使用 8080。
- 前端开发服务默认使用 Vite 的 `5173`，`/api` 已代理到 `http://localhost:18080`。
- 运行 Maven 命令时建议继续使用仓库本地 `.m2/repository`，避免不同机器的全局缓存影响结果。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员端功能，将座位管理页从只读列表升级为可维护资源的管理页面。

### 本次改动
- 后端 `seat` 模块新增座位资源创建、编辑、状态更新接口。
- 新增 `CreateSeatRequest`、`UpdateSeatRequest`、`UpdateSeatStatusRequest` 和 `SeatStatus`，保持请求对象、状态常量与业务逻辑分层。
- 座位编号按区域做唯一性校验，避免同一区域重复座位编号。
- 座位停用采用逻辑状态 `INACTIVE`，不做物理删除，保护历史预约、签到记录和外键关系。
- 停用座位前检查是否存在 `RESERVED` 或 `USING` 状态的时段，避免误停正在预约或使用中的座位。
- 学生端座位时段查询过滤非启用区域和非启用座位。
- 管理员看板过滤非启用区域和非启用座位。
- 前端座位管理页接入区域下拉、座位新增弹窗、编辑弹窗、停用确认和启用操作。
- 更新 API 手测示例，补充座位资源维护接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/dashboard/DashboardMapper.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seats.ts
- frontend/src/pages/AdminSeatsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/seat.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080` 并验证 Spring Boot 正常启动。
- 已通过接口冒烟验证座位新增、编辑、停用、启用和列表查询。
- 已验证学生端座位时段查询仍正常返回启用座位的开放时段。
- 已验证管理员看板仍正常返回区域统计。

### 遗留问题
- 新增座位后目前不会自动生成开放时段，后续需要补管理员发布开放时段功能。
- 座位管理当前仍未接入管理员鉴权，后续登录与角色权限完成后需要限制到管理员角色。
- 停用座位只检查正在预约或使用中的时段，后续如引入未来预约计划，需要扩展停用规则。

### 对其他成员的影响
- 座位删除请继续走逻辑停用，不要直接删除 `seats` 记录。
- 学生端座位时段查询已经只看启用区域和启用座位，测试数据如果被停用，学生端会自动隐藏。
- 管理员看板统计也会过滤停用资源，统计口径需要和页面说明保持一致。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 按工程化结构继续开发管理员开放时段发布能力，让新增座位可以进入学生端可预约流程。

### 本次改动
- 新增 `SeatSlotService`，将座位时段查询从 Controller 直连 Mapper 调整为 Controller / Service / Mapper 分层。
- 后端新增 `POST /api/seat-slots/publish`，支持按区域、日期、开始时间、结束时间和座位集合批量发布开放时段。
- 新增 `PublishSeatSlotsRequest` 和 `PublishSeatSlotsResponse`，避免接口请求/响应结构散落在 Controller 中。
- 发布时段校验区域必须启用、座位必须属于该区域且启用、开始时间必须早于结束时间。
- 重复发布相同座位、日期和时间段时不报错，返回 `skippedCount` 说明跳过数量。
- 前端新增独立页面 `AdminSeatSlotsPage`，把开放时段管理从座位资源管理页拆出。
- 侧边栏新增“开放时段”入口，接入区域选择、日期选择、时间段选择、座位多选、发布和查询。
- 前端 API 和类型层新增 `publishSeatSlots`、`PublishSeatSlotsPayload`、`PublishSeatSlotsResult`。
- 更新 API 手测示例，补充开放时段发布接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotController.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotService.java
- backend/src/main/java/com/lyston/smartseat/seat/PublishSeatSlotsRequest.java
- backend/src/main/java/com/lyston/smartseat/seat/PublishSeatSlotsResponse.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/App.tsx
- frontend/src/api/seatSlots.ts
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/seat.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已通过接口冒烟验证 2026-05-15 14:00-16:00 对座位 1、2 第一次发布创建 2 个时段，第二次重复发布跳过 2 个时段。
- 已验证前端代理 `http://127.0.0.1:5173/api/seat-slots?areaId=1&date=2026-05-15` 正常返回发布后的开放时段。

### 遗留问题
- 开放时段发布当前只支持单个时间段批量发布到多个座位，后续可以扩展为一天多时间段模板。
- 当前未提供开放时段撤销接口，后续需要在未预约状态下允许管理员撤销误发布时段。
- 仍未接入管理员鉴权，后续登录与角色权限完成后需要限制发布操作。

### 对其他成员的影响
- 时段相关业务逻辑以后优先放入 `SeatSlotService`，不要再让 Controller 直接访问 Mapper。
- 发布开放时段采用幂等风格，重复发布同一 seat/date/time 会跳过而不是抛错。
- 新增座位后需要通过开放时段页发布时段，学生端才会看到可预约资源。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员开放时段生命周期，支持撤销误发布但尚未被预约的开放时段。

### 本次改动
- 后端新增 `DELETE /api/seat-slots/{seatSlotId}`，用于撤销开放时段。
- 撤销逻辑继续放在 `SeatSlotService`，Controller 只负责参数接收和响应封装。
- Mapper 新增条件删除，只允许删除 `AVAILABLE`、未绑定预约人、未绑定预约记录的时段。
- 前端开放时段列表新增“撤销”操作，并对非空闲状态禁用按钮。
- 撤销前增加确认弹窗，降低误操作风险。
- 更新 API 手测示例，补充撤销开放时段说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotController.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotService.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已通过接口冒烟验证：先发布 2026-05-16 18:00-20:00 的临时时段，再调用撤销接口，最终列表中不再存在该时段。

### 遗留问题
- 撤销接口当前采用物理删除空闲时段；后续如需要完整审计轨迹，可扩展 `seat_slots.status` 或新增操作日志。
- 已预约或使用中的时段暂不支持管理员强制撤销，后续应设计异常占用释放流程。
- 管理员鉴权仍待接入，撤销接口后续需要限制到管理员角色。

### 对其他成员的影响
- 撤销开放时段只适用于尚未被预约的 `AVAILABLE` 时段。
- 不要绕过 `SeatSlotService` 直接删除时段，避免破坏预约状态一致性。
- 后续若引入时段审计，需要同步改造撤销逻辑和管理员页面文案。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 增加管理员异常释放能力，补齐座位时段被预约或使用后的人工处理闭环。

### 本次改动
- 新增 `admin` 模块，提供管理员座位时段释放 Controller / Service / Request / Response。
- 新增 `POST /api/admin/seat-slots/{seatSlotId}/release`，支持释放 `RESERVED`、`USING`、`ABNORMAL` 时段。
- 新增预约状态 `ADMIN_RELEASED`，区分学生主动取消、超时过期和管理员人工释放。
- 新增签到记录动作 `ADMIN_RELEASE`，记录管理员释放操作。
- 座位时段释放后回到 `AVAILABLE`，并清空 `reserved_by` 和 `reservation_id`。
- 前端开放时段页对已预约、使用中、异常占用状态展示“释放”操作。
- 前端“我的预约”页面新增 `ADMIN_RELEASED` 状态展示。
- 更新 API 手测示例，补充管理员释放接口说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/java/com/lyston/smartseat/checkin/CheckinAction.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationMapper.java
- backend/src/main/java/com/lyston/smartseat/reservation/ReservationStatus.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/pages/MyReservationsPage.tsx
- frontend/src/types/reservation.ts

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `npm run test`，前端测试通过。
- 已重启后端到 `http://localhost:18080`，确认最新接口加载成功。
- 已完成管理员释放冒烟：发布 2026-05-17 18:00-20:00 临时时段，用户 1 预约后由管理员 2 释放，座位时段恢复 `AVAILABLE`，预约状态变为 `ADMIN_RELEASED`。

### 遗留问题
- 当前管理员释放只校验传入 `adminUserId` 非空，后续登录鉴权完成后需要从当前管理员会话读取。
- 释放原因目前未记录，后续可扩展请求体增加 `reason` 字段并写入审计日志。
- `ABNORMAL` 状态目前还没有前端标记入口，后续可以补异常占用标记和恢复流程。

### 对其他成员的影响
- 管理员释放属于独立 admin 模块，后续管理员动作优先放入 `backend/src/main/java/com/lyston/smartseat/admin/`。
- 学生端预约历史需要识别 `ADMIN_RELEASED`，不要把它当作普通取消或过期。
- 座位时段释放后会重新开放，前端应重新拉取时段列表，避免显示旧状态。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续按工程化架构推进登录/角色权限、区域 CRUD、开放时段模板、管理员释放审计、Redis 缓存限流和关键业务测试。

### 本次改动
- 新增 `auth` 模块，提供演示登录、退出、当前用户接口和 `X-Auth-Token` 请求头会话。
- 新增 `user` 模块，封装用户实体、角色常量、用户查询和用户响应结构。
- 新增 `RequireRole` 注解、MVC 拦截器和当前用户参数解析器，对学生端和管理员端接口做角色限制。
- 学生预约、签到、签退、取消和我的预约接口改为从登录态读取当前学生，不再从请求体或查询参数传 `userId`。
- 管理员释放接口改为从登录态读取管理员，并要求填写 `reason`。
- 新增 `audit` 模块和 `audit_logs` 迁移表，管理员释放、区域创建、区域更新、区域状态变更会记录审计日志。
- 新增 `cache` 模块，接入座位时段 Redis 缓存和预约接口短窗口限流；座位状态变化后失效对应区域日期缓存。
- 区域管理从只读扩展为新增、编辑、启用、停用，并补充区域名称唯一校验和停用前忙碌时段保护。
- 开放时段发布支持 `periods` 多时间段模板，一次可以给多个座位生成多个开放时段。
- 前端新增登录页、区域管理页；侧边栏按角色展示管理入口；请求层自动携带 `X-Auth-Token`。
- 前端学生页和我的预约页移除手填用户 ID；开放时段页移除手填管理员 ID，释放时弹窗填写原因。
- 更新 API 手测文档，所有受保护接口示例统一展示 token 请求头。
- 新增后端业务单测，覆盖预约原子更新失败、预约成功缓存失效、签退状态流转、管理员释放审计。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/auth/
- backend/src/main/java/com/lyston/smartseat/user/
- backend/src/main/java/com/lyston/smartseat/audit/
- backend/src/main/java/com/lyston/smartseat/cache/
- backend/src/main/java/com/lyston/smartseat/area/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/resources/db/migration/V3__add_audit_logs.sql
- backend/src/test/java/com/lyston/smartseat/reservation/
- backend/src/test/java/com/lyston/smartseat/admin/
- frontend/src/api/
- frontend/src/layout/
- frontend/src/pages/
- frontend/src/types/
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过，当前共 5 个测试。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 当前登录是课程项目演示级 token 登录，没有密码、加密和刷新 token；后续如做正式系统需要接入真实认证。
- Redis 缓存和限流已接入第一版，后续可增加缓存命中统计、限流配置化和异常监控。
- 前端构建仍有 Vite 大 chunk 提醒，后续可通过路由懒加载拆包。
- `ABNORMAL` 状态仍缺少管理员主动标记入口，后续可补异常占用标记和恢复流程。

### 对其他成员的影响
- 受保护接口后续都需要带 `X-Auth-Token`，不要再从前端传 `userId` 或 `adminUserId` 模拟身份。
- 管理员接口应继续使用 `@RequireRole(UserRole.ADMIN)` 限制权限。
- 学生接口应继续从 `CurrentUser` 读取当前用户，业务层仍保留状态和所有权校验。
- 新增会影响座位状态的功能时，需要同步失效 `SeatSlotCacheService` 对应区域日期缓存。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续补齐管理员异常占用闭环，并优化前端工程化拆包。

### 本次改动
- 管理员开放时段页新增“标异常”和“恢复”操作，原因填写弹窗复用释放流程。
- 后端新增管理员标记异常和恢复异常接口，路径为 `/api/admin/seat-slots/{seatSlotId}/abnormal` 和 `/api/admin/seat-slots/{seatSlotId}/restore`。
- 仅允许未绑定预约的 `AVAILABLE` 时段直接标记异常，仅允许未绑定预约的 `ABNORMAL` 时段直接恢复。
- 已绑定预约的异常时段继续走管理员释放流程，释放后关联预约进入 `ADMIN_RELEASED`。
- 新增异常标记和恢复审计动作，管理员原因会写入 `audit_logs`。
- `SeatSlotResponse` 补充 `reservationId`，前端据此区分异常恢复和异常释放。
- 前端路由改为 `React.lazy` + `Suspense`，拆分页面级 chunk，降低首包体积并消除大 chunk 提醒。
- 更新 API 示例文档，补充异常标记和恢复 curl 示例。
- 补充管理员时段服务单测，覆盖标异常、恢复和审计原因。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/admin/
- backend/src/main/java/com/lyston/smartseat/audit/AuditAction.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java
- backend/src/main/java/com/lyston/smartseat/seat/SeatSlotResponse.java
- backend/src/test/java/com/lyston/smartseat/admin/AdminSeatSlotServiceTest.java
- frontend/src/App.tsx
- frontend/src/App.test.tsx
- frontend/src/api/seatSlots.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/
- docs/API_EXAMPLES.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端测试通过，当前共 7 个测试。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过，页面级 chunk 已拆分。

### 遗留问题
- 异常占用目前是管理员手动标记，后续可结合签到超时、设备上报或座位传感器自动触发。
- 审计日志已经记录原因，后续可补后台审计查询页面。
- 前端管理员开放时段页操作较多，后续可抽出表格 action 组件，进一步降低页面复杂度。

### 对其他成员的影响
- 后续新增座位状态流转时，应继续通过 `SeatSlotMapper` 条件更新保证并发安全。
- 管理员状态变更必须保留原因字段并写审计，避免比赛答辩时无法解释操作来源。
- 前端新增页面建议继续走懒加载，保持页面级拆包。

## 2026-05-14

### 任务
- Issue: 暂无
- 分支: feature/lyston11-merged-development
- 目标: 继续优化前端体验，把学生选座、管理员操作和前端权限做得更像完整系统。

### 本次改动
- 学生选座页区域筛选从手填区域 ID 改为区域下拉，只展示启用区域。
- 学生座位展示从表格改为按时间段分组的座位地图，座位卡片直接展示状态并支持点击预约。
- 新增 `SeatMap` 组件，封装座位地图布局、空状态、加载态和状态标签。
- 新增 `AdminSeatSlotActions` 组件，抽出开放时段表格里的撤销、释放、标异常、恢复按钮逻辑。
- 新增 `RoleRoute` 路由守卫，管理员页面在前端路由层要求 `ADMIN` 角色。
- 新增 `seatSlotStatus` 常量文件，统一座位时段状态文案和颜色。
- 优化移动端布局，侧边栏在窄屏下转为顶部区域，工具栏、选择框、按钮和座位地图自适应宽度。

### 涉及文件
- frontend/src/App.tsx
- frontend/src/router/RoleRoute.tsx
- frontend/src/components/SeatMap.tsx
- frontend/src/components/AdminSeatSlotActions.tsx
- frontend/src/constants/seatSlotStatus.ts
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 座位地图目前基于 `seatId` 展示，后续后端可把 `seatNo` 一并返回，前端显示真实座位编号。
- 座位地图目前按时间段分组，后续如果有真实平面图坐标，可升级为区域平面图布局。
- 前端已有路由守卫，最终权限仍以后端 `@RequireRole` 为准。

### 对其他成员的影响
- 新增学生端选座展示建议继续复用 `SeatMap`，避免回到页面内堆表格逻辑。
- 新增管理员时段操作按钮时优先扩展 `AdminSeatSlotActions`。
- 管理员新页面路由应挂在 `RoleRoute allowedRoles={['ADMIN']}` 下。

## 2026-05-15

### 任务
- Issue: 暂无
- 分支: feature/lyston11-seat-map-audit-hardening
- 目标: 从最新 `main` 创建新分支，继续补齐真实座位编号、审计日志页面、登录加固、座位地图平面化和关键测试。

### 本次改动
- 后端座位时段查询返回 `seatNo`，前端座位地图优先显示 `A-001` 等真实座位编号。
- 学生端 `SeatMap` 增加入口、采光窗、服务台和网格背景，视觉上更接近平面座位图。
- 新增管理员审计日志查询接口 `/api/admin/audit-logs`，支持按 `limit` 查询最近日志并限制最大 100 条。
- 新增前端审计日志页面和管理员菜单入口，展示操作人、动作、对象、原因和时间。
- 登录请求增加 `password` 字段，演示账号分别使用学生密码 `123456`、管理员密码 `admin`。
- 新增数据库迁移 `V4__add_user_password_hash.sql`，为已有用户补充密码哈希。
- 补充后端单测，覆盖登录密码校验、审计日志查询 limit、Redis 缓存/限流降级、签到失败和取消流转。
- 更新 API 示例文档，补充登录密码、`seatNo` 和审计日志查询说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/audit/
- backend/src/main/java/com/lyston/smartseat/auth/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/java/com/lyston/smartseat/user/
- backend/src/main/resources/db/migration/V4__add_user_password_hash.sql
- backend/src/test/java/com/lyston/smartseat/
- frontend/src/App.tsx
- frontend/src/api/
- frontend/src/components/SeatMap.tsx
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/
- frontend/src/styles/main.css
- frontend/src/types/
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 16 个测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 当前密码使用 SHA-256 演示级哈希，比赛演示够用；正式系统建议改为 BCrypt/Argon2 并增加密码修改、重置和刷新 token。
- 审计日志页面目前是最近日志列表，后续可增加动作、操作人、目标对象和时间范围筛选。
- 座位地图已经更接近平面图，但还没有真实坐标；后续可为座位增加行列或坐标字段。

### 对其他成员的影响
- 登录接口请求体现在需要 `studentNo` 和 `password`。
- 前端座位地图依赖 `seatNo`，后端座位时段响应不要删除该字段。
- 管理员新页面仍需挂在 `RoleRoute allowedRoles={['ADMIN']}` 下。

## 2026-05-15

### 任务
- Issue: 暂无
- 分支: feature/lyston11-admin-audit-dashboard
- 目标: 继续开发审计日志筛选、占用看板增强、真实座位地图行列布局和预约规则增强。

### 本次改动
- 审计日志接口新增筛选条件：动作、操作人、目标类型、开始时间、结束时间和返回条数。
- 审计动作支持 `AREA_CHANGE` 聚合筛选，一次覆盖区域新增、编辑和状态变更。
- 前端审计日志页新增筛选表单，可按管理员操作维度追溯释放、标异常、恢复和区域变更。
- 管理员占用看板新增异常占用、活跃预约、已签到人数、待签到和整体占用率卡片。
- 区域利用率列表升级为排行榜，后端按利用率排序并返回区域异常占用数量。
- `seats` 新增 `row_no`、`column_no`、`display_order` 字段，迁移为演示数据补默认布局。
- 座位管理页支持维护行号、列号和展示顺序；学生端座位地图按行列渲染真实座位布局。
- 座位时段查询和批量发布响应补充座位布局字段，保持前后端响应一致。
- 预约创建新增规则：不能预约已开始或过去时段；同一学生在重叠时间内只能有一个活跃预约。
- 学生端选座页展示预约规则提示，便于比赛演示说明业务严谨性。
- 补充后端单测，覆盖审计筛选、时间范围校验、过去时段拒绝和重叠预约拒绝。
- 更新 API 手测文档，补充审计筛选、座位布局字段和预约规则说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/audit/
- backend/src/main/java/com/lyston/smartseat/dashboard/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/java/com/lyston/smartseat/seat/
- backend/src/main/resources/db/migration/V5__add_seat_layout_fields.sql
- backend/src/test/java/com/lyston/smartseat/audit/AuditLogServiceTest.java
- backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java
- frontend/src/api/
- frontend/src/components/SeatMap.tsx
- frontend/src/pages/
- frontend/src/styles/main.css
- frontend/src/types/
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 20 个测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 预约规则目前覆盖“同一时间只能一个活跃预约”和“不能预约过去时段”，后续可继续增加预约提前天数、每日预约次数上限等策略。
- 座位地图已有行列布局，但还不是完整 CAD/平面图级别，后续可继续增加区域障碍物、通道和座位朝向。
- 看板数据当前按日期实时查询，后续可接入缓存或定时汇总提升大数据量场景性能。

### 对其他成员的影响
- 新增座位时建议维护 `rowNo`、`columnNo` 和 `displayOrder`，否则学生端会退回自动网格位置。
- 新增管理员动作时，应同步扩展审计动作常量、筛选选项和审计页面文案。
- 后续调整预约创建逻辑时，要保留重叠预约校验和过去时段校验，避免业务规则回退。

## 2026-05-15

### 任务
- Issue: 暂无
- 分支: feature/lyston11-admin-audit-dashboard
- 目标: 继续增强预约规则，把签到宽限、提前预约天数和每日活跃预约上限配置化，并在前端动态展示。

### 本次改动
- 新增 `ReservationRuleProperties`，通过 `smart-seat.reservation-rules` 配置预约规则。
- 新增 `GET /api/reservations/rules`，前端可读取当前规则用于展示。
- 预约创建使用配置化签到宽限时间计算 `expiresAt`，不再硬编码 15 分钟。
- 预约创建新增最大提前预约天数校验，默认最多提前 7 天。
- 预约创建新增每日活跃预约数量上限，默认同一学生每天最多保留 3 个活跃预约。
- 前端学生选座页改为从接口加载预约规则，动态展示签到宽限、提前预约天数和每日上限。
- 补充后端单测，覆盖超过提前预约窗口和触发每日活跃预约上限的拒绝逻辑。
- 更新 API 手测文档，补充预约规则查询和规则说明。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/SmartSeatApplication.java
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/resources/application.yml
- backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java
- frontend/src/api/seatSlots.ts
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/types/reservation.ts
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 22 个测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 规则目前通过配置文件和环境变量控制，后续如果比赛展示需要“后台调整规则”，可扩展为数据库配置和管理员规则管理页面。
- 每日上限当前统计 `RESERVED` 和 `CHECKED_IN`，后续如果增加排队/暂存状态，需要同步调整统计口径。

### 对其他成员的影响
- 修改预约规则优先调整 `smart-seat.reservation-rules`，不要在服务层重新写硬编码数字。
- 学生端规则提示依赖 `/api/reservations/rules`，该接口字段变更时需要同步更新前端类型。

## 2026-05-15

### 任务
- Issue: 暂无
- 分支: feature/lyston11-admin-audit-dashboard
- 目标: 继续把预约规则从配置文件升级为管理员可维护能力，形成后台规则管理闭环。

### 本次改动
- 新增 `reservation_rules` 表和 `V6__add_reservation_rules.sql` 迁移，初始化默认规则。
- 新增 `ReservationRule`、`ReservationRuleMapper`、`ReservationRuleService` 和更新请求对象。
- `/api/reservations/rules` 改为优先读取数据库规则，数据库缺失时回退到配置默认值。
- 新增管理员更新预约规则接口 `PUT /api/reservations/rules`。
- 预约创建继续通过规则服务读取当前规则，因此管理员更新后会影响后续预约校验和签到过期时间。
- 规则更新写入审计日志，动作 `RESERVATION_RULE_UPDATE`，目标类型 `RESERVATION_RULE`。
- 审计日志筛选支持预约规则变更动作和目标类型。
- 前端新增管理员“预约规则”页面，可查看和维护签到宽限、提前预约天数、每日活跃预约上限。
- 管理员菜单和路由新增 `/admin/reservation-rules`。
- 补充规则服务单测，覆盖默认配置回退、规则更新和审计写入。
- 更新 API 手测文档，补充管理员更新预约规则示例。

### 涉及文件
- backend/src/main/java/com/lyston/smartseat/audit/
- backend/src/main/java/com/lyston/smartseat/reservation/
- backend/src/main/resources/db/migration/V6__add_reservation_rules.sql
- backend/src/test/java/com/lyston/smartseat/reservation/
- frontend/src/App.tsx
- frontend/src/api/seatSlots.ts
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/AdminReservationRulesPage.tsx
- frontend/src/pages/AdminAuditLogsPage.tsx
- frontend/src/styles/main.css
- frontend/src/types/reservation.ts
- docs/API_EXAMPLES.md
- docs/dev-logs/lyston11.md

### 验证方式
- 已运行 `mvn -Dmaven.repo.local=/Users/lyston/PycharmProjects/smart-seat-reservation/.m2/repository test`，后端 24 个测试通过。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run test`，前端测试通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 规则页面当前只有单行全局规则，后续如要支持不同区域/楼层差异化规则，可将规则表扩展出 `area_id` 维度。
- 规则更新审计原因目前固定为 `update rules`，后续可在页面加“变更原因”输入框。

### 对其他成员的影响
- 预约规则现在优先以数据库 `reservation_rules` 为准，配置项只作为兜底默认值。
- 新增影响预约策略的代码时，应通过 `ReservationRuleService` 读取规则。
