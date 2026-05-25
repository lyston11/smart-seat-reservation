# Student Seat Mobile Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the student seat reservation UI a unified, mobile-friendly flow from floor selection to concrete seat reservation.

**Architecture:** Keep the existing React page and components. Add controlled floor behavior to `CampusIndoorMap`, move time selectors into the main filter panel in `SeatSlotsPage`, and adjust CSS for a responsive top-to-bottom mobile layout.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, Vite.

---

### Task 1: Lock Floor and Time Flow With Tests

**Files:**
- Modify: `frontend/src/components/CampusIndoorMap.test.tsx`
- Modify: `frontend/src/App.test.tsx`

**Step 1: Write failing tests**

- Add a `CampusIndoorMap` test that passes a controlled `selectedFloor`, clicks another floor, and expects `onFloorChange` to receive the visible areas for that floor.
- Add an app-level student page test that switches from 1F to 2F and expects the selected area and seat API requests to follow 2F.
- Add an app-level student page assertion that start/end time selectors are visible before a seat is selected.

**Step 2: Run focused tests**

Run:

```bash
cd frontend
npm run test -- CampusIndoorMap.test.tsx App.test.tsx
```

Expected: fail because `CampusIndoorMap` does not expose controlled floor changes and the top filter does not yet contain time selectors.

### Task 2: Implement Controlled Floor Alignment

**Files:**
- Modify: `frontend/src/components/CampusIndoorMap.tsx`
- Modify: `frontend/src/pages/SeatSlotsPage.tsx`

**Step 1: Extend map props**

- Add optional `selectedFloor` and `onFloorChange`.
- Keep internal fallback state for callers that do not control the floor.
- When the floor changes, compute visible areas for that floor and call `onFloorChange(floor, visibleAreas)`.

**Step 2: Align selected area in the student page**

- Track `selectedCampusFloor` in `SeatSlotsPage`.
- `applySelectedArea` updates both area and floor.
- `handleFloorChange` updates the floor and selects the first visible area when needed.

**Step 3: Run focused tests**

Run:

```bash
cd frontend
npm run test -- CampusIndoorMap.test.tsx App.test.tsx
```

Expected: the new floor alignment tests pass.

### Task 3: Unify Student Filters and Seat Detail UI

**Files:**
- Modify: `frontend/src/pages/SeatSlotsPage.tsx`
- Modify: `frontend/src/styles/main.css`

**Step 1: Move time selectors into the main filter panel**

- Replace the generic toolbar with a student-specific filter section labelled `选座筛选`.
- Keep area, date, start time, end time, and refresh in one panel.
- Keep the selected seat panel focused on seat identity, status, location, and the reserve action.

**Step 2: Improve responsive layout**

- Let the filter grid collapse to one column on mobile.
- Keep the side panel sticky on desktop and normal flow on mobile.
- Make the selected path compact and readable on narrow screens.

**Step 3: Run frontend checks**

Run:

```bash
cd frontend
npm run test -- CampusIndoorMap.test.tsx App.test.tsx
npm run lint
npm run build
```

Expected: all commands exit successfully.

### Task 4: Verify and Document

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

**Step 1: Full verification**

Run:

```bash
mvn test
cd frontend
npm run test
npm run lint
npm run build
git diff --check
```

**Step 2: Browser check**

- Open `http://127.0.0.1:5173/student/seats`.
- Confirm the page loads and the unified filter is visible.
- Confirm mobile viewport keeps the flow stacked without horizontal overflow.

**Step 3: Update log**

- Append the task summary, files, verification, residual risks, and teammate impact to `docs/dev-logs/AmorLX.md`.
