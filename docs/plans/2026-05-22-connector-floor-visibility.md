# Connector Floor Visibility Implementation

## Goal

Ensure the student indoor map does not show misleading connector areas on floors where no physical connector exists. A/B and C/D connectors are only rendered on 2F and 3F.

## Scope

- Extend map zones to support A, B, C, D, A/B connector, and C/D connector.
- Keep existing `CONNECTOR` metadata compatible as A/B connector.
- Allow backend area metadata to store `C`, `D`, `CONNECTOR_AB`, and `CONNECTOR_CD`.
- Update admin area options so future C/D public areas can be configured without relying on names.

## Verification

- Added failing `CampusIndoorMap` test proving 1F hides connector zones and 2F/3F show A/B and C/D connectors.
- Added failing `AreaServiceTest` proving `CONNECTOR_CD` is accepted.
- Implemented the minimal frontend and backend changes, then reran the targeted tests.
