ALTER TABLE areas
    ADD COLUMN checkin_ip_cidrs VARCHAR(512) NOT NULL DEFAULT '127.0.0.1/32,::1/128' AFTER close_time;

UPDATE areas
SET checkin_ip_cidrs = CASE id
    WHEN 1 THEN '127.0.0.1/32,::1/128,10.10.0.0/16'
    WHEN 2 THEN '127.0.0.1/32,::1/128,10.20.0.0/16'
    ELSE checkin_ip_cidrs
END;

ALTER TABLE reservation_rules
    ADD COLUMN checkin_lead_minutes INT NOT NULL DEFAULT 10 AFTER checkin_grace_minutes,
    ADD COLUMN wifi_offline_release_minutes INT NOT NULL DEFAULT 15 AFTER daily_active_reservation_limit;

UPDATE reservation_rules
SET checkin_grace_minutes = CASE
        WHEN checkin_grace_minutes = 15 THEN 10
        ELSE checkin_grace_minutes
    END,
    checkin_lead_minutes = 10,
    wifi_offline_release_minutes = 15
WHERE id = 1;

ALTER TABLE reservations
    ADD COLUMN last_wifi_seen_at DATETIME NULL AFTER checked_out_at,
    ADD COLUMN last_wifi_ip VARCHAR(45) NULL AFTER last_wifi_seen_at,
    ADD INDEX idx_reservations_wifi_presence (status, last_wifi_seen_at);
