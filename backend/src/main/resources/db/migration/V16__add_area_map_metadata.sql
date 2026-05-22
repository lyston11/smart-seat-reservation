ALTER TABLE areas
    ADD COLUMN building_code VARCHAR(32) NULL AFTER floor,
    ADD COLUMN floor_code VARCHAR(32) NULL AFTER building_code,
    ADD COLUMN area_type VARCHAR(32) NULL AFTER floor_code,
    ADD COLUMN map_x INT NULL AFTER area_type,
    ADD COLUMN map_y INT NULL AFTER map_x;

UPDATE areas
SET building_code = 'A',
    floor_code = COALESCE(NULLIF(floor, ''), '1F'),
    area_type = 'STUDY_ROOM',
    map_x = 20,
    map_y = 35
WHERE name = 'Library Area A';

UPDATE areas
SET building_code = 'B',
    floor_code = COALESCE(NULLIF(floor, ''), '2F'),
    area_type = 'STUDY_ROOM',
    map_x = 80,
    map_y = 35
WHERE name = 'Teaching Building Area B';
