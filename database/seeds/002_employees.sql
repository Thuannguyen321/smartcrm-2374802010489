-- Tai khoan mau de demo. Mat khau chung: Mekong@2026 (chi dung cho moi truong dev).
INSERT INTO employee (full_name, role, center_id, username, password_hash)
SELECT v.full_name, v.role, c.center_id, v.username, '$2a$10$V5Xe1kHwot50nl48dB37melRyfWdcIZtSFr4thAndGUCvKdQHNMWa'
FROM (VALUES
  ('Trần Thị Lan',   'RECEPTIONIST', 'TTBH Mekong Cần Thơ',   'letan01'),
  ('Nguyễn Hoàng Thuận',    'MANAGER',      'TTBH Mekong Cần Thơ',   'quanly01'),
  ('Phạm Ngọc Anh',  'RECEPTIONIST', 'TTBH Mekong Vĩnh Long', 'letan02')
) AS v(full_name, role, center_name, username)
JOIN service_center c ON c.center_name = v.center_name
ON CONFLICT (username) DO NOTHING;
