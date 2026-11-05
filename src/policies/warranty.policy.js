/**
 * QT-05 - Kiem tra dieu kien bao hanh cua thiet bi tai thoi diem tiep nhan.
 *  - Khong co ngay mua             -> conBaoHanh = null,  lyDo = CHUA_XAC_MINH_BAO_HANH
 *  - Ngay tiep nhan <= ngay het han -> conBaoHanh = true,  lyDo = CON_BAO_HANH
 *  - Nguoc lai                       -> conBaoHanh = false, lyDo = HET_BAO_HANH
 * Ngay het han = ngay mua + so thang bao hanh (tinh theo lich, khong theo 30 ngay).
 * Ham thuan (pure): khong doc CSDL, khong doc dong ho -> de viet unit test.
 */
const WarrantyResult = Object.freeze({
  CON_BAO_HANH: 'CON_BAO_HANH',
  HET_BAO_HANH: 'HET_BAO_HANH',
  CHUA_XAC_MINH_BAO_HANH: 'CHUA_XAC_MINH_BAO_HANH',
});

function toDateOnly(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  // Giu ngay trong thang; neu thang dich ngan hon (vd 31/01 + 1 thang) thi lay ngay cuoi thang.
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function kiemTraConBaoHanh(thietBi, ngayTiepNhan) {
  const { ngayMua, soThangBaoHanh } = thietBi;
  if (!ngayMua) {
    return { conBaoHanh: null, lyDo: WarrantyResult.CHUA_XAC_MINH_BAO_HANH, ngayHetHan: null };
  }
  const ngayHetHan = addMonths(toDateOnly(ngayMua), Number(soThangBaoHanh) || 0);
  const conBaoHanh = toDateOnly(ngayTiepNhan) <= ngayHetHan;
  return {
    conBaoHanh,
    lyDo: conBaoHanh ? WarrantyResult.CON_BAO_HANH : WarrantyResult.HET_BAO_HANH,
    ngayHetHan,
  };
}

module.exports = { kiemTraConBaoHanh, addMonths, WarrantyResult };
