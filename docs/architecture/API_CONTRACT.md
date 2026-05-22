# API 接口契约说明

本文档用于约束后端 Controller、前端 API 模块和接口文档的组织方式。新增接口时先确认所属业务域，避免把不同职责继续堆到同一个文件。

## 1. 统一响应格式

所有业务接口统一返回：

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

失败时 `success=false`，`code` 使用稳定错误码，`message` 给前端展示或调试。前端 `src/api/http.ts` 只向页面返回 `data`，错误统一抛出 `Error(message)`。

## 2. 后端路径分组

后端路径常量集中在 `backend/src/main/java/com/lyston/smartseat/common/ApiPaths.java`。

| 分组 | 路径 | 说明 |
| --- | --- | --- |
| Auth | `/api/auth` | 登录、退出、当前用户 |
| Areas | `/api/areas` | 区域资源 |
| Tables | `/api/tables` | 桌子资源和桌码 |
| Seats | `/api/seats` | 座位资源和座位码 |
| Seat Slots | `/api/seat-slots` | 开放时段查询、发布、撤销 |
| Reservations | `/api/reservations` | 学生预约、签到、签退、锁位 |
| Reservation Rules | `/api/reservations/rules` | 预约规则查询和管理员维护 |
| Admin Seat Slots | `/api/admin/seat-slots` | 管理员释放、异常占用、恢复 |
| Admin Reservations | `/api/admin/reservations` | 管理员手动触发过期释放、WiFi 离线释放、锁位过期释放 |
| Admin Dashboard | `/api/admin/dashboard` | 管理员看板 |
| Admin Audit Logs | `/api/admin/audit-logs` | 管理员审计日志 |

原则：

- 学生端业务动作放在 `/api/reservations`。
- 管理员维护类动作放在 `/api/admin/**`。
- 资源 CRUD 保持清晰名词路径，不把复杂业务动作塞进资源列表接口。
- 新增 Controller 时优先复用 `ApiPaths`，不要直接硬编码完整 `/api/...` 字符串。
- `GET /api/seat-slots` 返回的 `status` 允许包含展示态 `LOCKED`。该值从关联 `reservations.status` 派生，表示座位正在锁位中；持久化的 `seat_slots.status` 仍保持原有库存状态机。
- `POST /api/seat-slots/publish` 用于单日发布；`POST /api/seat-slots/publish-batch` 用于管理员按选中日期批量发布，`slotDates` 可连续也可不连续。
- `GET/POST /api/seat-slots/publish-plans` 用于查询和创建持续开放计划；`POST /api/seat-slots/publish-plans/{planId}/stop` 用于从某天起停止计划。
- `DELETE /api/seat-slots/{seatSlotId}` 用于撤销单个空闲时段；`DELETE /api/seat-slots?areaId=&date=` 用于撤销指定区域某天所有未被预约的空闲时段，并返回已保留的不可撤销数量。
- `POST /api/seat-slots/cancel-batch` 用于撤销选中日期或日期范围，可同时写入开放例外，避免持续开放计划或自动发布任务重新生成这些日期。
- `GET/POST/PUT /api/areas` 的区域对象包含预约端室内地图元数据：`buildingCode` 可选 `A`、`B`、`C`、`D`、`CONNECTOR`、`CONNECTOR_AB`、`CONNECTOR_CD`，其中 `CONNECTOR` 兼容表示 A/B 连廊；`areaType` 可选 `STUDY_ROOM`、`HALL`、`CORRIDOR`、`CONNECTOR`，`floorCode` 用于地图楼层展示，`mapX/mapY` 是 `0-100` 的可选地图坐标。预约端地图仅在 `2F`、`3F` 渲染 A/B 与 C/D 连廊，未配置地图元数据的旧区域仍由前端按名称、楼层和描述兼容推断。

## 3. 前端 API 模块边界

前端路径常量集中在 `frontend/src/api/endpoints.ts`，请求封装集中在 `frontend/src/api/http.ts`。

| 模块 | 负责内容 |
| --- | --- |
| `auth.ts` | 登录、退出、当前用户 |
| `areas.ts` | 区域 CRUD |
| `tables.ts` | 桌子 CRUD、桌码 |
| `seats.ts` | 座位 CRUD、座位码 |
| `seatSlots.ts` | 开放时段查询、发布、撤销 |
| `reservations.ts` | 学生预约、签到、签退、锁位、桌码/座位码签到、WiFi 心跳 |
| `reservationRules.ts` | 预约规则查询和更新 |
| `adminSeatSlots.ts` | 管理员释放座位时段、标异常、恢复异常 |
| `adminReservations.ts` | 管理员手动维护预约状态任务 |
| `dashboard.ts` | 管理员看板 |
| `audit.ts` | 审计日志 |

页面组件只 import 业务 API 函数，不直接拼 URL，不直接 new `URLSearchParams`。需要 query 参数时通过 `get/post/put/patch/del` 的 `query` 参数传入。

## 4. 请求封装约定

- `get<T>(path, query)` 用于 GET。
- `post<T>(path, body, query)` 用于 POST。
- `put<T>(path, body, query)` 用于 PUT。
- `patch<T>(path, body, query)` 用于 PATCH。
- `del<T>(path, query)` 用于 DELETE。
- `withPath(base, ...segments)` 用于拼接路径变量，并负责 `encodeURIComponent`。

示例：

```ts
return post<ReservationResult>(
  withPath(apiPaths.reservations, 'seat-check-in'),
  payload,
);
```

学生正式签到应优先走桌码/座位码接口，例如 `POST /api/reservations/table-check-in` 或 `POST /api/reservations/seat-check-in`。`POST /api/reservations/{reservationId}/check-in` 和 `POST /api/reservations/{reservationId}/seat-lock/reactivate` 当前仅保留给开发测试入口，仍必须经过签到码、时间窗和校园网 IP 校验。

## 5. 权限约定

- 未登录可访问：`POST /api/auth/login`、`GET /api/health`、Swagger / OpenAPI。
- 学生：预约、签到、签退、锁位、查询本人预约。
- 管理员：资源管理、开放时段发布、管理员释放、审计日志、看板、预约规则维护。
- 学生和管理员都可读取基础资源和预约规则，便于页面展示。

新增接口必须明确是否需要 `@RequireRole`。管理员接口优先在 Controller 类上标注 `@RequireRole(UserRole.ADMIN)`。

## 6. 文档维护规则

新增或修改接口时需要同步：

- 后端 `ApiPaths`。
- 前端 `apiPaths` 和对应 API 模块。
- `docs/API_EXAMPLES.md` 中的手测示例。
- 当前开发者的 `docs/dev-logs/*.md`。
