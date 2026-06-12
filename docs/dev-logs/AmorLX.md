# AmorLX 开发日志

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 修复管理员界面仍触发学生预约接口导致控制台出现 `403 Forbidden` 的问题，并清理 Ant Design `Space direction` 过期属性警告。

### 本次改动
- `WifiPresenceGuard` 在每次 WiFi 在线心跳前重新读取当前登录角色，避免从学生切换到管理员后旧心跳继续请求 `/api/reservations?limit=20`。
- 新增 `authSession` 工具集中判断当前是否为学生会话。
- 新增 `WifiPresenceGuard.test.tsx`，覆盖管理员会话不请求学生预约接口，以及角色切换后学生会话判断会即时失效。
- 将页面中 `Space direction="vertical"` 统一替换为 `orientation="vertical"`，消除 Ant Design 过期属性警告。

### 涉及文件
- frontend/src/components/WifiPresenceGuard.tsx
- frontend/src/components/WifiPresenceGuard.test.tsx
- frontend/src/utils/authSession.ts
- frontend/src/pages/AdminSeatSlotsPage.tsx
- frontend/src/pages/AdminSeatsPage.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/pages/SeatCheckinPage.tsx
- frontend/src/pages/TableCheckinPage.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- WifiPresenceGuard.test.tsx`，2 个专项测试通过。
- 已运行 `npm run test`，9 个测试文件、75 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- 控制台中单独的 `404` 仍需看 Network 里具体 URL；如果是 `favicon.ico` 可忽略，如果是 `/api/...` 需要按具体路径继续排查。

### 对其他成员的影响
- 不修改后端权限、签到接口、预约状态机或数据库结构。
- 管理员页面不再由全局 WiFi 心跳触发学生预约接口；学生已签到预约的 WiFi 心跳逻辑保留。

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 优化学生选座页手机端适配，将预约确认、已选座位和当前预约收纳到可展开面板，减少移动端长页面上下滚动。

### 本次改动
- 学生选座页新增移动端底部“预约面板”入口，手机宽度下隐藏桌面右侧预约栏，主界面优先展示公共区域位置、预约时间和座位图。
- 将原右侧预约内容抽成复用面板，在桌面端继续作为右侧栏显示，在移动端通过底部抽屉展示。
- 移动端抽屉内保留选择路径、已选座位、当前预约和签到/签退操作，并允许面板内部滚动。
- 修复浮动入口被页面入场动画容器影响的问题，将移动端入口放到页面主体外，确保固定在手机视口底部。
- App 级测试补充移动端入口、桌面侧栏、移动端抽屉和浮动入口 DOM 层级断言。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "marks student reservation panels"`，确认旧结构下移动端浮动入口仍在 `.student-seat-page` 内，测试失败。
- 已运行 `npm run test -- App.test.tsx -t "marks student reservation panels"`，移动端预约面板结构测试通过。
- 已运行 `npm run test`，8 个测试文件、73 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats` 检查移动宽度：桌面侧栏隐藏，底部预约入口固定在视口底部，点击后抽屉内显示选择路径、已选座位和当前预约内容。

### 遗留问题
- 本次只优化学生选座页手机端布局，不改预约接口、签到校验、二维码闭环或后端状态机。

### 对其他成员的影响
- 学生预约端移动布局从“长页面堆叠”改为“主界面 + 底部预约面板”；桌面端右侧栏交互保持不变。
- 签到验证相关按钮和接口调用路径未修改，同事继续做签到验证时无需调整后端契约。

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 将签到时间窗等后端英文业务错误改为中文提示，避免学生点击“开发测试签到”后看到英文报错。

### 本次改动
- 前端 API 请求层新增已知业务错误码中文映射。
- `RESERVATION_CHECKIN_TIME_NOT_ALLOWED` 显示为“当前不在签到时间窗内，请在预约开始前后规定时间内签到”。
- 同步补充 `CHECKIN_WIFI_IP_NOT_ALLOWED` 和 `RESERVATION_CHECKIN_FAILED` 的中文提示兜底。
- `http.test.ts` 增加回归测试，覆盖后端返回英文签到时间窗错误时前端展示中文消息。

### 涉及文件
- frontend/src/api/http.ts
- frontend/src/api/http.test.ts
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- http.test.ts -t "translates known backend business error codes"`，确认旧实现仍透传英文错误。
- 已运行 `npm run test -- http.test.ts -t "translates known backend business error codes"`，相关测试通过。
- 已运行 `npm run test`，8 个测试文件、73 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。

### 遗留问题
- 本次只做前端错误提示中文化，不修改签到时间窗、校园网 IP 校验、预约状态机或后端错误码。

### 对其他成员的影响
- 所有前端入口通过统一 API 请求层收到这些错误码时都会显示中文提示。
- 后端仍可继续返回原有错误码和英文 message，前端按 code 做展示层翻译。

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 修复学生预约界面时间下拉被下方区域覆盖的问题，并压缩“当前预约”窗口的信息密度，使右侧操作区更协调。

### 本次改动
- 学生选座页开始/结束时间 `Select` 增加专用类名，并将下拉弹层挂载到 `document.body`，避免被后续座位工作区或动效容器层级压住。
- 时间下拉弹层使用 `student-seat-time-popup` 独立层级，保证选项浮在主界面上方。
- “当前预约”卡片改为紧凑结构：状态与预约编号放在顶部，位置、时段、签到截止、锁位次数进入摘要网格。
- 签到码区域增加“签到凭证”分组，操作按钮改为更紧凑的横向自适应布局。
- 当前预约位置展示复用连廊名称格式化，避免同一页同时出现 `A-B教学楼连廊` 和旧 `A/B 连廊` 文案。
- App 级测试补充断言，覆盖时间选择控件的专用类名、当前预约紧凑卡片结构和连廊名称统一展示。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/utils/reservationDisplay.ts
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "restores checked-in reservation|keeps floor changes"`，确认旧实现缺少时间选择专用类名和当前预约紧凑卡片结构。
- 已运行 `npm run test -- App.test.tsx -t "restores checked-in reservation|keeps floor changes"`，相关回归测试通过。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats`，确认时间下拉弹层存在且 `z-index` 为 `2100`，当前预约卡片约 360px 高并显示紧凑摘要结构。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- 内置浏览器截图接口偶发超时，本次采用 DOM 层级、页面文本和自动化测试验证；本地页面仍可直接通过浏览器查看。
- 本次不修改预约状态机、签到验证、二维码闭环和服务器部署边界。

### 对其他成员的影响
- 不影响后端接口或数据库结构。
- `formatReservationLocation` 现在会对预约中的连廊区域名称做展示层格式化，旧数据仍保持兼容。

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 排查学生选座页“当前预约”中点击 `开发测试签到`、`签退` 等按钮出现后端报错的原因，并减少无效点击。

### 本次改动
- 确认根因：学生选座页的当前预约卡片只判断是否存在活跃预约，没有按预约状态限制按钮可点击，导致已签到、已完成或不可取消状态仍能发起对应操作。
- 学生选座页复用 `reservationDisplay` 中已有的 `canCheckInReservation`、`canCheckOutReservation`、`canCancelReservation` 规则，与“我的预约”页面保持一致。
- `开发测试签到` 仅在 `RESERVED` 待签到状态可点；`签退` 仅在 `CHECKED_IN` 使用中状态可点；`取消` 仅在 `RESERVED` 待签到状态可点。
- 签到码输入框在当前状态不允许签到时禁用，避免学生误以为修改签到码后仍可签到。
- App 级测试补充断言，覆盖已签到预约恢复到学生选座页时，签到按钮禁用、签退按钮可用。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "restores checked-in reservation on student seat page so the student can check out"`，确认旧实现失败于已签到状态下 `开发测试签到` 仍可点击。
- 已运行 `npm run test -- App.test.tsx -t "restores checked-in reservation on student seat page so the student can check out"`，相关回归测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- `开发测试签到` 虽然是测试入口，但后端仍会校验签到时间窗、校园网/IP、预约码和预约状态；如果当前时间或网络不满足规则，点击仍会被后端正常拒绝。
- 本次只修复前端明显无效状态的按钮可点击问题，不修改后端签到验证、二维码闭环、预约状态机或服务器部署边界。

### 对其他成员的影响
- 不影响签到验证接口和后端状态机；同事继续按原有签到校验逻辑开发即可。
- 学生选座页和“我的预约”页的按钮状态规则已统一，后续新增预约操作入口建议继续复用 `reservationDisplay` 中的状态判断函数。

## 2026-06-12

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 将动效从指定页面扩展为全站统一体验，让登录页、学生端、管理员端、签到页和后续新增页面都具备浅色科技风微动效。

### 本次改动
- 新增全站动效设计文档和实施计划，明确采用“全局 motion 入口 + 通用 CSS 动效语言”的方式，而不是每个页面单独堆动画。
- `AppLayout` 的主内容区新增 `motion-viewport`，所有登录后的业务页面自动继承页面进入、卡片、表格、表单、提示、地图和浮窗动效。
- 登录页根容器新增 `motion-page`，未登录入口也纳入同一套动效体系。
- `main.css` 新增全局 motion token、页面进入动画、内容浮现动画、柔和脉冲和柔光强调。
- 为卡片、表格行、工具栏、表单区、预约浮窗、座位图、室内地图、签到面板、登录页展示卡统一增加 hover/focus/active 反馈。
- 为 warning、异常、高利用区域、选中座位、当前区域和登录实时标识增加更明显但克制的状态强调。
- 保留并复用 `prefers-reduced-motion`，系统设置减少动态效果时会自动降级。
- App 级测试补充断言，确认登录页有 `motion-page`，登录后的内容区有 `motion-viewport`。

### 涉及文件
- frontend/src/layout/AppLayout.tsx
- frontend/src/pages/LoginPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/plans/2026-06-12-global-motion-design.md
- docs/plans/2026-06-12-global-motion.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "renders student seat page title|renders the polished login page"`，确认旧实现缺少 `motion-viewport` 和 `motion-page` 后测试失败。
- 已运行 `npm run test -- App.test.tsx -t "renders student seat page title|renders the polished login page"`，2 个相关测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/login`，确认登录页带 `motion-page`，桌面宽度无横向溢出。

### 遗留问题
- 内置浏览器自动点击 Ant Design 登录按钮时出现工具超时，因此登录后页面的浏览器自动化只采用测试覆盖和构建验证；需要人工可直接用 `admin / admin` 或 `20260001 / 123456` 打开页面查看动效。
- 本次是全局动效基础层，后续如果某个具体页面需要更有业务含义的局部动效，可以在此基础上继续细化。

### 对其他成员的影响
- 不修改接口、数据库、签到验证、预约状态机和服务器部署边界。
- 后续新增页面只要放在 `AppLayout` 的 `.app-content` 内并使用 `.page` 根容器，就会自动继承全站动效。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 继续增强管理员看板的信息层级、运营引导、响应式适配和浅色科技感动效。

### 本次改动
- 管理员看板新增 `运营指挥` 模块，集中展示实时占用率、高利用区域和处理建议，让管理员先看到下一步该处理什么。
- 新增 `状态流` 模块，将空闲、待签到、使用中、异常四类状态做成可扫读的运行分布卡片。
- 区域利用率列表按利用率降序展示，并增加 `高利用`、`中利用`、`低利用` 标签和对应浅色状态底纹。
- 删除原先独立的当前日期条，日期信息合并到顶部日期选择和运营指挥模块，减少重复信息。
- 管理员看板补充扫描线、卡片 hover、状态边线等轻量动效，并保留 `prefers-reduced-motion` 降低动画支持。
- App 级测试补充 `运营指挥`、`处理建议`、`状态流`、`高利用区域` 结构断言。

### 涉及文件
- frontend/src/pages/AdminDashboardPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "lets administrators manually release expired seat locks from the dashboard"`，确认旧界面缺少 `运营指挥` 后测试失败。
- 已运行 `npm run test -- App.test.tsx -t "lets administrators manually release expired seat locks from the dashboard"`，管理员看板相关测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器登录管理员并打开 `http://127.0.0.1:5173/admin/dashboard`，确认 `运营指挥`、`处理建议`、`状态流`、`高利用区域` 均可见，桌面宽度无横向溢出。
- 已用内置浏览器临时切换到 390px 移动宽度验证管理员看板，确认新模块可见且无横向溢出，随后已恢复默认视口。

### 遗留问题
- 本次继续聚焦管理员看板首页；管理员区域、桌子、座位、开放时段等子页面后续仍可按同一浅色科技工作台风格逐步统一。
- 当前 `处理建议` 基于看板汇总数据做前端提示，不改变后端异常判定、签到验证或预约状态机。

### 对其他成员的影响
- 不修改接口、数据库、签到验证、预约状态机和服务器部署边界。
- 管理员看板新增展示层排序和标签，不影响后端返回的区域利用率数据结构。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 优化学生首页和管理员看板的排列、显示和浅色科技感动效，让入口页面像学生选座页一样更好用。

### 本次改动
- 学生首页改为 `学生预约工作台`，新增今日状态、快捷入口、主内容区和侧栏结构，突出当前预约、今日时间线、锁位权益、常用区域和最近记录。
- 管理员看板改为 `管理员运营工作台`，新增运行概览、日期控制条、异常处理侧栏、锁位运维和区域利用率主列表。
- 首页和看板统一浅色科技风，补充细网格背景、轻量进入动画、hover 微动效，并支持 `prefers-reduced-motion`。
- 管理员区域利用率列表复用连廊显示名格式化，避免看板继续显示旧 `A/B 连廊` 文案。
- App 级测试补充学生首页工作台和管理员看板工作台结构断言。

### 涉及文件
- frontend/src/pages/StudentHomePage.tsx
- frontend/src/pages/AdminDashboardPage.tsx
- frontend/src/styles/main.css
- frontend/src/utils/campusConnectors.ts
- frontend/src/App.test.tsx
- docs/plans/2026-06-11-student-admin-workbench-ui-design.md
- docs/plans/2026-06-11-student-admin-workbench-ui.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "renders student home|centers the student home|manually release expired"`，确认旧布局缺少新工作台结构断言。
- 已运行 `npm run test -- App.test.tsx -t "manually release expired|renders student home|centers the student home|lock a checked-in|WiFi presence"`，4 个相关测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/home`，确认学生工作台、今日状态、快捷入口和主内容区存在且无横向溢出。
- 已用内置浏览器登录管理员并打开 `http://127.0.0.1:5173/admin/dashboard`，确认管理员运营工作台、运行概览、异常处理、区域利用率存在且无横向溢出。

### 遗留问题
- 本次优化学生首页和管理员看板入口页；其它管理员子页面可后续继续按同一工作台风格逐步统一。
- 页面顶栏菜单名称仍保持原路由标题 `学生首页` / `占用看板`，避免本次 UI 改动影响导航结构。

### 对其他成员的影响
- 不修改接口、数据库、签到验证、预约状态机和服务器部署边界。
- `formatConnectorAreaNameText` 可供后续只有区域名称字符串的列表复用，统一旧连廊命名展示。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 删除预约确认浮窗底部多余的 `日期` 统计卡，避免与上方预约时段重复且窄宽度下被截断。

### 本次改动
- 移除学生选座页 `预约确认浮窗` 底部统计区中的 `日期` 卡片。
- 将浮窗底部统计网格从三列调整为两列，只保留 `可预约` 和 `占用/异常`，并同步修正小屏响应式规则。
- App 级测试补充断言，确保预约确认浮窗里不再出现多余 `日期` 统计项。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "keeps floor changes"`，确认测试失败于浮窗仍显示 `日期`。
- 已运行 `npm run test -- App.test.tsx -t "keeps floor changes|connects floor, area, time, table, and seat|marks student reservation panels"`，3 个相关测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats`，确认 `预约确认浮窗` 底部只剩 `可预约` 和 `占用/异常` 两项，`日期` 统计卡不再显示。
- 已复查运行 `npm run test -- App.test.tsx -t "marks student reservation panels"`、`npm run lint`、`npm run build`，并确认浮窗统计区实际渲染为两列。

### 遗留问题
- 本次只删除重复日期统计，不调整上方预约时段展示和日期选择控件。

### 对其他成员的影响
- 不影响接口、数据库、签到验证、预约状态机和管理员端流程。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 将页面中的 `A/B连廊`、`B/C连廊` 统一改为 `A-B教学楼连廊`、`B-C教学楼连廊`，并检查删除重复展示信息。

### 本次改动
- 新增连廊区域显示名格式化能力，兼容后端/旧演示数据中的 `A/B 连廊`、`B/C 连廊` 名称，但学生端和管理员端统一按新名称展示。
- 学生选座页地图、区域下拉、右侧预约确认浮窗和已选座位说明统一使用新连廊名称。
- 学生选座页顶部 `当前选择` 删除重复的完整区域名，只保留楼层和占用率。
- 移除时间提示行里与 `预约规则提示` 重复出现的不可预约原因，越界/过期提示只保留一处 warning。
- 管理员区域管理页的楼栋分区选项、地图配置标签和区域名称列同步展示新连廊名称。
- 收紧连廊推断规则，避免英文 `A/B connector` 被误判到 `B-C教学楼连廊`。

### 涉及文件
- frontend/src/utils/campusConnectors.ts
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/pages/AdminAreasPage.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- CampusIndoorMap.test.tsx` 和 `npm run test -- App.test.tsx -t "switches reservation area|keeps floor changes|connects floor, area, time, table, and seat|marks student reservation panels"`，确认旧实现仍显示旧连廊命名。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`，6 个组件测试通过。
- 已运行 `npm run test -- App.test.tsx -t "admin area management|reservation rule warning|marks student reservation panels"`，3 个相关测试通过。
- 已运行 `npm run test`，8 个测试文件、72 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats`，确认学生页显示 `A-B教学楼连廊` / `B-C教学楼连廊`，不再显示旧 `A/B 连廊` / `B/C 连廊`，`当前选择` 只显示楼层和占用率，预约 warning 只出现一次。
- 已用内置浏览器登录管理员并打开 `http://127.0.0.1:5173/admin/areas`，确认区域名称列和地图配置标签均显示新连廊名称。

### 遗留问题
- 后端演示数据和数据库中的原始区域 `name` 仍可能是旧名称，本次只做前端显示层兼容；如果要彻底清理数据库名称，可后续单独做一次迁移和接口文档同步。
- 本次不修改预约状态机、签到验证、二维码闭环和服务器部署边界。

### 对其他成员的影响
- 同事继续使用现有区域接口和 `CONNECTOR` / `CONNECTOR_CD` 编码即可；前端会统一格式化展示名称。
- 管理员端表格看到的新名称是展示层结果，编辑区域时仍会看到和保存后端真实名称，避免本次 UI 调整静默改库。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 精简学生选座页公共区域标题层级，只保留“公共区域位置”，避免“选择连廊座位 / 连廊区域”两个大标题重复。

### 本次改动
- 学生选座页导航区主标题改为 `公共区域位置`。
- `CampusIndoorMap` 在嵌入学生选座页时不再渲染自身 `连廊区域` 标题和副标题，仅保留楼层切换和区域地图。
- 保留 `CampusIndoorMap` 独立使用时的 `室内导航` 标题，不影响其它页面或组件测试。
- App 级测试同步约束嵌入导航区只显示 `公共区域位置`，不显示重复的 `连廊区域` 标题。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "switches reservation area|keeps floor changes|marks student reservation panels"`，确认测试失败于旧页面仍显示重复标题。
- 已运行 `npm run test -- App.test.tsx -t "switches reservation area|keeps floor changes|marks student reservation panels"`，3 个相关测试通过。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`，6 个组件测试通过，确认独立地图标题不受影响。

### 遗留问题
- 本次只调整标题文案层级，未修改选座数据、预约规则、签到验证或后端接口。

### 对其他成员的影响
- 学生预约端标题更清晰；不影响管理员端和同事签到验证流程。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 将学生选座页常驻预约规则胶囊改为越界/不可预约时才出现的警告提示。

### 本次改动
- 移除学生选座页常驻显示的整排预约规则说明，减少主界面信息噪音。
- 新增条件 `reservationWarningText`，仅在预约日期/时段不符合规则、当前已发布时段均不可预约等情况下渲染 `预约规则提示`。
- 将提示样式从蓝色规则胶囊改为黄色 warning 条，并增加 `role="alert"`，更符合异常提示语义。
- App 级测试覆盖正常状态不显示规则提示，以及超出可预约时段时显示 warning。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "marks student reservation panels"`，确认测试失败于旧页面仍常驻显示 `预约规则提示`。
- 已运行 `npm run test -- App.test.tsx -t "marks student reservation panels|shows the reservation rule warning"`，2 个相关测试通过。

### 遗留问题
- 本次只调整学生端提示展示策略，未修改预约规则接口、后端校验或签到流程。

### 对其他成员的影响
- 正常选座界面更简洁；真正超出预约范围时仍会显示明确 warning，不影响同事的签到验证开发。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 缩小学生选座页“选择路径”和预约统计信息，将其放到侧边浮窗，减少对主座位图界面的占用。

### 本次改动
- 将原先位于座位图上方的“选择路径”大卡片和“预约概览”三张统计卡合并为右侧 `预约确认浮窗`。
- 浮窗内保留楼层、区域、预约时段、桌座、可预约数量、占用/异常数量和日期，保证学生选座时仍能连续确认。
- 桌面端侧栏宽度收紧，浮窗跟随右侧预约操作区 sticky 显示；小屏下取消 sticky，随页面自然堆叠，避免遮挡主座位图。
- App 级测试同步约束：不再出现独立大块 `选择路径` / `预约概览`，改为 `预约确认浮窗`。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "keeps floor changes|connects floor, area, time, table, and seat|marks student reservation panels"`，确认测试失败于旧页面没有 `预约确认浮窗`。
- 已运行 `npm run test -- App.test.tsx -t "keeps floor changes|connects floor, area, time, table, and seat|marks student reservation panels"`，3 个相关测试通过。

### 遗留问题
- 本次只调整学生预约端信息布局，未改座位预约接口、签到验证、预约状态机或数据库结构。

### 对其他成员的影响
- 不影响同事正在做的签到验证和后端状态流转；学生选座页主画布可用空间更大。

## 2026-06-11

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 修复学生选座页日期分段控件中灰色框与“今天 / 明天”文字按钮显示不协调的问题。

### 本次改动
- 为学生选座页日期 `Segmented` 控件增加独立 `aria-label="预约日期"` 和 `student-seat-date-segmented` 样式类。
- 覆盖通用表单控件的 `width: 100%` 规则，桌面端让日期控件按内容宽度紧凑显示，避免灰色外框多出大块空白。
- 小屏下保留日期控件满宽展示，并让“今天 / 明天”两个选项均分宽度，避免文字被裁切或挤压。
- App 级测试补充日期控件样式断言，防止后续再次被通用表单规则误伤。

### 涉及文件
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "keeps floor changes"`，确认测试失败于旧日期控件没有独立 `预约日期` 标识和紧凑样式类。
- 已运行 `npm run test -- App.test.tsx -t "keeps floor changes"`，相关测试通过。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats`，确认日期控件外框约 140px，“今天 / 明天”各 68px，页面无横向溢出。
- 已运行 `npm run test`，8 个测试文件、70 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- 本次只修复日期控件显示问题，未调整其它筛选控件的信息结构。

### 对其他成员的影响
- 不修改接口、数据库、签到验证、预约状态机和服务器部署边界。

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 将学生端室内导航和选座筛选合并为一个实用、清晰、可响应式适配的选座导航板块。

### 本次改动
- 学生选座页新增统一的 `选座导航` 控制区，把连廊区域选择、当前楼层/区域/占用率、日期、开始时间、结束时间和刷新座位合并在同一板块内。
- `CampusIndoorMap` 增加嵌入模式，保留原组件单独使用时的 `室内导航` 外壳，同时允许学生选座页将其作为控制区内部的连廊选择组件使用。
- 移除学生端旧的独立 `选座筛选` 大卡片，减少重复标题和上下割裂感。
- 优化窄屏布局优先级，确保时间表单在小宽度下单列展示，避免横向溢出。
- 更新 App 级测试，约束学生选座页只出现一个 `选座导航` 自适应框，并确认连廊区域和开始/结束时间在同一板块内。

### 涉及文件
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已先运行 `npm run test -- App.test.tsx -t "switches reservation area from the indoor map|keeps floor changes|marks student reservation panels"`，确认新测试失败于旧页面没有统一 `选座导航` 区域。
- 已运行 `npm run test -- App.test.tsx -t "switches reservation area from the indoor map|keeps floor changes|marks student reservation panels"`，3 个相关测试通过。
- 已运行 `npm run test -- CampusIndoorMap.test.tsx`，6 个组件测试通过。
- 已运行 `npm run test`，8 个测试文件、70 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn -q test`，后端测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已用内置浏览器打开 `http://127.0.0.1:5173/student/seats`，确认页面只保留一个 `选座导航` 区域，内部同时包含连廊区域和预约时间；旧 `室内导航` / `选座筛选` 独立区域不再出现。
- 已在当前窄宽浏览器下检查布局指标，确认 `选座导航` 无横向溢出。

### 遗留问题
- 本次只合并学生选座入口的 UI 信息层级，未调整座位图、预约状态机、签到验证或后端接口。
- 后续可继续精简 `选择路径` 与 `预约概览` 的信息密度，让学生端首屏更聚焦可选座位。

### 对其他成员的影响
- 不修改签到验证、二维码签到、预约接口、数据库结构和服务器部署边界。
- `CampusIndoorMap` 原有单独渲染行为保留，新增嵌入模式只服务当前学生选座页。

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 学生预约端暂时只展示 A/B 连廊和 B/C 连廊两个选座区域，并在地图入口显示当前占用率。

### 本次改动
- 新增连廊归类工具，统一判断学生端可见区域、楼层显示规则和占用率展示标签。
- 学生端室内导航改为只渲染 `A/B 连廊` 与 `B/C 连廊`，不再展示 A、B、C、D 楼栋卡片或其它普通区域入口。
- 学生选座页区域下拉同步过滤为连廊区域，避免地图入口和下拉选择不一致。
- 按当前日期和选定时段为可见连廊区域计算占用率，在连廊卡片中显示 `占用率 xx%` 或暂无数据提示。
- 收紧连廊名称推断规则，避免 `Teaching Building Area B` 这类普通教学楼英文名称被误判为 A/B 连廊。
- 拆分学生选座页基础数据加载和座位时段加载，避免切换/刷新后 `刷新座位` 按钮长时间保持 loading。
- 管理端区域维护文案同步为 `B/C 连廊`，并补充演示数据迁移，将既有示例区域归类到两个连廊学习区。
- 更新接口示例和契约说明，保留旧 `CONNECTOR_CD` 数据兼容，但前端当前按 `B/C 连廊` 展示。

### 涉及文件
- frontend/src/utils/campusConnectors.ts
- frontend/src/components/CampusIndoorMap.tsx
- frontend/src/components/CampusIndoorMap.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/pages/AdminAreasPage.tsx
- frontend/src/App.test.tsx
- frontend/src/styles/main.css
- backend/src/main/resources/db/migration/V18__align_demo_areas_to_connector_seating.sql
- docs/API_EXAMPLES.md
- docs/architecture/API_CONTRACT.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- CampusIndoorMap.test.tsx App.test.tsx`。
- 已运行 `npm run test -- App.test.tsx -t "finishes student seat loading|switches reservation area|keeps floor changes"`。
- 已运行 `npm run test`。
- 已运行 `npm run lint`。
- 已运行 `npm run build`。
- 已运行 `mvn -q test`。
- 已运行 `git diff --check`。
- 已重启本地后端到 `smart_seat_login_preview_20260611`，确认 Flyway 从 V17 执行到 V18。
- 已用浏览器打开 `http://127.0.0.1:5173/student/seats`，检查学生选座入口只显示 A/B 连廊、B/C 连廊，并展示占用率；切换 B/C 连廊后座位图正常显示且刷新按钮不再长时间 loading。

### 遗留问题
- 本次按用户要求暂时隐藏其它楼栋和普通区域入口，没有物理删除数据库区域、桌子或座位数据。
- 旧 `CONNECTOR_CD` 编码仍保留兼容说明，后续如需要彻底改名为 `CONNECTOR_BC`，建议单独做一次后端枚举、迁移和文档清理。

### 对其他成员的影响
- 学生预约端当前只暴露两个连廊学习区，普通楼栋区域不会出现在预约入口。
- 不修改签到验证、二维码签到、预约状态机和服务器部署边界。

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 修正登录前展示误导和本地登录进不去的问题，保证登录页按未登录学生视角展示，并完整跑通学生账号登录。

### 本次改动
- 将登录页右侧“已预约 / 我的预约 / A区-2F-026”静态预约卡改为“学生预约流程”说明卡，避免未登录前出现像真实学生预约数据的界面。
- 保留浅色科技风和座位地图展示，但展示内容改为中性流程：选择空间、确认桌座、到场扫码、开始使用。
- 登录页测试新增约束：未登录前不应显示 `我的预约`、`已预约`、`A区-2F-026`，应显示 `学生预约流程`。
- 定位本地登录失败根因：前端代理 `/api/auth/login` 返回 502 是因为后端未运行；后端启动后登录 500 是因为旧 Redis 容器未发布宿主机 6379 端口，导致 session 写入 Redis 失败。
- 新增本地预览 Redis 容器 `smart-seat-redis-login-preview`，映射 `127.0.0.1:16379->6379`，并以 `REDIS_PORT=16379` 重启后端。
- 使用新演示库 `smart_seat_login_preview_20260611` 跑通 Flyway V1-V17，避免影响本机旧库。

### 涉及文件
- frontend/src/pages/LoginPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "renders the polished login page"`，先确认“学生预约流程”测试失败，再实现后通过。
- 已运行 `npm run test`，8 个测试文件、68 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已通过 `POST http://127.0.0.1:5173/api/auth/login` 验证学生账号 `20260001 / 123456` 返回 token。
- 已通过 `GET http://127.0.0.1:18080/actuator/health` 验证后端健康状态为 `UP`。
- 已用内置浏览器打开 `http://127.0.0.1:5173/login`，确认未登录前不再显示真实预约卡，并点击登录成功跳转到 `http://127.0.0.1:5173/student/home`。

### 遗留问题
- 本地当前使用临时预览 Redis 端口 `16379`，原因是 Windows 拒绝绑定 `127.0.0.1:6379`；后续如果要长期固定本地环境，可以清理旧工作树 Redis 容器后按项目 compose 重新发布 6379。
- 本次仍只修改登录页展示和测试，不修改后端业务代码、数据库迁移或签到验证流程。

### 对其他成员的影响
- 不影响签到验证、预约接口、二维码 token、后端状态机和共享数据库服务器。
- 本地新增的 `smart-seat-redis-login-preview` 容器仅用于当前电脑预览，不属于提交内容。

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-light-tech-login-showcase
- 目标: 在已备份当前成果后，参考图片的信息层级尝试登录页浅色科技风 UI，并跑通本地演示地址。

### 本次改动
- 从最新 `main` 创建独立功能分支 `feature/AmorLX-light-tech-login-showcase`，避免直接在 `main` 开发。
- 新增浅色科技风登录展示区：系统标题、功能能力标签、座位地图预览、预约凭证卡和学生/签到/管理员/状态追踪流程卡。
- 保留原有登录表单、学生/管理员演示账号、一键填充账号密码和登录跳转逻辑不变。
- 优化登录页响应式：桌面端左右分栏，手机端同一页面纵向堆叠；修正内容高于视口时顶部被裁切的问题。
- 新增设计文档和实施计划，记录本次 UI 尝试范围。
- 更新 App 级测试，覆盖登录页新增展示文案并继续验证管理员快捷账号填充。

### 涉及文件
- frontend/src/pages/LoginPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/plans/2026-06-11-light-tech-login-showcase-design.md
- docs/plans/2026-06-11-light-tech-login-showcase.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "renders the polished login page"`，先确认新展示内容测试失败，再实现并通过。
- 已运行 `npm run test`，8 个测试文件、68 个测试通过；jsdom 仍提示不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已启动前端 dev server，并用内置浏览器打开 `http://127.0.0.1:5173/login` 验证桌面端新版浅色科技 UI 可见、无横向溢出、顶部不被裁切。
- 已用 390px 手机视口验证登录页同一套页面可响应式堆叠，表单和登录按钮可滚动访问，无横向溢出。

### 遗留问题
- 本次只优化登录展示页，不修改学生预约端、管理员端座位管理、签到验证和后端状态机。
- 当前座位地图和二维码是登录页展示用静态视觉预览，不接入真实座位数据。

### 对其他成员的影响
- 不修改 API、数据库迁移、签到验证、二维码 token、预约规则接口和共享数据库连接方式。
- 同事正在做的签到验证流程不受影响。

## 2026-05-26

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-login-page-polish
- 目标: 让学生首页、我的预约和普通内容页在主内容区域中居中展示，并检查不影响宽画布座位页。

### 本次改动
- 为 `.page` 公共页面容器补充 `width: 100%`、`min-width: 0` 和 `margin-inline: auto`，普通页面在宽屏下按最大宽度居中。
- 学生首页根容器新增 `student-home-page` 语义类，便于后续样式和测试定位。
- 我的预约根容器新增 `student-reservations-page` 语义类，保持与学生首页一致。
- 补充 App 级测试，覆盖学生首页和我的预约页面使用对应内容包装类。
- 新增本次居中调整的设计说明和实施计划文档。

### 涉及文件
- frontend/src/App.test.tsx
- frontend/src/pages/StudentHomePage.tsx
- frontend/src/pages/MyReservationsPage.tsx
- frontend/src/styles/main.css
- docs/plans/2026-05-26-student-pages-centering-design.md
- docs/plans/2026-05-26-student-pages-centering.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "centers"`，先确认缺少页面语义类时测试失败，再实现后通过。
- 已运行 `npm run test -- App.test.tsx`，33 个 App 测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run test`，前端 68 个测试通过；测试环境仍有同类 jsdom 提示，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已在浏览器打开 `http://127.0.0.1:5173/student/home`、`http://127.0.0.1:5173/student/reservations`、`http://127.0.0.1:5173/student/seats` 和 `http://127.0.0.1:5173/admin/dashboard`，确认页面无横向溢出，学生首页和我的预约根容器已使用对应语义类。

### 遗留问题
- 当前浏览器窗口内容区宽度小于 1180px，页面自然占满内容区；宽屏居中由 `.page` 的最大宽度和 `margin-inline: auto` 保证。

### 对其他成员的影响
- 本次只修改前端布局容器和测试，不修改签到验证、预约接口、后端状态机、数据库迁移或同事开发日志。

## 2026-05-26

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-login-page-polish
- 目标: 优化登录界面第一屏观感，保持学生/管理员演示登录流程不变，并继续为手机端同一套页面适配做准备。

### 本次改动
- 登录页改为克制的业务入口布局，桌面端左侧展示系统定位和能力摘要，右侧保留登录表单。
- 新增“实时座位”“预约与扫码签到”“管理员一屏调度”三项能力提示，方便 demo 时说明系统价值。
- 将原演示账号单选按钮升级为学生/管理员快捷账号卡片，点击后仍自动填入账号和密码。
- 新增响应式样式，移动端登录页单列展示，快捷账号卡片和能力提示不横向溢出。
- 补充 App 级登录页测试，覆盖能力摘要和管理员快捷账号填充行为。
- 新增登录页优化设计说明和实施计划文档。

### 涉及文件
- frontend/src/pages/LoginPage.tsx
- frontend/src/styles/main.css
- frontend/src/App.test.tsx
- docs/plans/2026-05-26-login-page-polish-design.md
- docs/plans/2026-05-26-login-page-polish.md
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "renders the polished login page"`。
- 已运行 `npm run test -- App.test.tsx`，31 个 App 测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已在浏览器打开 `http://127.0.0.1:5173/login`，确认桌面端 `bodyOverflowX=0`，登录主体为两列布局，管理员快捷账号可填入 `admin/admin`，并存在移动端单列规则。

### 遗留问题
- 本次只优化登录界面，不新增验证码、记住登录、忘记密码或真实统一身份认证入口。

### 对其他成员的影响
- 本次不修改认证接口、Token 存储、路由守卫、后端登录逻辑、签到验证和数据库迁移。

## 2026-05-25

### 任务
- Issue: PR #23 GitHub Actions `CI / Frontend` 失败
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 修复学生选座页在 GitHub Actions Linux/UTC 环境下的时间段测试失败，保持业务规则按北京时间计算。

### 本次改动
- 新增前端业务时间工具，统一将学生预约端当前日期、明日开放判断、未来时段判断转换为 `Asia/Shanghai`。
- 学生选座页不再依赖运行机器本地时区计算“今天/明天”和最早可预约半小时段。
- App 集成测试的日期和下一半小时辅助函数改为按同一业务时区生成，复现并覆盖 CI 暴露的 UTC 环境问题。

### 涉及文件
- frontend/src/utils/businessTime.ts
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/App.test.tsx
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `$env:TZ='UTC'; npm run test -- App.test.tsx`，30 个测试通过，覆盖 GitHub Actions 报错的两个用例。
- 已运行 `$env:TZ='UTC'; npm run test`，前端 65 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。

### 遗留问题
- 本次只修复学生选座页预约时段的业务时区一致性；管理员开放时段页仍沿用当前本地 dayjs 逻辑，后续如要统一全站时区可单独处理。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、数据库迁移和后端状态机。
- 前端如新增与“今天/明天/预约开放时间”相关逻辑，建议复用 `businessTime.ts`，避免本地与 CI 时区差异。

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 继续优化学生选座和管理员定位的使用体验，让下一步动作更明确。

### 本次改动
- 学生端已选座位卡片新增下一步提示，提醒确认座位和时间后提交预约，成功后到座扫码签到。
- 管理员桌子管理页的学生视角座位图新增定位提示，显示当前区域座位数量，并说明点击座位可查看系统编号和启停状态。
- 为新增提示补充 App 集成测试，覆盖学生预约流程和管理员学生视角座位图。
- 新增统一提示样式，保持与现有信息卡片一致，并继续适配移动端布局。

### 涉及文件
- frontend/src/App.test.tsx
- frontend/src/pages/SeatSlotsPage.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "concrete seat reservation"`。
- 已运行 `npm run test -- App.test.tsx -t "renders a student-view seat map on the admin table page"`。
- 已运行 `npm run test`，前端 65 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已在浏览器打开 `http://127.0.0.1:5173/student/seats`，选中座位后确认下一步提示出现，页面横向溢出为 0。
- 已在浏览器打开 `http://127.0.0.1:5173/admin/tables`，确认管理员定位提示出现，页面横向溢出为 0。

### 遗留问题
- 本次只优化前端提示和引导文案，不改预约提交、扫码签到和管理员维护的业务状态流转。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、数据库迁移和后端状态机。

## 2026-05-25

### 任务
- Issue: 暂无
- 分支: feature/AmorLX-student-seat-mobile-flow
- 目标: 同步优化管理员桌子管理页的座位渲染区域，让管理员端也保持两端对齐和居中显示。

### 本次改动
- 为管理员桌子管理页增加 `admin-seat-layout-page` 和 `admin-seat-centered-page` 页面标识。
- 将桌子筛选、桌子统计、桌子列表、区域桌位平面图和学生视角座位图统一放入 `admin-seat-adaptive-frame` 内容轨道。
- 新增管理员端内容宽度变量，桌面端统一为 960px 居中显示，移动端沿用现有满宽响应式规则。
- 补充管理员桌子管理页回归测试，防止后续遗漏统一框体类名。

### 涉及文件
- frontend/src/App.test.tsx
- frontend/src/pages/AdminTablesPage.tsx
- frontend/src/styles/main.css
- docs/dev-logs/AmorLX.md

### 验证方式
- 已运行 `npm run test -- App.test.tsx -t "renders a student-view seat map on the admin table page"`。
- 已运行 `npm run test -- App.test.tsx TableLayoutPreview.test.tsx SeatMap.test.tsx`。
- 已运行 `npm run test`，前端 65 个测试通过；测试环境仍提示 jsdom 不支持 pseudo-element `getComputedStyle` 和 QRCode canvas，不影响通过结果。
- 已运行 `npm run lint`，前端 lint 通过。
- 已运行 `npm run build`，前端生产构建通过。
- 已运行 `mvn test`，后端 93 个测试通过。
- 已运行 `git diff --check`，未发现空白格式错误；仅有 Windows 换行提示。
- 已在浏览器打开 `http://127.0.0.1:5173/admin/tables` 测量 5 个主要框体，均为 `left=269`、`right=1229`、`width=960`，页面横向溢出为 0。

### 遗留问题
- 本次只优化管理员桌子管理页中与座位渲染相关的主框体，不调整开放时段页和其它管理页的业务流程。

### 对其他成员的影响
- 本次不修改签到验证、WiFi/IP 校验、签到码校验、数据库迁移和后端状态机。

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
