-- Khach hang va thiet bi mau (SDT da chuan hoa theo QT-02).
INSERT INTO customer (full_name, phone, email, address) VALUES
  ('Nguyễn Văn An',     '0901234567', 'an.nguyen@example.com', 'Ninh Kiều, Cần Thơ'),
  ('Trần Thị Bích',     '0912345678', NULL,                    'Cái Răng, Cần Thơ'),
  ('Lê Hoàng Cường',    '0987654321', 'cuong.le@example.com',  'Bình Thủy, Cần Thơ'),
  ('Phạm Thu Dung',     '0938111222', NULL,                    'Vĩnh Long'),
  ('Võ Minh Em',        '0977333444', NULL,                    'Long Xuyên, An Giang'),
  ('Huỳnh Gia Phúc',    '0966555666', 'phuc.huynh@example.com','Ô Môn, Cần Thơ')
ON CONFLICT (phone) DO NOTHING;

-- purchase_date tinh tuong doi theo ngay chay seed de luon co du 3 truong hop QT-05:
-- con bao hanh, het bao hanh, chua xac minh (NULL).
INSERT INTO device (customer_id, product_id, serial_no, purchase_date, warranty_months)
SELECT c.customer_id, p.product_id, v.serial_no, v.purchase_date, v.warranty_months
FROM (VALUES
  ('0901234567', 'IP15-128',    'SN-IP15-2026-88',   (CURRENT_DATE - INTERVAL '3 months')::date,  12),
  ('0901234567', 'IPAD-AIR-M2', 'SN-IPAD-2025-07',   (CURRENT_DATE - INTERVAL '14 months')::date, 12),
  ('0912345678', 'SS-S24-256',  'SN-S24-2026-15',    (CURRENT_DATE - INTERVAL '5 months')::date,  12),
  ('0987654321', 'XM-RN13',     'SN-RN13-2024-31',   (CURRENT_DATE - INTERVAL '20 months')::date, 18),
  ('0938111222', 'OP-RENO11F',  'SN-RENO-2026-02',   NULL,                                         12),
  ('0977333444', 'SS-A55',      'SN-A55-2026-44',    (CURRENT_DATE - INTERVAL '1 months')::date,  12),
  ('0966555666', 'VV-Y36',      'SN-Y36-2025-90',    (CURRENT_DATE - INTERVAL '11 months')::date, 12)
) AS v(phone, model_code, serial_no, purchase_date, warranty_months)
JOIN customer c ON c.phone = v.phone
JOIN product  p ON p.model_code = v.model_code
ON CONFLICT (serial_no) DO NOTHING;
