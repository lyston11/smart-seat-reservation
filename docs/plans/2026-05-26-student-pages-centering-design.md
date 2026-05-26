# Student Pages Centering Design

## Goal

Make the student home page, the my reservations page, and other regular content pages align consistently in the center of the app content area while keeping existing wide seat-map pages responsive.

## Context

The regular page wrapper uses `.page` with `max-width: 1180px`, but it does not set `margin-inline: auto`. As a result, pages such as the student home page and my reservations page sit against the left side of the scrollable content area, while the recently polished seat map and admin table pages use explicit centered frames.

## Chosen Approach

Use the existing `.page` wrapper as the shared centering contract for regular pages:

- Add `width: 100%`, `min-width: 0`, and `margin-inline: auto` to `.page`.
- Keep `.student-seat-page { max-width: none; }` so the seat-map page can still use its own adaptive frames.
- Add semantic page classes to the student home and reservations pages so tests can lock the intended page surface without coupling to Ant Design internals.
- Keep mobile behavior full width by preserving the existing mobile `.page { max-width: none; }` rule.

This is smaller and safer than adding separate centering wrappers to every page, and it avoids changing backend APIs, reservation state, or QR check-in behavior.

## Verification

- Add App-level tests that assert the student home and my reservations pages use their student page classes.
- Run the focused App test file, the full frontend test suite, lint, and production build.
- Open the local pages in the browser and measure that the `.page` wrapper is horizontally centered and does not create horizontal overflow.
