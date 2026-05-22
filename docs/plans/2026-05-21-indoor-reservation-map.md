# Indoor Reservation Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a student reservation UI layer that lets students choose building, floor, connector area, and then a concrete area before selecting a table seat.

**Architecture:** Add a frontend-only `CampusIndoorMap` component that derives a simple indoor map from existing `Area` records and reports selected area changes back to `SeatSlotsPage`. Keep all reservation, check-in, seat slot, and table-seat behavior on existing APIs and components.

**Tech Stack:** React 19, TypeScript, Ant Design, Vitest, Testing Library, CSS in `frontend/src/styles/main.css`.

---

### Task 1: Component Behavior

**Files:**
- Create: `frontend/src/components/CampusIndoorMap.test.tsx`
- Create: `frontend/src/components/CampusIndoorMap.tsx`

**Step 1: Write the failing test**

Test that the component renders A 楼、B 楼、A/B 连廊, filters by floor, marks the selected area, and calls `onSelectArea` when a zone area is clicked.

**Step 2: Run test to verify it fails**

Run: `npm run test -- CampusIndoorMap.test.tsx`

Expected: FAIL because `CampusIndoorMap` does not exist.

**Step 3: Write minimal implementation**

Create the component with derived floor list, building inference, connector inference, and accessible buttons for each area.

**Step 4: Run test to verify it passes**

Run: `npm run test -- CampusIndoorMap.test.tsx`

Expected: PASS.

### Task 2: Student Page Integration

**Files:**
- Modify: `frontend/src/pages/SeatSlotsPage.tsx`
- Modify: `frontend/src/App.test.tsx`

**Step 1: Write the failing integration test**

Test that `/student/seats` displays the indoor map and selecting a B 楼 area triggers `/api/seats?areaId=2`.

**Step 2: Run test to verify it fails**

Run: `npm run test -- App.test.tsx`

Expected: FAIL because the student page has no indoor map yet.

**Step 3: Integrate component**

Import `CampusIndoorMap`, render it above the existing toolbar, and route area selection through `applySelectedArea`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- App.test.tsx`

Expected: PASS.

### Task 3: Responsive Styling

**Files:**
- Modify: `frontend/src/styles/main.css`

**Step 1: Add focused styles**

Add layout classes for the map shell, floor selector, A/B building zones, connector, and mobile stacking.

**Step 2: Verify frontend checks**

Run:
- `npm run test`
- `npm run lint`
- `npm run build`

Expected: all pass.

### Task 4: Documentation

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

**Step 1: Append log entry**

Record the indoor reservation map UI work, changed files, validation commands, and note that no check-in verification backend was changed.

**Step 2: Final diff check**

Run: `git diff --check`

Expected: no whitespace errors.
