# Global Motion Design

## Goal
- 让登录页、学生端、管理员端、签到页和后续新增页面都具备统一、克制的浅色科技动效。

## Scope
- 全局页面进入动效：所有受保护业务页通过布局层继承，登录页和路由加载页单独覆盖。
- 全局交互反馈：卡片、表格行、列表项、表单区、提示条、浮窗和地图区域获得统一 hover/focus/active 微动效。
- 重点状态动效：异常、锁位、选中座位、当前区域、高利用区域和 warning 使用更明显但不闪烁的强调。
- 移动端和可访问性：小屏动效更短，继续遵守 `prefers-reduced-motion`。

## Approach
- 在 `AppLayout` 的 `Content` 上加全局 motion 容器类，让所有登录后的页面自动继承。
- 登录页保留现有浅色科技背景，同时增加全局 motion page 类，避免未登录页面成为例外。
- 在 `main.css` 中新增 motion token、通用 keyframes 和通用选择器，复用已有 `panel-rise`、扫描线和 hover 语言。
- 不改接口、数据库、签到验证、预约状态机或服务器部署边界。

## Verification
- 增加 App 级测试，确认登录页和受保护页面都带全局 motion 入口。
- 运行前端测试、lint、build、`git diff --check`。
- 用浏览器检查登录页、学生选座、我的预约、管理员区域、管理员看板、签到页在桌面和移动宽度下无横向溢出。
