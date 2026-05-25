# Seat Map Content Bounds Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the coordinate seat map canvas fit the rendered table-and-seat content instead of preserving large blank areas.

**Architecture:** Reuse the existing `SeatMap` coordinate normalization pipeline. After coordinate scaling and collision adjustment, add a second normalization pass that shifts positioned tables toward a compact origin and computes the room bounds from their full footprints.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, Vite.

---

### Task 1: Add Failing Canvas Bounds Test

**Files:**
- Modify: `frontend/src/components/SeatMap.test.tsx`

Steps:
- Add a coordinate-layout test with tables placed far from the origin.
- Assert rendered table `left/top` are close to the canvas padding.
- Assert coordinate viewport width and height are compact relative to the actual table footprint.
- Run `npm run test -- SeatMap.test.tsx` and confirm the new test fails before implementation.

### Task 2: Normalize Bounds From Content

**Files:**
- Modify: `frontend/src/components/SeatMap.tsx`

Steps:
- Add compact canvas padding constants.
- After collision adjustment, compute positioned table collision rectangles.
- Shift all positioned tables by the minimum rectangle left/top so content starts at the compact padding.
- Rewrite coordinate room bounds to use the shifted footprint max right/bottom plus compact padding.
- Keep non-coordinate layout unchanged.

### Task 3: Verify and Document

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
- Confirm the coordinate canvas hugs T01-T10 with only small inner padding.
- Confirm mobile viewport has no horizontal overflow.

### Task 4: Update Log and PR

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

Steps:
- Append the task summary and verification.
- Commit and push the feature branch.
- Confirm PR #23 is updated.
