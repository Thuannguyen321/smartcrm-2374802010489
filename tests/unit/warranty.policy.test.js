const { kiemTraConBaoHanh, addMonths } = require('../../src/policies/warranty.policy');

describe('kiemTraConBaoHanh — QT-05', () => {
  test('[luong dung] con bao hanh khi mua chua qua so thang bao hanh', () => {
    const r = kiemTraConBaoHanh({ ngayMua: '2026-01-15', soThangBaoHanh: 12 }, '2026-09-08');
    expect(r.conBaoHanh).toBe(true);
    expect(r.lyDo).toBe('CON_BAO_HANH');
    expect(r.ngayHetHan).toBe('2027-01-15');
  });

  test('[luong dung] het bao hanh khi da qua so thang bao hanh', () => {
    const r = kiemTraConBaoHanh({ ngayMua: '2024-01-15', soThangBaoHanh: 12 }, '2026-09-08');
    expect(r.conBaoHanh).toBe(false);
    expect(r.lyDo).toBe('HET_BAO_HANH');
  });

  test('[bien] dung ngay het han van con bao hanh, ngay hom sau thi het', () => {
    const tb = { ngayMua: '2025-09-08', soThangBaoHanh: 12 };
    expect(kiemTraConBaoHanh(tb, '2026-09-08').conBaoHanh).toBe(true);
    expect(kiemTraConBaoHanh(tb, '2026-09-09').conBaoHanh).toBe(false);
  });

  // TEST QUAN TRONG NHAT: luong ngoai le 4a da dac ta o BT1 (UC04)
  test('[ngoai le] chua xac minh duoc khi khong co ngay mua', () => {
    const r = kiemTraConBaoHanh({ ngayMua: null, soThangBaoHanh: 12 }, '2026-09-08');
    expect(r.conBaoHanh).toBeNull();
    expect(r.lyDo).toBe('CHUA_XAC_MINH_BAO_HANH');
  });

  test('[bien] mua ngay 31/01 + 1 thang -> het han ngay cuoi thang 2 (khong tran sang thang 3)', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
  });

  // BUG-07: pg tra cot DATE ve Date 00:00 gio dia phuong; o gio VN (+07) toISOString() lui 1 ngay.
  test('[bien] ngay mua kieu Date (tu CSDL), tiep nhan dung ngay het han -> van con bao hanh', () => {
    const ngayMua = new Date(2025, 10, 7); // 07/11/2025 00:00 gio dia phuong
    const r = kiemTraConBaoHanh({ ngayMua, soThangBaoHanh: 12 }, new Date(2026, 10, 7, 9, 0));
    expect(r.ngayHetHan).toBe('2026-11-07');
    expect(r.lyDo).toBe('CON_BAO_HANH');
  });

  test('[bien] tiep nhan luc 06:00 sang gio VN van tinh dung ngay dia phuong', () => {
    const r = kiemTraConBaoHanh({ ngayMua: '2025-11-07', soThangBaoHanh: 12 }, new Date(2026, 10, 8, 6, 0));
    expect(r.lyDo).toBe('HET_BAO_HANH'); // 08/11 da qua ngay het han 07/11
  });
});
