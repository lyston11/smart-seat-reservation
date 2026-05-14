# 项目开发协作规范

本文档用于说明 `smart-seat-reservation` 项目的 GitHub 协作方式。团队成员开始开发前，应先阅读并遵守本规范。

## 1. 协作模式

本项目采用：

```text
一个 GitHub 主仓库 + 每个人开发自己的功能分支 + Pull Request 合并
```

不建议三个人各自维护独立仓库。团队成员应加入同一个 GitHub 仓库作为 Collaborator，然后从主仓库拉取代码、创建分支、提交 Pull Request。

推荐结构：

```text
main                         稳定主分支
feature/reservation-flow     功能分支
feature/seat-map             功能分支
feature/admin-dashboard      功能分支
fix/login-error              修复分支
docs/update-development      文档分支
```

`main` 分支代表当前稳定版本，不直接在 `main` 上开发。

## 2. 基本原则

- 所有开发都从 `main` 创建新分支。
- 每个功能、修复或文档改动尽量对应一个 Issue。
- 每个 Issue 尽量对应一个功能分支和一个 Pull Request。
- 每位成员必须维护自己的开发日志文档。
- 每次开发前必须先阅读自己和其他成员的开发日志。
- 不直接向 `main` 分支提交代码。
- Pull Request 至少由另一名成员检查后再合并。
- AI 可以负责生成代码，但提交者必须理解、运行和检查代码。
- 不提交密码、Token、私钥、数据库连接密钥等敏感信息。
- 不在一个 Pull Request 中混合多个无关功能。

## 3. GitHub 仓库设置建议

建议在 GitHub 仓库中开启以下设置：

- 开启 Issues。
- 开启 Pull Requests。
- 创建 GitHub Project 用于管理任务状态。
- 保护 `main` 分支。
- 禁止直接 push 到 `main`。
- 要求 Pull Request 才能合并。
- 要求至少 1 个 Review 通过。
- 合并方式优先使用 Squash and merge，让提交历史更清晰。

## 4. 技术栈与开发路线

本项目面向全校高峰期预约场景，后端采用 Java 技术栈，数据库作为最终一致性来源，Redis 只作为缓存和限流辅助。

```text
前端：React + TypeScript + Vite + Ant Design
后端：Java 21 + Spring Boot 4 + MyBatis-Plus
数据库：MySQL 8.4
缓存：Redis 7
数据库迁移：Flyway
接口文档：springdoc-openapi
本地依赖：Docker Compose
```

开发路线：

```text
先搭单体项目骨架
再完成座位资源管理
再完成预约、签到、签退主流程
再补缓存、限流、超时释放和压测
最后补充完整部署配置和验收文档
```

详细说明见：

- [项目开发大纲](./docs/PROJECT_OUTLINE.md)
- [系统架构说明](./docs/architecture/ARCHITECTURE.md)
- [本地开发与部署路线](./docs/deployment/LOCAL_DEVELOPMENT.md)

## 5. 日常开发流程

第一次拉取项目：

```bash
git clone git@github.com:lyston11/smart-seat-reservation.git
cd smart-seat-reservation
```

每次开始新任务前，先同步主分支：

```bash
git checkout main
git pull origin main
```

然后阅读开发日志：

```bash
ls docs/dev-logs
```

需要阅读：

- 自己的开发日志。
- 其他成员最近的开发日志。
- 与当前任务相关的日志记录。

确认没有重复开发、接口冲突或数据库字段冲突后，再为当前任务创建分支：

```bash
git checkout -b feature/seat-map
```

完成开发后检查改动：

```bash
git status
git diff
```

提交代码：

```bash
git add .
git commit -m "feat: add seat map page"
```

推送分支：

```bash
git push origin feature/seat-map
```

然后在 GitHub 上创建 Pull Request，等待其他成员 Review。

PR 合并后，本地同步最新代码：

```bash
git checkout main
git pull origin main
```

合并或结束当天开发后，更新自己的开发日志，记录本次分支、Issue、改动内容、验证方式和遗留问题。

## 6. Issue 使用规范

所有想法、任务、问题都优先写成 Issue。Issue 用来记录「要做什么」，Pull Request 用来记录「做了什么」。

Issue 标题建议简短明确：

```text
实现学生预约座位功能
添加管理员座位管理页面
修复重复预约同一座位的问题
```

Issue 内容建议包含：

```md
## 目标
说明这个任务要解决什么问题。

## 范围
- 需要实现的功能点
- 不包含的内容

## 验收标准
- 什么情况下可以认为这个任务完成
- 如何验证功能正常
```

如果是 bug，建议包含：

```md
## 问题描述
说明出现了什么异常。

## 复现步骤
1. 打开什么页面
2. 点击什么按钮
3. 出现什么结果

## 期望结果
说明正确行为应该是什么。
```

## 7. 个人开发日志规范

每位成员都需要在 `docs/dev-logs/` 下维护自己的开发日志。日志文件名建议使用成员姓名或 GitHub 用户名：

```text
docs/dev-logs/zhangsan.md
docs/dev-logs/lisi.md
docs/dev-logs/wangwu.md
```

开发日志用于让团队和 AI 快速了解：

- 谁在做什么。
- 当前使用哪个分支。
- 关联哪个 Issue。
- 已经改了哪些文件或模块。
- 本次是否完成验证。
- 还剩哪些问题。
- 是否影响其他成员。

每次开发前必须先阅读所有成员的开发日志，尤其是最近记录。这样可以避免重复实现、接口字段不一致、数据库设计冲突和多人同时改同一块代码。

每次开发结束后必须更新自己的开发日志。建议追加记录，不要覆盖旧记录。

日志模板：

```md
## 2026-05-13

### 任务
- Issue:
- 分支:
- 目标:

### 本次改动
- 

### 涉及文件
- 

### 验证方式
- 

### 遗留问题
- 

### 对其他成员的影响
- 
```

如果当天只是调研或设计，也要记录结论，方便其他成员和 AI 后续接上。

## 8. Pull Request 规范

PR 标题建议使用清晰的动词开头：

```text
feat: add reservation creation api
fix: prevent duplicate booking
docs: add development guide
```

PR 描述建议包含：

```md
## 改动内容
- 本次修改了什么
- 新增了什么能力

## 验证方式
- 本地运行了什么命令
- 手动测试了什么流程

## 关联 Issue
Closes #1
```

如果是前端页面改动，建议附上截图或录屏。

合并前检查：

- 代码能正常运行。
- 没有明显报错。
- 没有提交无关文件。
- 没有泄露敏感信息。
- 已更新自己的开发日志。
- 数据库字段、接口路径、页面路由命名清晰。
- 影响其他成员工作的改动已在 PR 中说明。

## 9. 分支命名规范

分支名称使用小写英文和连字符。

常用格式：

```text
feature/功能名称
fix/问题名称
docs/文档名称
refactor/重构名称
test/测试名称
chore/配置或杂项名称
```

示例：

```text
feature/student-login
feature/seat-reservation
feature/admin-seat-management
fix/reservation-time-conflict
docs/update-api-guide
```

## 10. 提交信息规范

提交信息使用以下格式：

```text
类型: 简短说明
```

常见类型：

```text
feat: 新功能
fix: 修复问题
docs: 文档修改
style: 样式调整
refactor: 代码重构
test: 测试相关
chore: 配置、依赖、构建等杂项
```

示例：

```text
feat: add seat reservation api
fix: prevent booking occupied seat
docs: add collaboration workflow
```

## 11. AI 辅助开发约定

本项目可以大量使用 AI 辅助开发，但要遵守以下约定：

- 每次使用 AI 前，先让 AI 阅读 `AGENTS.md`。
- 每次让 AI 开发前，先让 AI 阅读 `docs/dev-logs/` 下所有成员最近的开发日志。
- AI 开发结束后，应协助更新当前成员的开发日志。
- 提问前先说明当前任务、相关文件、期望结果。
- 尽量让 AI 一次只处理一个明确任务。
- 不让 AI 大范围重写无关代码。
- AI 生成代码后，开发者必须阅读关键逻辑。
- AI 生成代码后，必须本地运行或手动验证。
- 涉及登录、权限、预约冲突、数据删除等关键逻辑时，要重点人工检查。
- 不把账号密码、私钥、数据库真实地址发给 AI。
- 不把看不懂、没运行过的代码直接合并进 `main`。

推荐给 AI 的任务描述格式：

```text
我正在开发学院座位预约系统。
当前任务是实现学生创建预约功能。
请基于现有项目结构修改代码。
要求：
1. 学生只能预约空闲座位
2. 同一时间段不能重复预约同一座位
3. 预约成功后座位状态变为已预约
4. 给出需要运行的测试或验证步骤
5. 完成后更新我的开发日志
```

## 12. 任务拆分建议

本项目可以先拆分为以下 Issue：

- 初始化项目结构。
- 设计数据库表：用户、区域、座位、预约、签到记录。
- 实现学生登录或身份识别。
- 实现座位区域和座位列表。
- 实现可视化座位状态。
- 实现创建预约。
- 实现预约冲突校验。
- 实现扫码签到。
- 实现签退释放座位。
- 实现超时未签到自动释放。
- 实现管理员发布座位资源。
- 实现管理员配置开放时段和预约规则。
- 实现管理员查看实时座位占用情况。
- 实现管理员手动释放异常占用座位。

## 13. 冲突处理

如果自己的分支落后于 `main`，先同步：

```bash
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main
```

如果出现冲突：

1. 打开冲突文件。
2. 保留正确代码。
3. 删除冲突标记。
4. 本地运行项目或相关测试。
5. 提交冲突解决结果。

不要为了快速解决冲突而删除其他成员的代码。如果不确定，应在群里说明冲突文件和冲突原因。

## 14. 沟通规则

- 开始做某个任务前，先在 Issue 下留言或把自己 Assign 上。
- 开发前先阅读所有成员开发日志，确认没有重复工作。
- 开发结束后更新自己的开发日志。
- 修改公共接口、数据库字段、路由结构时，应提前在 Issue 或群里说明。
- PR 卡住时，在 PR 评论中写清楚当前问题。
- 发现更好的功能想法，先建 Issue，不要直接混进当前 PR。
- 每个人都可以提出产品想法，但进入开发前要拆成具体任务。

## 15. 推荐开发节奏

每次开发尽量保持小步提交：

```text
选一个 Issue
同步 main
阅读所有成员开发日志
创建一个分支
实现一个小功能
本地验证
更新自己的开发日志
提交 PR
等待 Review
合并到 main
同步 main
继续下一个 Issue
```

这种方式最适合三人使用 AI 协作开发：每个人可以自由探索功能想法，但最终都通过 Issue 和 PR 汇总到同一个稳定主仓库。
