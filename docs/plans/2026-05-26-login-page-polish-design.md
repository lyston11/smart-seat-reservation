# Login Page Polish Design Notes

## Goal

Improve the login page first impression while keeping it practical for the seat reservation system demo and ready for mobile use.

## Scope

- Frontend login page layout, copy, and responsive styling.
- Login page tests and AmorLX development log.
- No authentication API, backend, database, session, routing, or permission changes.

## Chosen Approach

Use a restrained product-style login workspace:

1. Keep the login form as the primary action.
2. Add a concise product identity area with the system name and three capability highlights: real-time seats, reservation and QR check-in, and admin visibility.
3. Replace the plain demo-account radio row with clearer student/admin quick account cards that still fill the same form values.
4. Use one responsive page: two columns on desktop, single-column on mobile, with no horizontal overflow.

This improves the demo experience without turning the app into a marketing page or changing the authentication flow.

## Alternatives Considered

- Minimal polish only: lower risk, but the first screen still feels unfinished for demos.
- Full illustrated landing-style login: more distinctive, but adds visual noise and can make mobile layout harder to maintain.

## Testing Direction

- Add App-level login route coverage for the product identity and quick account cards.
- Verify the admin quick account still fills account and password fields.
- Keep existing expired-session redirect behavior passing.
