SET @add_seat_qr_column = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE seats ADD COLUMN qr_token VARCHAR(128) NULL AFTER seat_order',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'seats'
      AND column_name = 'qr_token'
);
PREPARE add_seat_qr_column_stmt FROM @add_seat_qr_column;
EXECUTE add_seat_qr_column_stmt;
DEALLOCATE PREPARE add_seat_qr_column_stmt;

SET @add_seat_qr_index = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE seats ADD UNIQUE KEY uk_seats_qr_token (qr_token)',
        'SELECT 1'
    )
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'seats'
      AND index_name = 'uk_seats_qr_token'
);
PREPARE add_seat_qr_index_stmt FROM @add_seat_qr_index;
EXECUTE add_seat_qr_index_stmt;
DEALLOCATE PREPARE add_seat_qr_index_stmt;

UPDATE seats
SET qr_token = CONCAT('seat-', id, '-', REPLACE(UUID(), '-', ''))
WHERE qr_token IS NULL
   OR qr_token = '';

ALTER TABLE seats
    MODIFY qr_token VARCHAR(128) NOT NULL;
