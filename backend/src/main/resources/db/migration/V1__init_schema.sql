CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    student_no VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_users_student_no (student_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE areas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    floor VARCHAR(32) NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_areas_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    area_id BIGINT NOT NULL,
    seat_no VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_seats_area_seat_no (area_id, seat_no),
    KEY idx_seats_area_id (area_id),
    CONSTRAINT fk_seats_area_id FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seat_slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    seat_id BIGINT NOT NULL,
    area_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    reserved_by BIGINT NULL,
    reservation_id BIGINT NULL,
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_seat_slots_period (seat_id, slot_date, start_time, end_time),
    KEY idx_seat_slots_area_date_status (area_id, slot_date, status),
    KEY idx_seat_slots_reserved_by (reserved_by),
    CONSTRAINT fk_seat_slots_seat_id FOREIGN KEY (seat_id) REFERENCES seats (id),
    CONSTRAINT fk_seat_slots_area_id FOREIGN KEY (area_id) REFERENCES areas (id),
    CONSTRAINT fk_seat_slots_reserved_by FOREIGN KEY (reserved_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    seat_slot_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    checkin_code VARCHAR(64) NOT NULL,
    reserved_at DATETIME NOT NULL,
    checked_in_at DATETIME NULL,
    checked_out_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reservations_seat_slot_id (seat_slot_id),
    UNIQUE KEY uk_reservations_checkin_code (checkin_code),
    KEY idx_reservations_user_status (user_id, status),
    CONSTRAINT fk_reservations_user_id FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_reservations_seat_id FOREIGN KEY (seat_id) REFERENCES seats (id),
    CONSTRAINT fk_reservations_seat_slot_id FOREIGN KEY (seat_slot_id) REFERENCES seat_slots (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE seat_slots
    ADD CONSTRAINT fk_seat_slots_reservation_id FOREIGN KEY (reservation_id) REFERENCES reservations (id);

CREATE TABLE checkin_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(32) NOT NULL,
    occurred_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_checkin_records_reservation_id (reservation_id),
    KEY idx_checkin_records_user_id (user_id),
    CONSTRAINT fk_checkin_records_reservation_id FOREIGN KEY (reservation_id) REFERENCES reservations (id),
    CONSTRAINT fk_checkin_records_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
