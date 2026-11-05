-- Du lieu danh muc mau. ON CONFLICT DO NOTHING -> chay lai khong nhan doi (C5).
INSERT INTO service_center (center_name, address, phone) VALUES
  ('TTBH Mekong Cần Thơ',   '12 Đường 30/4, Ninh Kiều, Cần Thơ',        '02923888001'),
  ('TTBH Mekong Vĩnh Long', '88 Phạm Thái Bường, P.4, Vĩnh Long',       '02703888002'),
  ('TTBH Mekong Long Xuyên','25 Trần Hưng Đạo, Long Xuyên, An Giang',   '02963888003')
ON CONFLICT (center_name) DO NOTHING;

INSERT INTO issue_category (category_name, default_priority) VALUES
  ('Màn hình',  'CAO'),
  ('Pin',       'TRUNG_BINH'),
  ('Sạc',       'TRUNG_BINH'),
  ('Phần mềm',  'THAP'),
  ('Nước vào',  'CAO'),
  ('Khác',      'THAP')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO product (product_name, brand, model_code) VALUES
  ('iPhone 15 128GB',          'Apple',   'IP15-128'),
  ('iPhone 14 Pro 256GB',      'Apple',   'IP14P-256'),
  ('Galaxy S24 256GB',         'Samsung', 'SS-S24-256'),
  ('Galaxy A55 5G',            'Samsung', 'SS-A55'),
  ('Redmi Note 13',            'Xiaomi',  'XM-RN13'),
  ('OPPO Reno11 F',            'OPPO',    'OP-RENO11F'),
  ('Vivo Y36',                 'Vivo',    'VV-Y36'),
  ('iPad Air M2 11 inch',      'Apple',   'IPAD-AIR-M2')
ON CONFLICT (model_code) DO NOTHING;
