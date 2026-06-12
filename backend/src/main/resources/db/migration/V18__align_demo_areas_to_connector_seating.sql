UPDATE areas
SET name = 'A/B 连廊学习区',
    floor = '2F',
    building_code = 'CONNECTOR',
    floor_code = '2F',
    area_type = 'CONNECTOR',
    map_x = 30,
    map_y = 30,
    description = 'A/B connector public study seats'
WHERE name = 'Library Area A';

UPDATE areas
SET name = 'B/C 连廊学习区',
    floor = '2F',
    building_code = 'CONNECTOR_CD',
    floor_code = '2F',
    area_type = 'CONNECTOR',
    map_x = 70,
    map_y = 30,
    description = 'B/C connector public study seats'
WHERE name = 'Teaching Building Area B';
