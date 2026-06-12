# Light Tech Login Showcase Design

## Goal

Turn the login page into a light, product-style technology showcase inspired by the provided Smart Seat poster, while keeping the existing login behavior unchanged.

## Context

- The current `/login` page already has a two-column light layout with demo account shortcuts.
- The user wants the overall technology feel of the reference image, but not a dark cyber theme.
- This task must avoid backend, reservation, check-in, database, and deployment changes.

## Recommended Approach

Use `/login` as the demo entry page and build a light technology showcase around the existing form.

- Light gray, white, blue, cyan, and small warm status colors.
- Subtle grid and thin-line panels instead of a dark poster background.
- Product hierarchy from the reference image: large system identity, feature chips, seat map preview, reservation credential card, and workflow cards.
- Responsive single-page layout so the same page is usable on mobile.

## Alternatives Considered

- Dark poster-style page: visually close to the reference, but conflicts with the user's light-color preference and can make the form feel secondary.
- Separate landing page before login: cleaner marketing split, but adds navigation friction and does not help the current demo entry point.

## Component Design

- `LoginPage.tsx` keeps the existing form, quick account data, validation, login API call, session storage, and role redirect.
- Add light-tech display data for feature chips, metrics, seat-map legend, and workflow cards.
- Use `lucide-react` icons already available in the project.
- CSS stays in `frontend/src/styles/main.css`, near existing login styles, to match current project organization.

## Testing

- Extend the existing login page test in `frontend/src/App.test.tsx`.
- Verify new visible copy for the light-tech showcase: system name, feature chips, seat map preview, reservation credential, and workflow cards.
- Preserve the quick admin account click test to ensure behavior is unchanged.

## Out Of Scope

- No API changes.
- No database migration.
- No real QR generation or reservation state changes.
- No separate mobile app page.
