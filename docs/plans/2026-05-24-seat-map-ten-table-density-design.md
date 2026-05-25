# Seat Map Ten Table Density Design Notes

## Goal

Make the coordinate seat map show a realistic demo room with at least ten rectangular tables arranged as two columns and five rows, while keeping the map readable on desktop and mobile.

## User Problem

- The demo room previously showed too few tables, so it did not feel like a real public study area.
- The coordinate canvas had too much empty space and the default zoom made multi-row layouts tall.
- Students and admins need to recognize table numbers quickly when discussing a concrete seat.

## Scope

- Student/admin shared `SeatMap` rendering.
- Library Area A demo data only.
- Keep existing table QR, check-in validation, WiFi/IP validation, reservation rules, and state transitions unchanged.

## Layout Direction

1. Keep rectangular tables as the default demo table shape.
2. Arrange Library Area A tables in row-major order: two columns, five rows, T01 through T10.
3. Keep each table at four seats, two above and two below.
4. Use a tighter coordinate scale and default fit zoom so ten tables are visible without excessive blank canvas.
5. Preserve collision avoidance so table-and-seat footprints do not overlap when admins place tables too closely.

## Stable Behaviors

- Seat labels still restart from 1 within every table.
- Locked, reserved, using, abnormal, available, and unpublished states stay visually distinct.
- The same `SeatMap` component continues to serve student and admin views.
