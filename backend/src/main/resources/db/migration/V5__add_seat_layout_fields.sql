ALTER TABLE seats
    ADD COLUMN row_no INT NULL AFTER seat_no,
    ADD COLUMN column_no INT NULL AFTER row_no,
    ADD COLUMN display_order INT NULL AFTER column_no;

UPDATE seats
SET row_no = CASE id
        WHEN 1 THEN 1
        WHEN 2 THEN 1
        WHEN 3 THEN 2
        WHEN 4 THEN 2
        WHEN 5 THEN 1
        WHEN 6 THEN 1
        ELSE id
    END,
    column_no = CASE id
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 1
        WHEN 4 THEN 2
        WHEN 5 THEN 1
        WHEN 6 THEN 2
        ELSE 1
    END,
    display_order = id
WHERE row_no IS NULL
   OR column_no IS NULL
   OR display_order IS NULL;
