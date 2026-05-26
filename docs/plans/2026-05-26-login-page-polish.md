# Login Page Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the login page into a responsive product-style entry screen while preserving the existing login flow.

**Architecture:** Keep `LoginPage` as a single React page using Ant Design form controls and local demo-account state. Add semantic layout sections and CSS classes in `main.css`; do not introduce new dependencies or backend changes.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, Vite.

---

### Task 1: Add Login Page Regression Tests

**Files:**
- Modify: `frontend/src/App.test.tsx`

Steps:
- Add a `/login` route test that asserts the page shows the system name, capability highlights, and student/admin quick account cards.
- Add an interaction assertion that clicking the administrator quick account fills `admin` and `admin`.
- Run `npm run test -- App.test.tsx -t "renders the polished login page"` and confirm it fails before implementation.

### Task 2: Implement Login Page Structure

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

Steps:
- Add a product identity column with concise copy and three feature items.
- Replace the radio-button demo account selector with clickable quick account cards.
- Keep `initialValues`, form validation, `login`, `setAuthSession`, and post-login navigation unchanged.

### Task 3: Add Responsive Styling

**Files:**
- Modify: `frontend/src/styles/main.css`

Steps:
- Add login page layout, panel, quick account, and feature item styles.
- Use a two-column desktop layout and single-column mobile layout under the existing mobile media query.
- Keep colors restrained and avoid single-hue saturation.

### Task 4: Verify and Document

Commands:

```bash
cd frontend
npm run test -- App.test.tsx -t "renders the polished login page"
npm run test -- App.test.tsx
npm run lint
npm run build
cd ..
git diff --check
```

Browser checks:
- Open `http://127.0.0.1:5173/login`.
- Confirm desktop layout has two balanced columns.
- Confirm mobile viewport has no horizontal overflow and form remains usable.

### Task 5: Update Log and Commit

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

Steps:
- Append this task summary and verification results.
- Stage only login page, tests, styles, plan docs, and AmorLX log.
- Commit with `feat: polish login page`.
