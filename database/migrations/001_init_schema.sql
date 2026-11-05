-- =====================================================================
-- 001 - Khoi tao CSDL Smart CRM - Luong L2 (PostgreSQL 16)
-- Theo dung DDL da nop o BT1 (da sua theo TD-04, TD-05). 8 bang.
-- Sinh vien: Nguyen Hoang Thuan - MSSV: 2374802010489
-- IF NOT EXISTS de chay lai khong loi (C5).
-- =====================================================================

CREATE TABLE IF NOT EXISTS service_center (
    center_id   BIGSERIAL PRIMARY KEY,
    center_name VARCHAR(100) NOT NULL UNIQUE,
    address     VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NOT NULL
);

CREATE TABLE IF NOT EXISTS employee (
    employee_id BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    role        VARCHAR(30)  NOT NULL CHECK (role IN ('RECEPTIONIST', 'MANAGER')),
    center_id   BIGINT REFERENCES service_center(center_id) ON DELETE SET NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product (
    product_id   BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    brand        VARCHAR(50)  NOT NULL,
    model_code   VARCHAR(50) UNIQUE
);

CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(20)  NOT NULL UNIQUE,
    email       VARCHAR(120),
    address     VARCHAR(255),
    segment     VARCHAR(20) DEFAULT 'MOI',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device (
    device_id       BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    product_id      BIGINT NOT NULL REFERENCES product(product_id) ON DELETE RESTRICT,
    serial_no       VARCHAR(50) NOT NULL UNIQUE,
    purchase_date   DATE,
    warranty_months SMALLINT NOT NULL DEFAULT 12,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_category (
    category_id      SERIAL PRIMARY KEY,
    category_name    VARCHAR(60) NOT NULL UNIQUE,
    default_priority VARCHAR(10) NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    is_active        BOOLEAN NOT NULL DEFAULT true
);

CREATE SEQUENCE IF NOT EXISTS ticket_code_seq START WITH 100001;

CREATE TABLE IF NOT EXISTS ticket (
    ticket_id   BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(20) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
    device_id   BIGINT NOT NULL REFERENCES device(device_id) ON DELETE RESTRICT,
    center_id   BIGINT NOT NULL REFERENCES service_center(center_id) ON DELETE RESTRICT,
    created_by  BIGINT NOT NULL REFERENCES employee(employee_id) ON DELETE RESTRICT,
    category_id INT REFERENCES issue_category(category_id) ON DELETE SET NULL,
    issue_desc  TEXT NOT NULL CHECK (length(trim(issue_desc)) > 0),
    priority    VARCHAR(10) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status      VARCHAR(20) NOT NULL DEFAULT 'MOI' CHECK (status IN ('MOI', 'CHO_XAC_MINH')),
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date    TIMESTAMP NOT NULL,
    is_warranty BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ticket_status_log (
    log_id      BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status   VARCHAR(20) NOT NULL,
    changed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by  BIGINT NOT NULL REFERENCES employee(employee_id) ON DELETE RESTRICT,
    note        VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_device_customer          ON device(customer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_due        ON ticket(status, due_date);
CREATE INDEX IF NOT EXISTS idx_ticket_center_received   ON ticket(center_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_log_ticket        ON ticket_status_log(ticket_id, changed_at);
-- Ghi chu: phone, serial_no, ticket_code da co UNIQUE nen PostgreSQL tu tao chi muc,
-- khong tao them idx_customer_phone / idx_device_serial / idx_ticket_code (tranh trung chi muc).
