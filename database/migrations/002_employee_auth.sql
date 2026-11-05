-- 002 - TD-08: them cot dang nhap cho employee (JWT - NFR4)
ALTER TABLE employee ADD COLUMN IF NOT EXISTS username      VARCHAR(50);
ALTER TABLE employee ADD COLUMN IF NOT EXISTS password_hash VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_username ON employee(username);
