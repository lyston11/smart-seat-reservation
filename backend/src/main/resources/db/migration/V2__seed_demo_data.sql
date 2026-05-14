INSERT INTO users (name, student_no, role)
VALUES
    ('Demo Student', '20260001', 'STUDENT'),
    ('Demo Admin', 'admin', 'ADMIN');

INSERT INTO areas (name, floor, description)
VALUES
    ('Library Area A', '1F', 'Demo public study area'),
    ('Teaching Building Area B', '2F', 'Demo classroom study area');

INSERT INTO seats (area_id, seat_no)
VALUES
    (1, 'A-001'),
    (1, 'A-002'),
    (1, 'A-003'),
    (1, 'A-004'),
    (2, 'B-001'),
    (2, 'B-002');

INSERT INTO seat_slots (seat_id, area_id, slot_date, start_time, end_time)
VALUES
    (1, 1, CURRENT_DATE, '08:00:00', '10:00:00'),
    (2, 1, CURRENT_DATE, '08:00:00', '10:00:00'),
    (3, 1, CURRENT_DATE, '08:00:00', '10:00:00'),
    (4, 1, CURRENT_DATE, '08:00:00', '10:00:00'),
    (1, 1, CURRENT_DATE, '10:00:00', '12:00:00'),
    (2, 1, CURRENT_DATE, '10:00:00', '12:00:00'),
    (3, 1, CURRENT_DATE, '10:00:00', '12:00:00'),
    (4, 1, CURRENT_DATE, '10:00:00', '12:00:00'),
    (5, 2, CURRENT_DATE, '08:00:00', '10:00:00'),
    (6, 2, CURRENT_DATE, '08:00:00', '10:00:00');
