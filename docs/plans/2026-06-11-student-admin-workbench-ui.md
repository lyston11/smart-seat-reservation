# Student And Admin Workbench UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将学生首页和管理员看板改为更清晰、响应式、带浅色科技感动效的工作台布局。

**Architecture:** 只改前端页面结构和共享 CSS，不改 API、数据库和业务状态机。学生首页复用现有预约数据和操作函数；管理员看板复用现有 dashboard/rules 接口。

**Tech Stack:** React, TypeScript, Ant Design, Vitest, CSS。

---

### Task 1: Student Home Workbench Structure

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/pages/StudentHomePage.tsx`
- Modify: `frontend/src/styles/main.css`

**Steps:**
1. Write a failing App test that expects `学生预约工作台`, `今日状态`, `快捷入口`, and `当前预约` on the student home page.
2. Run the focused App test and confirm it fails on the old layout.
3. Update `StudentHomePage.tsx` to add workbench containers, quick action panel, improved stat cards, and a side column.
4. Add CSS for `.student-workbench-*` and responsive behavior.
5. Run the focused test until it passes.

### Task 2: Admin Dashboard Workbench Structure

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/pages/AdminDashboardPage.tsx`
- Modify: `frontend/src/styles/main.css`

**Steps:**
1. Write a failing App test that expects `管理员运营工作台`, `运行概览`, `异常处理`, and `区域利用率` on the admin dashboard.
2. Run the focused App test and confirm it fails on the old layout.
3. Update `AdminDashboardPage.tsx` to add top control shell, compact metric cards, anomaly panel, lock operation panel, and usage ranking panel.
4. Add CSS for `.admin-workbench-*` and responsive behavior.
5. Run the focused test until it passes.

### Task 3: Motion And Verification

**Files:**
- Modify: `frontend/src/styles/main.css`
- Modify: `docs/dev-logs/AmorLX.md`

**Steps:**
1. Add shared light-tech motion styles with reduced-motion support.
2. Run focused App tests for student/admin workbench pages.
3. Run `npm run test`, `npm run lint`, `npm run build`, and `git diff --check`.
4. Verify `/student/home` and `/admin/dashboard` in browser.
5. Append AmorLX development log.
