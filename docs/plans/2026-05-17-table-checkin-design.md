# Table QR Check-In Design

## Goal

Build a long-term table-based check-in flow for the study seat reservation system. Students should reserve a specific seat through a visual seat map, then scan the fixed QR code on that table when they arrive. The system matches the scanned table with the student's reserved seat and completes check-in only when the reservation is valid.

## Background

The current system already supports areas, seats, seat slots, reservations, check-in codes, check-out, cancellation, overdue release, admin release, audit logs, and reservation rules. The next step is to make the physical check-in experience match real study rooms:

- Some tables have 4 seats.
- Some tables have 2 seats.
- Some tables have only 1 seat.
- Students must be able to select a concrete seat from a visual layout.
- A fixed QR code should be attached to the table, not to every individual seat.

## Recommended Approach

Add `tables` as a first-class resource. A table belongs to an area, has its own stable QR token, and owns multiple seats. A reservation still targets one concrete seat slot, but QR check-in verifies that the reserved seat belongs to the scanned table.

This avoids treating tables as a loose `tableNo` string on seats. Since table QR codes, table status, layout position, and future usage statistics all belong to the table, the table should have its own database row.

## Data Model

Create a new `tables` table:

```text
id
area_id
table_no
name
status
qr_token
row_no
column_no
display_order
created_at
updated_at
```

Add table layout fields to `seats`:

```text
table_id
seat_label
seat_side
seat_order
```

Field meanings:

- `tables.area_id`: the area where the table is located.
- `tables.table_no`: human-friendly table number, such as `T01`.
- `tables.qr_token`: stable random token used in QR links. The QR should use the token rather than exposing the table id.
- `tables.row_no`, `tables.column_no`, `tables.display_order`: table position in the area layout.
- `seats.table_id`: the table that owns this seat.
- `seats.seat_label`: short label shown in the visual seat map, such as `1`, `2`, `A`, or `靠窗`.
- `seats.seat_side`: position around the table, such as `NORTH`, `EAST`, `SOUTH`, `WEST`, or `SINGLE`.
- `seats.seat_order`: order when multiple seats share one side.

Recommended constraints:

- `tables`: unique `(area_id, table_no)`.
- `tables`: unique `qr_token`.
- `seats.table_id` references `tables.id`.
- Every active seat should belong to one active table.

## Demo Data Migration

Existing demo seats should be migrated into default tables so the project remains runnable after migration.

Example:

```text
Area 1:
  T01: A-001, A-002, A-003, A-004

Area 2:
  T01: B-001, B-002
```

The migration can assign reasonable default layout:

- Four-seat table: `NORTH`, `EAST`, `SOUTH`, `WEST`.
- Two-seat table: `WEST`, `EAST`.
- Single-seat table: `SINGLE`.

## Student Flow

1. Student opens the seat map.
2. The seat map groups concrete seats by table.
3. Student selects one available seat around a table.
4. The system creates a reservation for the selected `seatSlotId`.
5. Student arrives at the physical table and scans the fixed table QR code.
6. The QR opens:

```text
/student/table-checkin?token=<tableQrToken>
```

7. Student enters or pastes the dynamic check-in code from the reservation.
8. Backend verifies that the token resolves to an active table and the current student has a valid reserved seat under that table.
9. Reservation becomes `CHECKED_IN`; seat slot becomes `USING`.

## Admin Flow

Admins should be able to:

- Maintain tables under an area.
- Set a table's layout position.
- Maintain seats under a table.
- Set a seat's label and side around the table.
- View or copy each table's fixed QR link.
- Print or screenshot the QR for physical placement.

The first implementation can keep this pragmatic:

- Add table fields to existing seat-management flows.
- Add a table management page if the scope allows.
- Add QR viewing in the admin table or seat management interface.

## Backend API Design

Table management:

```text
GET /api/tables?areaId=1
POST /api/tables
PUT /api/tables/{id}
PATCH /api/tables/{id}/status
GET /api/tables/{id}/checkin-qr
```

Table check-in:

```text
POST /api/reservations/table-check-in
```

Request:

```json
{
  "tableQrToken": "stable-token",
  "checkinCode": "dynamic-reservation-code"
}
```

Validation:

- Current user must be a student.
- Table token must exist.
- Table must be active.
- The student must have a `RESERVED` reservation whose seat belongs to the table.
- `checkinCode` must match that reservation.
- Reservation must not be expired.
- The linked seat slot must still be `RESERVED`.

On success, reuse existing reservation check-in state transition:

```text
reservations: RESERVED -> CHECKED_IN
seat_slots:   RESERVED -> USING
```

Also write a `CHECK_IN` check-in record and evict the seat slot cache for the table's area/date.

## Frontend Design

Student pages:

- Keep the existing student seat map route.
- Render seats grouped by table.
- Show table number in the visual map.
- Render concrete seat points around the table based on `seatSide`.
- Keep status colors for `AVAILABLE`, `RESERVED`, `USING`, and `ABNORMAL`.
- Add `/student/table-checkin?token=<tableQrToken>`.

Admin pages:

- Add table management or table fields into the existing resource management flow.
- Let admins view and copy each table QR link.
- Let admins configure seat labels and seat sides so 4-seat, 2-seat, and 1-seat tables can render consistently.

## Error Handling

The table check-in page should show clear, actionable messages:

- QR code is invalid.
- Table is inactive.
- No matching pending reservation exists for this table.
- Check-in code is incorrect.
- Reservation has expired.
- Seat slot is no longer reserved.

These errors should not leak other students' reservation details.

## Testing Strategy

Backend tests:

- Table token resolves to active table.
- Student can check in when reserved seat belongs to scanned table.
- Check-in fails when reservation belongs to another table.
- Check-in fails with wrong code.
- Check-in fails after expiration.
- Check-in changes reservation and slot states atomically.

Frontend tests:

- Seat map renders grouped table layout.
- Table check-in page reads token from the URL.
- Submit button calls the table check-in API.
- Success and failure messages render correctly.

Manual verification:

- Create or use demo tables and seats.
- Reserve a concrete seat from the visual map.
- Open the table QR URL.
- Enter reservation check-in code.
- Confirm reservation status changes to checked in and seat status changes to using.

## Non-Goals For First Version

- CAD-level floor plans.
- QR image download as a polished printable PDF.
- Different reservation rules per table.
- Table-level usage analytics.
- Auto-detecting the student's active reservation without entering a check-in code.

These can be added later on top of the table model.
