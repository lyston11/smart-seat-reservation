INSERT INTO tables (
    area_id,
    table_no,
    name,
    qr_token,
    row_no,
    column_no,
    display_order,
    position_x,
    position_y,
    width_px,
    height_px,
    rotation_deg
)
SELECT a.id, seed.table_no, seed.name, CONCAT('demo-area-', a.id, '-table-', LOWER(seed.table_no)),
       seed.row_no, seed.column_no, seed.display_order, seed.position_x, seed.position_y,
       seed.width_px, seed.height_px, 0
FROM (
    SELECT 'T01' AS table_no, 'Library Area A T01' AS name, 1 AS row_no, 1 AS column_no, 1 AS display_order, 120 AS position_x, 90 AS position_y, 260 AS width_px, 96 AS height_px
    UNION ALL SELECT 'T02', 'Library Area A T02', 1, 2, 2, 520, 90, 260, 96
    UNION ALL SELECT 'T03', 'Library Area A T03', 2, 1, 3, 120, 320, 260, 96
    UNION ALL SELECT 'T04', 'Library Area A T04', 2, 2, 4, 520, 320, 260, 96
    UNION ALL SELECT 'T05', 'Library Area A T05', 3, 1, 5, 120, 550, 260, 96
    UNION ALL SELECT 'T06', 'Library Area A T06', 3, 2, 6, 520, 550, 260, 96
    UNION ALL SELECT 'T07', 'Library Area A T07', 4, 1, 7, 120, 780, 260, 96
    UNION ALL SELECT 'T08', 'Library Area A T08', 4, 2, 8, 520, 780, 260, 96
    UNION ALL SELECT 'T09', 'Library Area A T09', 5, 1, 9, 120, 1010, 260, 96
    UNION ALL SELECT 'T10', 'Library Area A T10', 5, 2, 10, 520, 1010, 260, 96
) seed
JOIN areas a ON a.name = 'Library Area A'
LEFT JOIN tables existing ON existing.area_id = a.id AND existing.table_no = seed.table_no
WHERE existing.id IS NULL;

UPDATE tables t
JOIN areas a ON a.id = t.area_id AND a.name = 'Library Area A'
JOIN (
    SELECT 'T01' AS table_no, 1 AS row_no, 1 AS column_no, 1 AS display_order, 120 AS position_x, 90 AS position_y
    UNION ALL SELECT 'T02', 1, 2, 2, 520, 90
    UNION ALL SELECT 'T03', 2, 1, 3, 120, 320
    UNION ALL SELECT 'T04', 2, 2, 4, 520, 320
    UNION ALL SELECT 'T05', 3, 1, 5, 120, 550
    UNION ALL SELECT 'T06', 3, 2, 6, 520, 550
    UNION ALL SELECT 'T07', 4, 1, 7, 120, 780
    UNION ALL SELECT 'T08', 4, 2, 8, 520, 780
    UNION ALL SELECT 'T09', 5, 1, 9, 120, 1010
    UNION ALL SELECT 'T10', 5, 2, 10, 520, 1010
) seed ON seed.table_no = t.table_no
SET t.row_no = seed.row_no,
    t.column_no = seed.column_no,
    t.display_order = seed.display_order,
    t.position_x = seed.position_x,
    t.position_y = seed.position_y,
    t.width_px = 260,
    t.height_px = 96,
    t.rotation_deg = 0,
    t.status = 'ACTIVE';

INSERT INTO seats (
    area_id,
    table_id,
    seat_no,
    seat_label,
    seat_side,
    seat_order,
    qr_token,
    row_no,
    column_no,
    display_order,
    status
)
SELECT a.id, t.id, CONCAT('A-', LPAD((table_seed.display_order - 1) * 4 + seat_seed.local_order, 3, '0')),
       CAST(seat_seed.local_order AS CHAR), seat_seed.seat_side, seat_seed.seat_order,
       CONCAT('demo-area-', a.id, '-seat-', LOWER(table_seed.table_no), '-', seat_seed.local_order),
       seat_seed.row_no, seat_seed.column_no, (table_seed.display_order - 1) * 4 + seat_seed.local_order, 'ACTIVE'
FROM areas a
JOIN (
    SELECT 'T01' AS table_no, 1 AS display_order
    UNION ALL SELECT 'T02', 2
    UNION ALL SELECT 'T03', 3
    UNION ALL SELECT 'T04', 4
    UNION ALL SELECT 'T05', 5
    UNION ALL SELECT 'T06', 6
    UNION ALL SELECT 'T07', 7
    UNION ALL SELECT 'T08', 8
    UNION ALL SELECT 'T09', 9
    UNION ALL SELECT 'T10', 10
) table_seed
JOIN tables t ON t.area_id = a.id AND t.table_no = table_seed.table_no
JOIN (
    SELECT 1 AS local_order, 'NORTH' AS seat_side, 1 AS seat_order, 1 AS row_no, 1 AS column_no
    UNION ALL SELECT 2, 'NORTH', 2, 1, 2
    UNION ALL SELECT 3, 'SOUTH', 1, 2, 1
    UNION ALL SELECT 4, 'SOUTH', 2, 2, 2
) seat_seed
LEFT JOIN seats existing
  ON existing.area_id = a.id
 AND existing.seat_no = CONCAT('A-', LPAD((table_seed.display_order - 1) * 4 + seat_seed.local_order, 3, '0'))
WHERE a.name = 'Library Area A'
  AND existing.id IS NULL;

UPDATE seats s
JOIN areas a ON a.id = s.area_id AND a.name = 'Library Area A'
JOIN tables t ON t.id = s.table_id
SET s.seat_label = CASE
        WHEN s.seat_side = 'NORTH' AND s.seat_order = 1 THEN '1'
        WHEN s.seat_side = 'NORTH' AND s.seat_order = 2 THEN '2'
        WHEN s.seat_side = 'SOUTH' AND s.seat_order = 1 THEN '3'
        WHEN s.seat_side = 'SOUTH' AND s.seat_order = 2 THEN '4'
        ELSE s.seat_label
    END,
    s.row_no = CASE
        WHEN s.seat_side = 'NORTH' THEN 1
        WHEN s.seat_side = 'SOUTH' THEN 2
        ELSE s.row_no
    END,
    s.column_no = CASE
        WHEN s.seat_order IN (1, 2) THEN s.seat_order
        ELSE s.column_no
    END
WHERE t.table_no IN ('T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10');

INSERT INTO seat_slots (seat_id, area_id, slot_date, start_time, end_time)
SELECT s.id, a.id, slot_seed.slot_date, slot_seed.start_time, slot_seed.end_time
FROM areas a
JOIN tables t ON t.area_id = a.id AND t.status = 'ACTIVE'
JOIN seats s ON s.table_id = t.id AND s.status = 'ACTIVE'
JOIN (
    SELECT CURRENT_DATE AS slot_date, '08:00:00' AS start_time, '22:00:00' AS end_time
    UNION ALL SELECT CURRENT_DATE + INTERVAL 1 DAY, '08:00:00', '22:00:00'
) slot_seed
LEFT JOIN seat_slots existing
  ON existing.seat_id = s.id
 AND existing.slot_date = slot_seed.slot_date
 AND existing.start_time = slot_seed.start_time
 AND existing.end_time = slot_seed.end_time
WHERE a.name = 'Library Area A'
  AND t.table_no IN ('T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10')
  AND existing.id IS NULL;
