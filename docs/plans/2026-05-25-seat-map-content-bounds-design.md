# Seat Map Content Bounds Design Notes

## Goal

Make the coordinate seat map canvas size follow the visible table-and-seat footprint instead of leaving a large empty room area.

## Scope

- Shared `SeatMap` rendering for student and admin student-view maps.
- No API, database, QR, check-in, reservation rule, or state-machine changes.

## Chosen Approach

Normalize coordinate tables in two passes:

1. Keep the existing coordinate scaling, fallback placement, and collision avoidance.
2. Compute the complete table-and-seat footprint bounds after collision adjustment.
3. Shift every positioned table so the minimum footprint starts near a small fixed canvas padding.
4. Compute the canvas width and height from the shifted footprint plus compact padding.

This keeps each table's relative layout, preserves admin-provided placement intent, and removes blank space caused by coordinates far from the origin or old fixed room minimums.

## Alternatives Considered

- Reduce existing padding only: simpler, but does not solve empty space when table coordinates start far from the origin.
- Hide overflow with CSS clipping: visual-only fix that makes zoom and table interactions harder to reason about.

## Testing Direction

- Add a `SeatMap` test where two tables have far-away coordinates and assert the canvas starts near the rendered tables instead of preserving empty origin space.
- Keep the existing ten-table two-column/five-row test so the demo room remains stable.
