ALTER TABLE areas
    ADD COLUMN open_time TIME NOT NULL DEFAULT '08:00:00' AFTER status,
    ADD COLUMN close_time TIME NOT NULL DEFAULT '22:00:00' AFTER open_time;

ALTER TABLE tables
    ADD COLUMN position_x INT NOT NULL DEFAULT 80 AFTER display_order,
    ADD COLUMN position_y INT NOT NULL DEFAULT 80 AFTER position_x,
    ADD COLUMN width_px INT NOT NULL DEFAULT 220 AFTER position_y,
    ADD COLUMN height_px INT NOT NULL DEFAULT 96 AFTER width_px,
    ADD COLUMN rotation_deg INT NOT NULL DEFAULT 0 AFTER height_px;

UPDATE tables
SET position_x = COALESCE(column_no, 1) * 260 - 180,
    position_y = COALESCE(row_no, 1) * 180 - 100,
    width_px = 220,
    height_px = 96,
    rotation_deg = 0;

UPDATE seats
SET seat_side = CASE seat_no
    WHEN 'A-001' THEN 'NORTH'
    WHEN 'A-002' THEN 'NORTH'
    WHEN 'A-003' THEN 'SOUTH'
    WHEN 'A-004' THEN 'SOUTH'
    ELSE seat_side
END,
seat_order = CASE seat_no
    WHEN 'A-001' THEN 1
    WHEN 'A-002' THEN 2
    WHEN 'A-003' THEN 1
    WHEN 'A-004' THEN 2
    ELSE seat_order
END
WHERE seat_no IN ('A-001', 'A-002', 'A-003', 'A-004');
