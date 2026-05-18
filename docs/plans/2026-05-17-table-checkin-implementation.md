# Table QR Check-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add durable table resources, visual table-seat selection, and fixed table QR check-in that matches the scanned table to the student's reserved concrete seat.

**Architecture:** Introduce `tables` as a first-class backend resource and attach every `seat` to a table. Seat slot queries carry table and seat-layout metadata to the React seat map. A new student table check-in endpoint resolves a QR token to a table, finds the student's matching pending reservation on that table, and reuses the existing reservation check-in state transition.

**Tech Stack:** Java 21, Spring Boot 4, MyBatis-Plus, Flyway, MySQL 8.4, React 19, TypeScript, Vite, Ant Design, JUnit 5, Vitest.

---

### Task 1: Add Table Schema And Demo Migration

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__add_tables_and_table_seat_layout.sql`
- Modify: none
- Test: run backend Flyway-related tests through `mvn test`

**Step 1: Write the migration**

Create `tables`, add table layout fields to `seats`, and seed existing demo seats into default tables.

```sql
CREATE TABLE tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    area_id BIGINT NOT NULL,
    table_no VARCHAR(32) NOT NULL,
    name VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    qr_token VARCHAR(64) NOT NULL,
    row_no INT NULL,
    column_no INT NULL,
    display_order INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tables_area_table_no (area_id, table_no),
    UNIQUE KEY uk_tables_qr_token (qr_token),
    KEY idx_tables_area_id (area_id),
    CONSTRAINT fk_tables_area_id FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE seats
    ADD COLUMN table_id BIGINT NULL AFTER area_id,
    ADD COLUMN seat_label VARCHAR(32) NULL AFTER seat_no,
    ADD COLUMN seat_side VARCHAR(32) NULL AFTER seat_label,
    ADD COLUMN seat_order INT NULL AFTER seat_side,
    ADD KEY idx_seats_table_id (table_id),
    ADD CONSTRAINT fk_seats_table_id FOREIGN KEY (table_id) REFERENCES tables (id);

INSERT INTO tables (area_id, table_no, name, qr_token, row_no, column_no, display_order)
VALUES
    (1, 'T01', 'Library Area A T01', 'demo-area-1-table-t01', 1, 1, 1),
    (2, 'T01', 'Teaching Building Area B T01', 'demo-area-2-table-t01', 1, 1, 1);

UPDATE seats
SET table_id = (SELECT id FROM tables WHERE area_id = 1 AND table_no = 'T01'),
    seat_label = CASE seat_no
        WHEN 'A-001' THEN '1'
        WHEN 'A-002' THEN '2'
        WHEN 'A-003' THEN '3'
        WHEN 'A-004' THEN '4'
        ELSE seat_no
    END,
    seat_side = CASE seat_no
        WHEN 'A-001' THEN 'NORTH'
        WHEN 'A-002' THEN 'EAST'
        WHEN 'A-003' THEN 'SOUTH'
        WHEN 'A-004' THEN 'WEST'
        ELSE 'SINGLE'
    END,
    seat_order = 1
WHERE area_id = 1;

UPDATE seats
SET table_id = (SELECT id FROM tables WHERE area_id = 2 AND table_no = 'T01'),
    seat_label = CASE seat_no
        WHEN 'B-001' THEN '1'
        WHEN 'B-002' THEN '2'
        ELSE seat_no
    END,
    seat_side = CASE seat_no
        WHEN 'B-001' THEN 'WEST'
        WHEN 'B-002' THEN 'EAST'
        ELSE 'SINGLE'
    END,
    seat_order = 1
WHERE area_id = 2;
```

**Step 2: Run backend tests**

Run:

```bash
cd backend
mvn test
```

Expected: tests compile. If existing tests fail because models lack new properties, continue to Task 2 and rerun.

---

### Task 2: Add Backend Table Domain

**Files:**
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTable.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableStatus.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableResponse.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/CreateStudyTableRequest.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/UpdateStudyTableRequest.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/UpdateStudyTableStatusRequest.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableQrResponse.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableMapper.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableService.java`
- Create: `backend/src/main/java/com/lyston/smartseat/table/StudyTableController.java`
- Test: `backend/src/test/java/com/lyston/smartseat/table/StudyTableServiceTest.java`

**Step 1: Write failing service tests**

Create tests that verify:

- `createTable` creates a unique QR token and trims `tableNo`.
- Duplicate `(areaId, tableNo)` is rejected.
- Inactive status is rejected for invalid values.
- `getCheckinQr` returns `/student/table-checkin?token=...`.

**Step 2: Run tests to verify failure**

Run:

```bash
cd backend
mvn -Dtest=StudyTableServiceTest test
```

Expected: FAIL because table classes do not exist.

**Step 3: Implement table classes and service**

Use package name `com.lyston.smartseat.table`. Keep service rules consistent with existing `AreaService` and `SeatService`:

- `tableNo` is trimmed.
- `status` is `ACTIVE` or `INACTIVE`.
- `qrToken` is generated by `UUID.randomUUID().toString().replace("-", "")`.
- Duplicate table number in the same area throws `BusinessException("TABLE_NO_ALREADY_EXISTS", ...)`.
- Table QR link can be returned as a path, not a full domain: `/student/table-checkin?token=<token>`.

**Step 4: Add controller endpoints**

```text
GET /api/tables?areaId=1
POST /api/tables
PUT /api/tables/{id}
PATCH /api/tables/{id}/status
GET /api/tables/{id}/checkin-qr
```

Require `ADMIN` for mutations and QR lookup. Listing can allow authenticated users so the student seat map can load table metadata if needed.

**Step 5: Run tests**

Run:

```bash
cd backend
mvn -Dtest=StudyTableServiceTest test
```

Expected: PASS.

---

### Task 3: Attach Seats And Seat Slots To Tables

**Files:**
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/Seat.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatResponse.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/CreateSeatRequest.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/UpdateSeatRequest.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatMapper.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatService.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlot.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlotResponse.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlotService.java`
- Test: update existing seat and reservation tests as needed

**Step 1: Write failing test for seat table fields**

Add or update tests so creating a seat requires a valid `tableId` in the same area and returns:

```text
tableId
tableNo
seatLabel
seatSide
seatOrder
```

**Step 2: Run tests to verify failure**

Run:

```bash
cd backend
mvn -Dtest=AdminSeatSlotServiceTest,ReservationServiceTest test
```

Expected: FAIL because table fields are not mapped yet.

**Step 3: Extend seat model and DTOs**

Add fields:

```java
private Long tableId;
private String tableNo;
private String seatLabel;
private String seatSide;
private Integer seatOrder;
```

Requests should include `tableId`, `seatLabel`, `seatSide`, and `seatOrder`. Responses should include all table and seat layout fields.

**Step 4: Validate table membership**

In `SeatService`, require:

- Table exists.
- Table belongs to the selected area.
- Table is active when creating active seats.

Keep the existing row/column fields for backward-compatible area layout, but table position should become the primary student map grouping.

**Step 5: Extend slot queries**

Update `SeatSlotMapper.findByAreaAndDate` to join `tables` and return:

```text
t.id AS table_id
t.table_no
t.row_no AS table_row_no
t.column_no AS table_column_no
t.display_order AS table_display_order
s.seat_label
s.seat_side
s.seat_order
```

Update `SeatSlotResponse` and frontend type later.

**Step 6: Run backend tests**

Run:

```bash
cd backend
mvn test
```

Expected: PASS after tests are updated.

---

### Task 4: Implement Table QR Check-In Backend

**Files:**
- Create: `backend/src/main/java/com/lyston/smartseat/reservation/TableCheckinRequest.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/reservation/ReservationMapper.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/reservation/ReservationService.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/reservation/ReservationController.java`
- Test: `backend/src/test/java/com/lyston/smartseat/reservation/ReservationServiceTest.java`

**Step 1: Write failing table check-in tests**

Add tests for:

- Student can check in by table token when their reserved seat belongs to that table.
- Check-in fails when the table token belongs to another table.
- Check-in fails with a wrong code.
- Check-in fails when reservation is expired.

**Step 2: Run tests to verify failure**

Run:

```bash
cd backend
mvn -Dtest=ReservationServiceTest test
```

Expected: FAIL because `tableCheckIn` does not exist.

**Step 3: Add request DTO**

```java
public record TableCheckinRequest(
        @NotBlank String tableQrToken,
        @NotBlank String checkinCode
) {
}
```

**Step 4: Add mapper method**

Add a query that finds a reserved reservation for current user and table token:

```sql
SELECT r.*
FROM reservations r
JOIN seats s ON s.id = r.seat_id
JOIN tables t ON t.id = s.table_id
WHERE r.user_id = #{userId}
  AND t.qr_token = #{tableQrToken}
  AND t.status = 'ACTIVE'
  AND r.status = 'RESERVED'
  AND r.checkin_code = #{checkinCode}
ORDER BY r.reserved_at DESC
LIMIT 1
```

**Step 5: Implement service**

Add `tableCheckIn(TableCheckinRequest request, Long userId)`:

- Find matching reservation.
- If none, throw `BusinessException("TABLE_CHECKIN_NOT_MATCHED", ...)`.
- If `expiresAt` is before now, throw `BusinessException("RESERVATION_EXPIRED", ...)`.
- Reuse a private check-in transition method so normal check-in and table check-in share the same state changes.

**Step 6: Add controller endpoint**

```text
POST /api/reservations/table-check-in
```

Require student role.

**Step 7: Run backend tests**

Run:

```bash
cd backend
mvn test
```

Expected: PASS.

---

### Task 5: Add Frontend Table Types And APIs

**Files:**
- Create: `frontend/src/api/tables.ts`
- Modify: `frontend/src/types/seat.ts`
- Modify: `frontend/src/types/reservation.ts`
- Modify: `frontend/src/api/seatSlots.ts`
- Modify: `frontend/src/api/seats.ts`
- Test: TypeScript build

**Step 1: Extend types**

Add:

```ts
export type StudyTable = {
  id: number;
  areaId: number;
  tableNo: string;
  name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  qrToken: string;
  rowNo: number | null;
  columnNo: number | null;
  displayOrder: number | null;
};
```

Extend `Seat` and `SeatSlot` with table and per-seat layout fields.

**Step 2: Add table API client**

Implement:

```ts
listTables(areaId)
createTable(payload)
updateTable(tableId, payload)
updateTableStatus(tableId, status)
getTableCheckinQr(tableId)
```

**Step 3: Add table check-in API**

In `seatSlots.ts` or a new reservations API module, add:

```ts
tableCheckInReservation(payload: { tableQrToken: string; checkinCode: string })
```

**Step 4: Run frontend type/build check**

Run:

```bash
cd frontend
npm run build
```

Expected: FAIL until UI files are updated, then PASS after later tasks.

---

### Task 6: Build Visual Table-Seat Map

**Files:**
- Modify: `frontend/src/components/SeatMap.tsx`
- Modify: `frontend/src/styles/main.css`
- Test: `frontend/src/App.test.tsx` or add component test if practical

**Step 1: Update grouping logic**

Group slots by time range, then by `tableId`. Within each table, sort seats by:

```text
seatSide
seatOrder
seatNo
```

**Step 2: Render table cards inside the room layout**

Each table should show:

- Table number.
- Seat buttons around the table.
- Status color and label.
- Disabled state for non-available seats.

Four-seat table layout:

```text
      NORTH
WEST  TABLE  EAST
      SOUTH
```

Two-seat table can use `WEST` and `EAST`; single seats use `SINGLE`.

**Step 3: Keep layout stable and responsive**

Use CSS grid with fixed-size seat buttons and table surfaces. Avoid nested cards. Ensure mobile does not overflow.

**Step 4: Run frontend checks**

Run:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Expected: PASS.

---

### Task 7: Add Student Table Check-In Page

**Files:**
- Create: `frontend/src/pages/TableCheckinPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles/main.css`
- Test: `frontend/src/App.test.tsx`

**Step 1: Create page**

The page reads `token` from `useSearchParams`, shows an input for `checkinCode`, and calls `tableCheckInReservation`.

**Step 2: Add route**

Add:

```text
/student/table-checkin
```

under the existing protected student routes.

**Step 3: UX states**

Show:

- Missing token.
- Submitting.
- Success with links to `/student/reservations` and `/student/seats`.
- Backend error messages.

**Step 4: Run frontend checks**

Run:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Expected: PASS.

---

### Task 8: Add Admin Table Management And QR Entry

**Files:**
- Create: `frontend/src/pages/AdminTablesPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/layout/AppLayout.tsx`
- Modify: `frontend/src/pages/AdminSeatsPage.tsx`
- Modify: `frontend/src/styles/main.css`
- Test: frontend checks

**Step 1: Add table management page**

Include:

- Area selector.
- Table list.
- Create/edit modal with table number, name, row, column, display order, status.
- QR link viewer using Ant Design QRCode if available.

**Step 2: Add admin route and menu**

Add:

```text
/admin/tables
```

under admin `RoleRoute`.

**Step 3: Update seat form**

Seat form should require `tableId`, `seatLabel`, `seatSide`, and `seatOrder`. The table selector should be filtered by area.

**Step 4: Run frontend checks**

Run:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Expected: PASS.

---

### Task 9: Update Docs And Development Log

**Files:**
- Modify: `docs/API_EXAMPLES.md`
- Modify: `docs/architecture/ARCHITECTURE.md`
- Modify: `docs/dev-logs/lyston11.md` or the current developer's log file

**Step 1: Update API examples**

Document:

- Table CRUD.
- Table QR lookup.
- Table QR check-in.
- Seat table fields.

**Step 2: Update architecture**

Document:

```text
areas -> tables -> seats -> seat_slots
```

and explain that table QR only proves physical table presence while check-in code still verifies reservation ownership.

**Step 3: Update development log**

Append the standard template with branch, changed files, verification commands, and known follow-ups.

**Step 4: Final verification**

Run:

```bash
cd backend
mvn test
cd ../frontend
npm run lint
npm run test
npm run build
git status --short
git diff --stat
```

Expected: all checks pass and only scoped files are changed.

---

### Task 10: Commit Work In Small Checkpoints

**Files:**
- All files changed in previous tasks

**Step 1: Review diff**

Run:

```bash
git diff
```

Expected: no unrelated edits.

**Step 2: Commit**

Use small commits during implementation, for example:

```bash
git add backend/src/main/resources/db/migration/V7__add_tables_and_table_seat_layout.sql backend/src/main/java/com/lyston/smartseat/table backend/src/test/java/com/lyston/smartseat/table
git commit -m "feat: add table resources"

git add backend/src/main/java/com/lyston/smartseat/reservation backend/src/test/java/com/lyston/smartseat/reservation
git commit -m "feat: add table qr checkin"

git add frontend/src docs
git commit -m "feat: add visual table checkin flow"
```

Expected: commits stay focused and branch remains off `main`.
