// Quy doi loi -> HTTP. Day la noi DUY NHAT biet ma trang thai HTTP cua loi nghiep vu.
// Loi khong luong truoc: log o server, tra thong bao chung (khong lo loi tho cua thu vien - C7).
const { AppError, ErrorCodes } = require('../utils/AppError');

const STATUS_BY_CODE = {
  [ErrorCodes.DU_LIEU_KHONG_HOP_LE]: 400,
  [ErrorCodes.CHUA_DANG_NHAP]: 401,
  [ErrorCodes.KHONG_DU_QUYEN]: 403,
  [ErrorCodes.KHONG_TIM_THAY]: 404,
  [ErrorCodes.XUNG_DOT]: 409,
  [ErrorCodes.SAI_TRANG_THAI]: 409,
};

function notFound(req, _res, next) {
  next(new AppError(ErrorCodes.KHONG_TIM_THAY, `Không có đường dẫn ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(STATUS_BY_CODE[err.code] || 400).json({ error: err.code, message: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: ErrorCodes.DU_LIEU_KHONG_HOP_LE, message: 'Body không phải JSON hợp lệ' });
  }
  if (err.code === '23505') {
    // Vi pham UNIQUE do 2 request dong thoi vuot qua buoc kiem tra o service.
    return res.status(409).json({ error: ErrorCodes.XUNG_DOT, message: 'Dữ liệu đã tồn tại' });
  }
  if (err.code === 'ECONNREFUSED' || err.code === '57P01' || err.code === '3D000') {
    console.error(`[error] ${req.method} ${req.originalUrl} - CSDL khong san sang: ${err.message}`);
    return res.status(503).json({ error: 'CSDL_KHONG_SAN_SANG', message: 'Hệ thống tạm thời không kết nối được CSDL, vui lòng thử lại' });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ error: 'LOI_HE_THONG', message: 'Lỗi hệ thống, vui lòng thử lại sau' });
}

module.exports = { errorHandler, notFound, STATUS_BY_CODE };
