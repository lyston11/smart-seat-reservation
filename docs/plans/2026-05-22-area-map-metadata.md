# Area Map Metadata Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured area map metadata so the student indoor reservation map can reliably group areas by building, floor, connector, and position without depending only on area names.

**Architecture:** Extend the existing `areas` resource with optional map metadata fields, keep old name-based inference as a frontend fallback, and expose admin maintenance controls through the existing area management page. The change stays inside the Area API, area admin UI, student map component, docs, and tests.

**Tech Stack:** Java 21, Spring Boot 4, MyBatis-Plus, Flyway, MySQL 8.4, React 19, TypeScript, Ant Design, Vitest, Testing Library.

---

### Task 1: Backend Area Metadata Tests

**Files:**
- Create: `backend/src/test/java/com/lyston/smartseat/area/AreaServiceTest.java`

**Step 1: Write failing service tests**

Cover:

- Creating an area trims and uppercases `buildingCode` and `areaType`.
- `floorCode` falls back to `floor` when omitted.
- `mapX` and `mapY` are preserved when inside `0-100`.
- Invalid `buildingCode`, `areaType`, or coordinates throw `BusinessException` with stable error codes.

**Step 2: Run test to verify it fails**

Run: `mvn -Dtest=AreaServiceTest test`

Expected: FAIL because request records and responses do not have metadata fields yet.

**Step 3: Implement minimal backend domain changes**

Modify:

- `backend/src/main/java/com/lyston/smartseat/area/Area.java`
- `backend/src/main/java/com/lyston/smartseat/area/AreaResponse.java`
- `backend/src/main/java/com/lyston/smartseat/area/CreateAreaRequest.java`
- `backend/src/main/java/com/lyston/smartseat/area/UpdateAreaRequest.java`
- `backend/src/main/java/com/lyston/smartseat/area/AreaService.java`

Add metadata fields and validation helpers in `AreaService`.

**Step 4: Run test to verify it passes**

Run: `mvn -Dtest=AreaServiceTest test`

Expected: PASS.

### Task 2: Database Migration and Mapper

**Files:**
- Create: `backend/src/main/resources/db/migration/V16__add_area_map_metadata.sql`
- Modify: `backend/src/main/java/com/lyston/smartseat/area/AreaMapper.java`

**Step 1: Add migration**

Add nullable columns:

- `building_code VARCHAR(32)`
- `floor_code VARCHAR(32)`
- `area_type VARCHAR(32)`
- `map_x INT`
- `map_y INT`

Backfill existing demo records by name.

**Step 2: Update mapper selects**

Include the new snake_case columns in `findAllOrderById` and `findActiveAreasForAutoPublish`.

**Step 3: Verify backend tests**

Run: `mvn -Dtest=AreaServiceTest test`

Expected: PASS.

### Task 3: Frontend Map Metadata Tests

**Files:**
- Modify: `frontend/src/components/CampusIndoorMap.test.tsx`
- Modify: `frontend/src/types/seat.ts`

**Step 1: Write failing map test**

Add a case where an area named like A 楼 has `buildingCode: 'B'` and `floorCode: '3F'`; expect it to render in B 楼 on floor `3F`, proving structured metadata wins over name inference.

**Step 2: Run test to verify it fails**

Run: `npm run test -- CampusIndoorMap.test.tsx`

Expected: FAIL because `CampusIndoorMap` still reads only `area.floor` and name inference.

**Step 3: Implement map preference**

Modify `frontend/src/components/CampusIndoorMap.tsx` to use:

- `area.floorCode ?? area.floor` for floor display and filtering.
- `area.buildingCode` for zone when valid.
- Existing inference only when structured zone is missing.
- `mapY`, `mapX`, then name for stable ordering.

**Step 4: Run test to verify it passes**

Run: `npm run test -- CampusIndoorMap.test.tsx`

Expected: PASS.

### Task 4: Admin Area Form Tests and UI

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/api/areas.ts`
- Modify: `frontend/src/pages/AdminAreasPage.tsx`
- Modify: `frontend/src/styles/main.css`

**Step 1: Write failing admin integration test**

In the admin area page, open the create modal, fill area metadata, save, and assert `POST /api/areas` sends:

- `buildingCode`
- `floorCode`
- `areaType`
- `mapX`
- `mapY`

**Step 2: Run test to verify it fails**

Run: `npm run test -- App.test.tsx`

Expected: FAIL because the form does not expose or submit metadata fields.

**Step 3: Implement UI and API types**

Extend:

- `Area` type.
- Create/update payload types.
- Admin form values and modal defaults.
- Table columns with compact map metadata display.
- Responsive CSS for the metadata field grid.

**Step 4: Run test to verify it passes**

Run: `npm run test -- App.test.tsx`

Expected: PASS.

### Task 5: Documentation

**Files:**
- Modify: `docs/architecture/API_CONTRACT.md`
- Modify: `docs/API_EXAMPLES.md`
- Modify: `docs/dev-logs/AmorLX.md`

**Step 1: Update API docs**

Document the new Area fields and update create/update examples.

**Step 2: Append AmorLX log**

Record the branch, goal, changed files, validation commands, and note that check-in validation was not changed.

**Step 3: Check docs diff**

Run: `git diff -- docs/architecture/API_CONTRACT.md docs/API_EXAMPLES.md docs/dev-logs/AmorLX.md`

Expected: Only this feature's docs and AmorLX log are changed.

### Task 6: Full Verification

**Files:** no edits.

**Step 1: Backend verification**

Run: `mvn test`

Expected: PASS.

**Step 2: Frontend verification**

Run:

- `npm run test`
- `npm run lint`
- `npm run build`

Expected: PASS.

**Step 3: Whitespace and status**

Run:

- `git diff --check`
- `git status --short --branch`

Expected: no whitespace errors; current branch is `feature/AmorLX-area-map-metadata`, not `main`.
