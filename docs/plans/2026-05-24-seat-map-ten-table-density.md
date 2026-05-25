# Seat Map Ten Table Density Implementation Plan

**Goal:** Adjust the shared seat map display and demo data so Library Area A presents at least ten tables as a two-column, five-row room.

**Architecture:** Keep the current React `SeatMap` component and Flyway data migration approach. Use frontend tests to lock coordinate density and a backend migration to expand the demo room.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Spring Boot 4, Flyway, MySQL.

---

### Task 1: Lock Ten Table Rendering With Tests

**Files:**
- Modify: `frontend/src/components/SeatMap.test.tsx`

Steps:
- Add a coordinate-layout test with ten tables.
- Assert the rendered table positions form two unique columns and five unique rows.
- Assert the default zoom and viewport dimensions remain compact.

### Task 2: Tighten Coordinate Display

**Files:**
- Modify: `frontend/src/components/SeatMap.tsx`
- Modify: `frontend/src/styles/main.css`

Steps:
- Reduce table display and position scaling.
- Make the default coordinate zoom fit at 90%.
- Tighten coordinate padding and positioned table side gutters.
- Keep existing zoom controls and transition animation.

### Task 3: Expand Demo Tables

**Files:**
- Add: `backend/src/main/resources/db/migration/V17__expand_library_demo_seat_map.sql`

Steps:
- Insert missing Library Area A tables T05 through T10.
- Reposition T01 through T10 into two columns and five rows.
- Insert four active seats per new table, with table-local labels 1 through 4.
- Seed current-day and next-day full-window demo slots when missing.

### Task 4: Verify and Document

Commands:

```bash
cd frontend
npm run test -- SeatMap.test.tsx
npm run test
npm run lint
npm run build
cd ../backend
mvn test
cd ..
git diff --check
```

Browser checks:
- Open `http://127.0.0.1:5173/student/seats`.
- Confirm Library Area A shows T01 through T10 in two columns and five rows.
- Confirm no horizontal overflow on a mobile viewport.
