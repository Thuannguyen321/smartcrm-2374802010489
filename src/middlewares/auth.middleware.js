// NFR4: 100% endpoint nghiep vu yeu cau JWT hop le (thieu/sai -> 401, sai vai tro -> 403).
const { AppError, ErrorCodes } = require('../utils/AppError');

function authenticate(authService) {
  return (req, _res, next) => {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new AppError(ErrorCodes.CHUA_DANG_NHAP, 'Cần đăng nhập để sử dụng chức năng này'));
    }
    try {
      req.user = authService.verify(token);
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(ErrorCodes.KHONG_DU_QUYEN, 'Vai trò của bạn không được phép thực hiện thao tác này'));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
