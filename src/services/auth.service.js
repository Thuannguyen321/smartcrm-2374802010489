const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, ErrorCodes } = require('../utils/AppError');

function createAuthService({ db, employeeRepo, jwtSecret, jwtExpiresIn }) {
  return {
    async login({ username, password }) {
      if (!username || !password) {
        throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Nhập tên đăng nhập và mật khẩu');
      }
      const emp = await employeeRepo.findByUsername(db, String(username).trim());
      // Cung mot thong bao cho "sai ten" va "sai mat khau" de khong lo tai khoan nao ton tai.
      if (!emp || !emp.password_hash || !(await bcrypt.compare(String(password), emp.password_hash))) {
        throw new AppError(ErrorCodes.CHUA_DANG_NHAP, 'Sai tên đăng nhập hoặc mật khẩu');
      }
      const user = {
        employeeId: Number(emp.employee_id),
        fullName: emp.full_name,
        role: emp.role,
        centerId: Number(emp.center_id),
        centerName: emp.center_name,
      };
      const token = jwt.sign(user, jwtSecret, { expiresIn: jwtExpiresIn });
      return { token, user };
    },

    verify(token) {
      try {
        const p = jwt.verify(token, jwtSecret);
        return { employeeId: p.employeeId, fullName: p.fullName, role: p.role, centerId: p.centerId, centerName: p.centerName };
      } catch {
        throw new AppError(ErrorCodes.CHUA_DANG_NHAP, 'Phiên đăng nhập hết hạn hoặc không hợp lệ');
      }
    },
  };
}

module.exports = { createAuthService };
