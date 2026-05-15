ALTER TABLE users
    ADD COLUMN password_hash VARCHAR(128) NULL AFTER student_no;

UPDATE users
SET password_hash = CASE
    WHEN student_no = 'admin' THEN '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    ELSE '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
END
WHERE password_hash IS NULL;
