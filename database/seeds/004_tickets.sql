-- Phieu mau voi ma co dinh BH-0000xx/2026 (khong dung chung day so voi sequence 100001+).
-- CTE: chi ghi status log cho phieu VUA duoc chen -> chay lai khong nhan doi log (C5).
WITH src AS (
  SELECT * FROM (VALUES
    ('BH-000001/2026', 'SN-IP15-2026-88', 'Màn hình', 'Màn hình chớp nháy, sọc xanh dọc',     'CAO',        'MOI',          true,  '-30 hours', '-6 hours'),
    ('BH-000002/2026', 'SN-S24-2026-15',  'Pin',      'Pin tụt nhanh, sập nguồn khi còn 20%', 'TRUNG_BINH', 'MOI',          true,  '-20 hours', '2 hours'),
    ('BH-000003/2026', 'SN-RN13-2024-31', 'Sạc',      'Không nhận sạc, cổng sạc lỏng',        'TRUNG_BINH', 'MOI',          false, '-4 hours',  '60 hours'),
    ('BH-000004/2026', 'SN-RENO-2026-02', 'Phần mềm', 'Treo logo sau khi cập nhật',           'THAP',       'CHO_XAC_MINH', true,  '-2 hours',  '110 hours'),
    ('BH-000005/2026', 'SN-Y36-2025-90',  'Nước vào', 'Rơi xuống nước, không lên nguồn',      'CAO',        'MOI',          true,  '-1 hours',  '20 hours')
  ) AS t(ticket_code, serial_no, category_name, issue_desc, priority, status, is_warranty, received_offset, due_offset)
),
ins AS (
  INSERT INTO ticket (ticket_code, customer_id, device_id, center_id, created_by, category_id,
                      issue_desc, priority, status, received_at, due_date, is_warranty)
  SELECT s.ticket_code, d.customer_id, d.device_id, e.center_id, e.employee_id, ic.category_id,
         s.issue_desc, s.priority, s.status,
         CURRENT_TIMESTAMP + s.received_offset::interval,
         CURRENT_TIMESTAMP + s.due_offset::interval,
         s.is_warranty
  FROM src s
  JOIN device d          ON d.serial_no = s.serial_no
  JOIN issue_category ic ON ic.category_name = s.category_name
  JOIN employee e        ON e.username = 'letan01'
  ON CONFLICT (ticket_code) DO NOTHING
  RETURNING ticket_id, status, created_by, received_at
)
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by, note)
SELECT ticket_id, NULL, status, received_at, created_by, 'Tạo phiếu (dữ liệu mẫu)'
FROM ins;
