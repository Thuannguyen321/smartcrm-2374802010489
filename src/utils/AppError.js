/**
 * Loi nghiep vu co ma loi on dinh (frontend dua vao `code`, khong dua vao cau chu).
 * Lop service chi nem AppError, KHONG biet toi ma trang thai HTTP;
 * errorHandler o lop API moi quy doi code -> HTTP status.
 */
class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

const ErrorCodes = Object.freeze({
  DU_LIEU_KHONG_HOP_LE: 'DU_LIEU_KHONG_HOP_LE',
  CHUA_DANG_NHAP: 'CHUA_DANG_NHAP',
  KHONG_DU_QUYEN: 'KHONG_DU_QUYEN',
  KHONG_TIM_THAY: 'KHONG_TIM_THAY',
  XUNG_DOT: 'XUNG_DOT',
  SAI_TRANG_THAI: 'SAI_TRANG_THAI',
});

module.exports = { AppError, ErrorCodes };
