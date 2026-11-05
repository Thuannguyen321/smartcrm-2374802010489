const { addBusinessHours, computeDueDate, slaState } = require('../../src/policies/sla.policy');

// Cau hinh co dinh trong test de khong phu thuoc file sla.config.json that.
const cfg = {
  utcOffsetMinutes: 420, // gio Viet Nam
  workingDays: [1, 2, 3, 4, 5, 6], // T2-T7
  workStart: '08:00',
  workEnd: '17:30',
  hoursByPriority: { CAO: 24, TRUNG_BINH: 72, THAP: 120 },
  nearDueHours: 4,
};
// Tao Date tu gio Viet Nam cho de doc: vn('2026-11-02 09:00') = 02:00Z
const vn = (s) => new Date(`${s.replace(' ', 'T')}:00+07:00`);

describe('SlaPolicy — QT-04 tinh han theo gio lam viec', () => {
  test('[luong dung] cong 2 gio trong cung ca lam viec', () => {
    expect(addBusinessHours(vn('2026-11-02 09:00'), 2, cfg)).toEqual(vn('2026-11-02 11:00'));
  });

  test('[bien] vuot qua 17:30 thi phan con lai chuyen sang 08:00 ngay lam viec ke tiep', () => {
    // 16:30 + 3h = 1h hom nay + 2h ngay mai -> 10:00 hom sau
    expect(addBusinessHours(vn('2026-11-02 16:30'), 3, cfg)).toEqual(vn('2026-11-03 10:00'));
  });

  test('[bien] tiep nhan vao Chu nhat thi bat dau dem tu 08:00 thu Hai', () => {
    // 01/11/2026 la Chu nhat
    expect(addBusinessHours(vn('2026-11-01 10:00'), 1, cfg)).toEqual(vn('2026-11-02 09:00'));
  });

  test('[luong dung] uu tien CAO = 24 gio lam viec (9,5 gio/ngay)', () => {
    // T2 08:00 + 24h = T2 9.5h + T3 9.5h + T4 5h -> T4 13:00
    expect(computeDueDate(vn('2026-11-02 08:00'), 'CAO', cfg)).toEqual(vn('2026-11-04 13:00'));
  });

  test('[du lieu sai] muc uu tien khong ton tai thi nem loi', () => {
    expect(() => computeDueDate(vn('2026-11-02 08:00'), 'KHAN_CAP', cfg)).toThrow('Mức ưu tiên không hợp lệ');
  });

  test('[NFR6] doi gio lam viec chi bang cau hinh, khong sua code', () => {
    const fullDay = { ...cfg, workStart: '00:00', workEnd: '23:59', workingDays: [0, 1, 2, 3, 4, 5, 6] };
    expect(addBusinessHours(vn('2026-11-02 10:00'), 1, fullDay)).toEqual(vn('2026-11-02 11:00'));
  });

  test('slaState phan loai TRE_HAN / SAP_TRE / TRONG_HAN', () => {
    const now = vn('2026-11-02 10:00');
    expect(slaState(vn('2026-11-02 09:59'), now, cfg)).toBe('TRE_HAN');
    expect(slaState(vn('2026-11-02 14:00'), now, cfg)).toBe('SAP_TRE');
    expect(slaState(vn('2026-11-02 14:01'), now, cfg)).toBe('TRONG_HAN');
  });
});
