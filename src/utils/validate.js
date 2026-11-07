const { AppError, ErrorCodes } = require('./AppError');

/** Gom loi theo tung truong de tra ve 1 lan (frontend hien duoi tung o nhap). */
function assertValid(errors) {
  const fields = Object.keys(errors);
  if (fields.length > 0) {
    throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Dữ liệu không hợp lệ', errors);
  }
}

/** Cot SERIAL (INT) cua PostgreSQL toi da 2^31 - 1. */
const MAX_INT4 = 2147483647;

/**
 * So nguyen duong, KHONG vuot `max` (mac dinh so nguyen an toan cua JS, nho hon gioi han BIGINT).
 * Truoc day 99999999999999999999 van qua kiem tra -> PostgreSQL bao "out of range" -> 500 (BUG-09).
 */
function toPositiveInt(value, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : null;
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

module.exports = { assertValid, toPositiveInt, isBlank, isIsoDate, MAX_INT4 };
