# Light Tech Login Showcase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish `/login` into a light technology product showcase while preserving existing authentication behavior.

**Architecture:** Keep the login page as a single React component backed by static showcase data and the existing Ant Design form. Style the presentation in the existing global CSS file so it follows the current project pattern and remains responsive.

**Tech Stack:** React, TypeScript, Vite, Ant Design, lucide-react, Vitest, Testing Library.

---

### Task 1: Add Failing Login Showcase Test

**Files:**
- Modify: `frontend/src/App.test.tsx`

**Step 1: Write the failing test**

Extend the existing `renders the polished login page with role quick accounts` test to expect:

- `智慧座位预约系统`
- `实时选座`
- `扫码签到`
- `预约规则`
- `管理看板`
- `防重复预约`
- `座位地图 / Seat Map`
- `我的预约`
- `学生预约`
- `到场签到`
- `管理员调度`
- `状态追踪`

Keep the existing admin quick account click assertion.

**Step 2: Run test to verify it fails**

Run: `npm run test -- App.test.tsx -t "renders the polished login page"`

Expected: FAIL because the new showcase text does not exist yet.

### Task 2: Implement Login Showcase Markup

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

**Step 1: Add static display data**

Add arrays for:

- feature chips
- metrics
- seat status legend
- workflow cards

**Step 2: Update JSX**

Add:

- light-tech identity header
- feature chip row
- seat map preview panel
- reservation credential card
- workflow card strip

Preserve:

- form instance
- `submit`
- `demoAccounts`
- quick account behavior
- redirect logic

### Task 3: Implement Responsive Styling

**Files:**
- Modify: `frontend/src/styles/main.css`

**Step 1: Replace login-specific styles**

Update the `.login-*` section to support:

- light grid background
- responsive two-column shell
- showcase cards and preview map
- form panel with readable spacing

**Step 2: Update mobile media rules**

At `max-width: 860px`:

- stack showcase above form
- keep text sizes bounded
- collapse preview panels and quick account cards
- avoid horizontal overflow

### Task 4: Verify

**Files:**
- Modify: `docs/dev-logs/AmorLX.md`

**Step 1: Run checks**

Run:

- `npm run test -- App.test.tsx -t "renders the polished login page"`
- `npm run test`
- `npm run lint`
- `npm run build`
- `git diff --check`

**Step 2: Browser check**

Start the Vite dev server and open:

- `http://127.0.0.1:5173/login`

Check desktop and mobile widths for visible layout, no overlap, and unchanged quick account behavior.

**Step 3: Update AmorLX log**

Append the task entry with files changed, verification commands, and any remaining notes.
