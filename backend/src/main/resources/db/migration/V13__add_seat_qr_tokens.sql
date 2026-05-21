ALTER TABLE seats
    ADD COLUMN qr_token VARCHAR(128) NULL AFTER seat_order,
    ADD UNIQUE KEY uk_seats_qr_token (qr_token);

UPDATE seats
SET qr_token = CONCAT('seat-', id, '-', REPLACE(UUID(), '-', ''))
WHERE qr_token IS NULL;

ALTER TABLE seats
    MODIFY qr_token VARCHAR(128) NOT NULL;
