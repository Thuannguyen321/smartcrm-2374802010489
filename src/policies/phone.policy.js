/**
 * QT-02 - Chuan hoa so dien thoai.
 * Bo khoang trang, dau cham, gach ngang, ngoac; doi tien to +84 / 84 thanh 0.
 * Hop le khi ket qua dung 10 chu so va bat dau bang '0'.
 * @returns {string|null} SDT da chuan hoa, hoac null neu khong hop le.
 */
function normalizePhone(raw) {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = `0${s.slice(3)}`;
  else if (s.startsWith('84') && s.length === 11) s = `0${s.slice(2)}`;
  return /^0\d{9}$/.test(s) ? s : null;
}

/** NFR4 - Che SDT cho nhan vien tiep nhan: 0901234567 -> 090****567. */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

module.exports = { normalizePhone, maskPhone };
