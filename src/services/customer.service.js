// Lop nghiep vu Khach hang (FR1, FR2 - QT-01, QT-02).
// Khong biet gi ve HTTP (req/res/status) - chi nhan du lieu thuan va nem AppError.
const { AppError, ErrorCodes } = require('../utils/AppError');
const { assertValid, isBlank, toPositiveInt } = require('../utils/validate');
const { normalizePhone } = require('../policies/phone.policy');

function createCustomerService({ db, customerRepo }) {
  function validateInput(input) {
    const errors = {};
    const fullName = String(input.fullName || '').trim();
    if (fullName.length < 2 || fullName.length > 120) errors.fullName = 'Họ tên từ 2 đến 120 ký tự';
    const phone = normalizePhone(input.phone);
    if (!phone) errors.phone = 'SĐT phải gồm 10 chữ số và bắt đầu bằng 0 (QT-02)';
    const email = isBlank(input.email) ? null : String(input.email).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không đúng định dạng';
    assertValid(errors);
    return { fullName, phone, email, address: isBlank(input.address) ? null : String(input.address).trim() };
  }

  async function ensurePhoneFree(phone, exceptId) {
    const existing = await customerRepo.findByPhone(db, phone);
    if (existing && Number(existing.customer_id) !== Number(exceptId)) {
      throw new AppError(ErrorCodes.XUNG_DOT, 'Số điện thoại đã thuộc về khách hàng khác (QT-01)', {
        phone: 'SĐT đã tồn tại',
      });
    }
  }

  return {
    /** FR1: tra cuu theo SDT, chuan hoa truoc khi tim. */
    async findByPhone(rawPhone) {
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'SĐT không hợp lệ', { phone: 'SĐT phải gồm 10 chữ số, bắt đầu bằng 0' });
      }
      const customer = await customerRepo.findByPhone(db, phone);
      if (!customer) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Chưa có hồ sơ khách hàng với SĐT này');
      return customer;
    },

    async getById(id) {
      const customerId = toPositiveInt(id);
      if (!customerId) throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Mã khách hàng không hợp lệ');
      const customer = await customerRepo.findById(db, customerId);
      if (!customer) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Không tìm thấy khách hàng');
      return customer;
    },

    async list({ q, page = 1, pageSize = 20 }) {
      const p = toPositiveInt(page) || 1;
      const size = Math.min(toPositiveInt(pageSize) || 20, 100);
      const rows = await customerRepo.list(db, { q: isBlank(q) ? null : String(q).trim(), limit: size, offset: (p - 1) * size });
      return { items: rows, page: p, pageSize: size, total: rows[0]?.total_count || 0 };
    },

    /** FR2: tao ho so moi; tu choi neu SDT sai dinh dang hoac da ton tai (QT-01). */
    async create(input) {
      const data = validateInput(input);
      await ensurePhoneFree(data.phone);
      return customerRepo.create(db, data);
    },

    async update(id, input) {
      const current = await this.getById(id);
      const data = validateInput(input);
      await ensurePhoneFree(data.phone, current.customer_id);
      return customerRepo.update(db, current.customer_id, data);
    },

    /** Chi xoa duoc khach chua co thiet bi (FK ON DELETE RESTRICT, giu lich su phieu). */
    async remove(id) {
      const current = await this.getById(id);
      const devices = await customerRepo.countDevices(db, current.customer_id);
      if (devices > 0) {
        throw new AppError(ErrorCodes.XUNG_DOT, `Không thể xóa: khách hàng đang có ${devices} thiết bị`);
      }
      await customerRepo.remove(db, current.customer_id);
    },
  };
}

module.exports = { createCustomerService };
