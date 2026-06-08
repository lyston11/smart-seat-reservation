# Student Pages Centering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Center regular student/admin content pages in the app content area while preserving the existing wide seat map layouts.

**Architecture:** Reuse the shared `.page` wrapper as the normal content-width contract. Add semantic student page classes for testable intent and keep special wide pages on their existing page-specific classes.

**Tech Stack:** React, TypeScript, Vite, Ant Design, Vitest, Testing Library, CSS.

---

### Task 1: Add failing page-class tests

**Files:**
- Modify: `frontend/src/App.test.tsx`

**Step 1: Write the failing tests**

Add tests that render `/student/home` and `/student/reservations`, wait for the page titles, and assert that the closest `.page` wrapper includes `student-home-page` or `student-reservations-page`.

**Step 2: Run test to verify it fails**

Run: `cd frontend; npm run test -- App.test.tsx -t "centers"`

Expected: FAIL because the page classes are not present yet.

### Task 2: Implement minimal page wrapper changes

**Files:**
- Modify: `frontend/src/pages/StudentHomePage.tsx`
- Modify: `frontend/src/pages/MyReservationsPage.tsx`
- Modify: `frontend/src/styles/main.css`

**Step 1: Add semantic classes**

Change the root wrappers to:

```tsx
<div className="page student-home-page">
<div className="page student-reservations-page">
```

**Step 2: Center the shared page wrapper**

Change `.page` to:

```css
.page {
  width: 100%;
  min-width: 0;
  max-width: 1180px;
  margin-inline: auto;
}
```

**Step 3: Run focused tests**

Run: `cd frontend; npm run test -- App.test.tsx -t "centers"`

Expected: PASS.

### Task 3: Verify and document

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

**Step 1: Run verification**

Run:

```bash
cd frontend
npm run test -- App.test.tsx
npm run test
npm run lint
npm run build
cd ..
git diff --check
```

**Step 2: Browser-check local pages**

Open:

- `http://127.0.0.1:5173/student/home`
- `http://127.0.0.1:5173/student/reservations`
- representative admin pages such as `/admin/dashboard`

Check that the `.page` element is centered and no horizontal overflow appears.

**Step 3: Update the AmorLX dev log**

Append a dated entry covering the centering change, files touched, verification, and impact.
