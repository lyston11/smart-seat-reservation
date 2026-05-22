# Auto Slots And Locked Seat Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically open the next day's reservable seat windows using Beijing time and show locked seats as a distinct state in the seat map.

**Architecture:** Reuse the existing area, seat, table, and seat slot model. A scheduled backend service publishes tomorrow's available windows idempotently from each active area's open and close time; seat map responses derive a display status of `LOCKED` when the linked reservation is locked, without changing the persisted `seat_slots.status` state machine in this slice.

**Tech Stack:** Spring Boot scheduled jobs, MyBatis mapper queries, Java `Clock` with `Asia/Shanghai`, React + TypeScript + Ant Design, JUnit 5, Vitest.

---

### Task 1: Add Automatic Tomorrow Slot Opening

**Files:**
- Create: `backend/src/main/java/com/lyston/smartseat/seat/AutoSeatSlotPublishProperties.java`
- Create: `backend/src/main/java/com/lyston/smartseat/seat/AutoSeatSlotPublishService.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/SmartSeatApplication.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/schedule/ReservationExpirationJob.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/area/AreaMapper.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatMapper.java`
- Modify: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/com/lyston/smartseat/seat/AutoSeatSlotPublishServiceTest.java`

**Steps:**
1. Write failing tests for:
   - before `reservationOpenHour`, auto publish skips work;
   - at/after `reservationOpenHour`, active areas get tomorrow slots from `openTime` to `closeTime`;
   - duplicate seat/date/time windows are skipped by existing `publishSeatSlots`.
2. Implement properties for enabled flag, fixed delay, zone id, and batch time step if needed.
3. Implement service that loads active areas, active seats by area, builds one publish period per area opening window, and calls `SeatSlotService.publishSeatSlots`.
4. Wire a scheduled job that calls the service on a fixed delay.
5. Run targeted backend tests.

### Task 2: Derive Locked Seat Slot Display Status

**Files:**
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlot.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlotMapper.java`
- Modify: `backend/src/main/java/com/lyston/smartseat/seat/SeatSlotResponse.java`
- Test: `backend/src/test/java/com/lyston/smartseat/seat/SeatSlotResponseTest.java`

**Steps:**
1. Write a failing test proving a slot with persisted `USING` and linked reservation status `LOCKED` returns response `status="LOCKED"`.
2. Add a non-persistent `reservationStatus` field to `SeatSlot`.
3. Join `reservations` in list queries and select `r.status AS reservation_status`.
4. Map response status through `SeatSlotResponse.from`, using `LOCKED` only for display.
5. Run targeted backend tests.

### Task 3: Update Frontend Locked Status Rendering

**Files:**
- Modify: `frontend/src/types/seat.ts`
- Modify: `frontend/src/constants/seatSlotStatus.ts`
- Modify: `frontend/src/pages/AdminSeatSlotsPage.tsx`
- Modify: `frontend/src/pages/SeatSlotsPage.tsx`
- Modify: `frontend/src/styles/main.css`
- Test: `frontend/src/components/SeatMap.test.tsx`

**Steps:**
1. Write failing component test that `LOCKED` renders as disabled `已锁位`.
2. Add `LOCKED` to `SeatSlotStatus`.
3. Add text/color mappings and CSS class.
4. Ensure student selected-time conflict logic treats `LOCKED` as unavailable.
5. Run targeted frontend tests.

### Task 4: Docs And Dev Log

**Files:**
- Modify: `docs/architecture/ARCHITECTURE.md`
- Modify: `docs/API_EXAMPLES.md`
- Create or modify: `docs/dev-logs/AmorLX.md`

**Steps:**
1. Document the automatic Beijing-time opening rule.
2. Document `LOCKED` as a display status derived from reservation state.
3. Append AmorLX development log entry with branch, scope, verification, and team impact.

### Task 5: Full Verification

**Commands:**
- `mvn test` from `backend`
- `npm run test` from `frontend`
- `npm run lint` from `frontend`
- `npm run build` from `frontend`
- `git diff --check`

**Expected:** all commands exit 0. If a command fails, fix before final summary.
