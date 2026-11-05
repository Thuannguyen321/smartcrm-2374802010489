const { AppError, ErrorCodes } = require('./AppError');

/** Gom loi theo tung truong de tra ve 1 lan (frontend hien duoi tung o nhap). */
function assertValid(errors) {
  const fields = Object.keys(errors);
  if (fields.length > 0) {
    throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Dữ liệu không hợp lệ', errors);
  }
}

function toPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Chuoi ngay dang YYYY-MM-DD va la ngay co that. */
function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

module.exports = { assertValid, toPositiveInt, isBlank, isIsoDate };
