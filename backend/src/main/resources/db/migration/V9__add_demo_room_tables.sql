UPDATE tables t
JOIN areas a ON a.id = t.area_id
SET t.position_x = CASE
        WHEN a.name = 'Library Area A' AND t.table_no = 'T01' THEN 120
        WHEN a.name = 'Teaching Building Area B' AND t.table_no = 'T01' THEN 120
        ELSE t.position_x
    END,
    t.position_y = CASE
        WHEN a.name = 'Library Area A' AND t.table_no = 'T01' THEN 90
        WHEN a.name = 'Teaching Building Area B' AND t.table_no = 'T01' THEN 90
        ELSE t.position_y
    END,
    t.width_px = CASE
        WHEN t.table_no = 'T01' THEN 260
        ELSE t.width_px
    END,
    t.height_px = CASE
        WHEN t.table_no = 'T01' THEN 96
        ELSE t.height_px
    END
WHERE (a.name = 'Library Area A' AND t.table_no = 'T01')
   OR (a.name = 'Teaching Building Area B' AND t.table_no = 'T01');

UPDATE seats
SET status = 'INACTIVE'
WHERE seat_no LIKE 'A-DEV-%'
   OR seat_no LIKE 'B-DEV-%';

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
    SELECT 'Library Area A' AS area_name, 'T02' AS table_no, 'Library Area A T02' AS name, 1 AS row_no, 2 AS column_no, 2 AS display_order, 520 AS position_x, 90 AS position_y, 260 AS width_px, 96 AS height_px
    UNION ALL SELECT 'Library Area A', 'T03', 'Library Area A T03', 2, 1, 3, 120, 330, 260, 96
    UNION ALL SELECT 'Library Area A', 'T04', 'Library Area A T04', 2, 2, 4, 520, 330, 260, 96
    UNION ALL SELECT 'Teaching Building Area B', 'T02', 'Teaching Building Area B T02', 1, 2, 2, 520, 90, 260, 96
) seed
JOIN areas a ON a.name = seed.area_name
LEFT JOIN tables existing ON existing.area_id = a.id AND existing.table_no = seed.table_no
WHERE existing.id IS NULL;

INSERT INTO seats (
    area_id,
    table_id,
    seat_no,
    seat_label,
    seat_side,
    seat_order,
    row_no,
    column_no,
    display_order,
    status
)
SELECT a.id, t.id, CONCAT('A-', LPAD(seed.seat_no, 3, '0')), seed.seat_label,
       seed.seat_side, seed.seat_order, seed.row_no, seed.column_no, seed.display_order, 'ACTIVE'
FROM areas a
JOIN (
    SELECT 'T02' AS table_no, 5 AS seat_no, '5' AS seat_label, 'NORTH' AS seat_side, 1 AS seat_order, 1 AS row_no, 1 AS column_no, 5 AS display_order
    UNION ALL SELECT 'T02', 6, '6', 'NORTH', 2, 1, 2, 6
    UNION ALL SELECT 'T02', 7, '7', 'SOUTH', 1, 2, 1, 7
    UNION ALL SELECT 'T02', 8, '8', 'SOUTH', 2, 2, 2, 8
    UNION ALL SELECT 'T03', 9, '9', 'NORTH', 1, 1, 1, 9
    UNION ALL SELECT 'T03', 10, '10', 'NORTH', 2, 1, 2, 10
    UNION ALL SELECT 'T03', 11, '11', 'SOUTH', 1, 2, 1, 11
    UNION ALL SELECT 'T03', 12, '12', 'SOUTH', 2, 2, 2, 12
    UNION ALL SELECT 'T04', 13, '13', 'NORTH', 1, 1, 1, 13
    UNION ALL SELECT 'T04', 14, '14', 'NORTH', 2, 1, 2, 14
    UNION ALL SELECT 'T04', 15, '15', 'SOUTH', 1, 2, 1, 15
    UNION ALL SELECT 'T04', 16, '16', 'SOUTH', 2, 2, 2, 16
) seed
JOIN tables t ON t.area_id = a.id AND t.table_no = seed.table_no
WHERE a.name = 'Library Area A'
  AND NOT EXISTS (
      SELECT 1
      FROM seats s
      WHERE s.area_id = a.id
        AND s.seat_no = CONCAT('A-', LPAD(seed.seat_no, 3, '0'))
  );

INSERT INTO seats (
    area_id,
    table_id,
    seat_no,
    seat_label,
    seat_side,
    seat_order,
    row_no,
    column_no,
    display_order,
    status
)
SELECT a.id, t.id, CONCAT('B-', LPAD(seed.seat_no, 3, '0')), seed.seat_label,
       seed.seat_side, seed.seat_order, seed.row_no, seed.column_no, seed.display_order, 'ACTIVE'
FROM areas a
JOIN (
    SELECT 'T02' AS table_no, 3 AS seat_no, '3' AS seat_label, 'NORTH' AS seat_side, 1 AS seat_order, 1 AS row_no, 1 AS column_no, 3 AS display_order
    UNION ALL SELECT 'T02', 4, '4', 'NORTH', 2, 1, 2, 4
    UNION ALL SELECT 'T02', 5, '5', 'SOUTH', 1, 2, 1, 5
    UNION ALL SELECT 'T02', 6, '6', 'SOUTH', 2, 2, 2, 6
) seed
JOIN tables t ON t.area_id = a.id AND t.table_no = seed.table_no
WHERE a.name = 'Teaching Building Area B'
  AND NOT EXISTS (
      SELECT 1
      FROM seats s
      WHERE s.area_id = a.id
        AND s.seat_no = CONCAT('B-', LPAD(seed.seat_no, 3, '0'))
  );
