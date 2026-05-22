CREATE TABLE seat_slot_publish_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    area_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_seat_slot_publish_plans_area_status (area_id, status),
    CONSTRAINT fk_seat_slot_publish_plans_area_id FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seat_slot_publish_plan_periods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_id BIGINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_seat_slot_publish_plan_period (plan_id, start_time, end_time),
    CONSTRAINT fk_seat_slot_publish_plan_periods_plan_id FOREIGN KEY (plan_id) REFERENCES seat_slot_publish_plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seat_slot_publish_plan_seats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_seat_slot_publish_plan_seat (plan_id, seat_id),
    CONSTRAINT fk_seat_slot_publish_plan_seats_plan_id FOREIGN KEY (plan_id) REFERENCES seat_slot_publish_plans (id),
    CONSTRAINT fk_seat_slot_publish_plan_seats_seat_id FOREIGN KEY (seat_id) REFERENCES seats (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seat_slot_publish_exceptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    area_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_seat_slot_publish_exception (area_id, slot_date),
    KEY idx_seat_slot_publish_exceptions_area_date (area_id, slot_date),
    CONSTRAINT fk_seat_slot_publish_exceptions_area_id FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
