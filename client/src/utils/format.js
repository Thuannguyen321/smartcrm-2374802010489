export const STATUS_LABEL = { MOI: 'Mới', CHO_XAC_MINH: 'Chờ xác minh BH' };
export const PRIORITY_LABEL = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };
export const SLA_LABEL = { TRONG_HAN: 'Trong hạn', SAP_TRE: 'Sắp trễ', TRE_HAN: 'Trễ hạn' };
export const WARRANTY_LABEL = {
  CON_BAO_HANH: 'Còn bảo hành',
  HET_BAO_HANH: 'Hết bảo hành (sửa tính phí)',
  CHUA_XAC_MINH_BAO_HANH: 'Chưa xác minh (thiếu ngày mua)',
};

const dtf = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
});
export const fmtDateTime = (iso) => (iso ? dtf.format(new Date(iso)) : '—');
export const fmtDate = (ymd) => (ymd ? ymd.split('-').reverse().join('/') : '—');
