CREATE TABLE reservation_rules (
    id BIGINT PRIMARY KEY,
    checkin_grace_minutes INT NOT NULL,
    max_advance_days INT NOT NULL,
    daily_active_reservation_limit INT NOT NULL,
    updated_by BIGINT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_rules_updated_by FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO reservation_rules (
    id,
    checkin_grace_minutes,
    max_advance_days,
    daily_active_reservation_limit
)
VALUES (1, 15, 7, 3);
