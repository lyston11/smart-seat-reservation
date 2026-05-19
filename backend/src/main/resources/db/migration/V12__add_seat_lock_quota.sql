ALTER TABLE reservations
    ADD COLUMN seat_lock_quota INT NOT NULL DEFAULT 0 AFTER last_wifi_ip,
    ADD COLUMN seat_lock_used_count INT NOT NULL DEFAULT 0 AFTER seat_lock_quota,
    ADD COLUMN locked_until_at DATETIME NULL AFTER seat_lock_used_count,
    ADD INDEX idx_reservations_active_lock (status, locked_until_at);

ALTER TABLE reservation_rules
    ADD COLUMN reservation_open_hour INT NOT NULL DEFAULT 18 AFTER max_advance_days,
    ADD COLUMN seat_lock_minutes INT NOT NULL DEFAULT 60 AFTER wifi_offline_release_minutes;

UPDATE reservation_rules
SET reservation_open_hour = 18,
    seat_lock_minutes = 60
WHERE id = 1;
