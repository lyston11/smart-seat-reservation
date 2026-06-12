# Global Motion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为全站页面增加统一、浅色科技风、可降级的动效体系。

**Architecture:** 通过布局层和全局 CSS 建立 motion 入口，登录页单独加同类 class，业务页继续复用现有 `.page`。动效主要由 CSS 完成，避免在每个页面组件里写重复逻辑。

**Tech Stack:** React, TypeScript, Vite, Ant Design, Vitest, CSS。

---

### Task 1: Motion Entry Tests

**Files:**
- Modify: `frontend/src/App.test.tsx`

**Steps:**
1. 写失败测试，确认登录页 `.login-page` 包含 `motion-page`。
2. 写失败测试，确认受保护页面的 `.app-content` 包含 `motion-viewport`。
3. 运行 focused App 测试，确认旧实现失败于缺少 motion class。

### Task 2: Shared Motion Entry

**Files:**
- Modify: `frontend/src/layout/AppLayout.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`

**Steps:**
1. 给 `AppLayout` 的 `Content` 增加 `motion-viewport`。
2. 给登录页根容器增加 `motion-page`。
3. 运行 focused App 测试，确认 motion class 断言通过。

### Task 3: Global Motion CSS

**Files:**
- Modify: `frontend/src/styles/main.css`

**Steps:**
1. 新增全局 motion token 和 keyframes：页面进入、微光扫描、状态脉冲。
2. 为 `.motion-viewport > .page`、`.motion-page`、`.route-loading` 增加进入动效。
3. 为卡片、表格行、表单区、地图区、提示条、浮窗、列表项增加统一 transition 和 hover/focus 行为。
4. 为异常、锁位、选中座位、warning 和当前区域增加更明显但克制的强调动效。
5. 保留并扩展 `prefers-reduced-motion` 降级。

### Task 4: Verification

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

**Steps:**
1. 运行 focused App 测试。
2. 运行 `npm run test`、`npm run lint`、`npm run build`、`git diff --check`。
3. 浏览器检查登录页、学生选座、我的预约、管理员区域、管理员看板、签到页桌面端和移动端无横向溢出。
4. 追加 AmorLX 开发日志。
