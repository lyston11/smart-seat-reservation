CREATE TABLE tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    area_id BIGINT NOT NULL,
    table_no VARCHAR(32) NOT NULL,
    name VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    qr_token VARCHAR(128) NOT NULL,
    row_no INT NULL,
    column_no INT NULL,
    display_order INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tables_area_table_no (area_id, table_no),
    UNIQUE KEY uk_tables_qr_token (qr_token),
    KEY idx_tables_area_id (area_id),
    CONSTRAINT fk_tables_area_id FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE seats
    ADD COLUMN table_id BIGINT NULL AFTER area_id,
    ADD COLUMN seat_label VARCHAR(32) NULL AFTER seat_no,
    ADD COLUMN seat_side VARCHAR(32) NULL AFTER seat_label,
    ADD COLUMN seat_order INT NULL AFTER seat_side,
    ADD KEY idx_seats_table_id (table_id),
    ADD CONSTRAINT fk_seats_table_id FOREIGN KEY (table_id) REFERENCES tables (id);

INSERT INTO tables (
    area_id,
    table_no,
    name,
    qr_token,
    row_no,
    column_no,
    display_order
)
SELECT
    a.id,
    'T01',
    'Library Area A T01',
    'demo-area-1-table-t01',
    1,
    1,
    1
FROM areas a
WHERE a.name = 'Library Area A'
UNION ALL
SELECT
    a.id,
    'T01',
    'Teaching Building Area B T01',
    'demo-area-2-table-t01',
    1,
    1,
    1
FROM areas a
WHERE a.name = 'Teaching Building Area B';

UPDATE seats s
JOIN areas a ON a.id = s.area_id AND a.name = 'Library Area A'
JOIN tables t ON t.area_id = a.id AND t.table_no = 'T01'
SET s.table_id = t.id,
    s.seat_label = CASE s.seat_no
        WHEN 'A-001' THEN '1'
        WHEN 'A-002' THEN '2'
        WHEN 'A-003' THEN '3'
        WHEN 'A-004' THEN '4'
    END,
    s.seat_side = CASE s.seat_no
        WHEN 'A-001' THEN 'NORTH'
        WHEN 'A-002' THEN 'EAST'
        WHEN 'A-003' THEN 'SOUTH'
        WHEN 'A-004' THEN 'WEST'
    END,
    s.seat_order = 1
WHERE s.seat_no IN ('A-001', 'A-002', 'A-003', 'A-004');

UPDATE seats s
JOIN areas a ON a.id = s.area_id AND a.name = 'Teaching Building Area B'
JOIN tables t ON t.area_id = a.id AND t.table_no = 'T01'
SET s.table_id = t.id,
    s.seat_label = CASE s.seat_no
        WHEN 'B-001' THEN '1'
        WHEN 'B-002' THEN '2'
    END,
    s.seat_side = CASE s.seat_no
        WHEN 'B-001' THEN 'WEST'
        WHEN 'B-002' THEN 'EAST'
    END,
    s.seat_order = 1
WHERE s.seat_no IN ('B-001', 'B-002');

INSERT INTO tables (
    area_id,
    table_no,
    name,
    qr_token,
    row_no,
    column_no,
    display_order
)
SELECT DISTINCT
    s.area_id,
    'LEGACY',
    NULL,
    CONCAT('area-', s.area_id, '-legacy-table'),
    NULL,
    NULL,
    9999
FROM seats s
LEFT JOIN tables t ON t.area_id = s.area_id AND t.table_no = 'LEGACY'
WHERE s.table_id IS NULL
  AND t.id IS NULL;

UPDATE seats s
JOIN tables t ON t.area_id = s.area_id AND t.table_no = 'LEGACY'
SET s.table_id = t.id,
    s.seat_label = s.seat_no,
    s.seat_side = 'SINGLE',
    s.seat_order = COALESCE(s.display_order, s.id)
WHERE s.table_id IS NULL;
