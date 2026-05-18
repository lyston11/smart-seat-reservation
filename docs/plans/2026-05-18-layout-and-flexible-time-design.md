# Layout And Flexible Time Design

## Goal

Upgrade the seat reservation system so tables can be positioned like a real study room and students can reserve a custom time range inside administrator-defined opening hours.

## Design

The current system already has `tables`, `seats`, and `seat_slots`. This change keeps those boundaries to avoid breaking check-in, check-out, dashboard, and admin release flows.

Tables gain coordinate-style layout fields: `position_x`, `position_y`, `width_px`, `height_px`, and `rotation_deg`. The existing row/column fields remain as compatibility data, but the student map and admin table management prefer coordinates. Demo data will use long rectangular tables with two seats on the north side and two seats on the south side.

Areas gain opening-window fields: `open_time` and `close_time`. Administrators can set the daily start and end time on the area. Students choose date, start time, end time, and a concrete seat. The backend validates the selected time range against the area opening window, the advance-day rule, past-time rules, student overlap rules, and seat overlap rules.

Instead of pre-generating every possible slot, the backend dynamically creates one `seat_slots` row for the student's exact selected range when the reservation succeeds. Existing reservation status transitions continue to use the created `seat_slot_id`.

## Implementation Plan

1. Add migration fields for area opening windows and table coordinate layout.
2. Extend backend entities, DTOs, mappers, and tests for layout and flexible reservation.
3. Add a new reservation request path using `seatId`, `slotDate`, `startTime`, and `endTime`.
4. Update student UI to choose start/end time and reserve a seat directly.
5. Update table layout rendering to support long rectangular tables and real coordinate placement.
6. Update admin table and area forms to maintain the new fields.
7. Update docs, dev log, and run full verification.
