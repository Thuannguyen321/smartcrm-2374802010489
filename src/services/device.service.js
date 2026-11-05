// Lop nghiep vu Thiet bi (FR3 - QT-03: 1 Serial/IMEI chi thuoc 1 khach hang).
const { AppError, ErrorCodes } = require('../utils/AppError');
const { assertValid, isBlank, isIsoDate, toPositiveInt } = require('../utils/validate');
const { kiemTraConBaoHanh } = require('../policies/warranty.policy');

const SERIAL_RE = /^[A-Z0-9-]{6,50}$/;

function normalizeSerial(raw) {
  return String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
}

function createDeviceService({ db, deviceRepo, customerRepo, catalogRepo, clock = () => new Date() }) {
  async function validateInput(input, { requireCustomer }) {
    const errors = {};
    const serialNo = normalizeSerial(input.serialNo);
    if (!SERIAL_RE.test(serialNo)) errors.serialNo = 'Serial/IMEI gồm 6–50 ký tự chữ, số hoặc dấu gạch';
    const productId = toPositiveInt(input.productId);
    if (!productId) errors.productId = 'Chưa chọn dòng máy';
    const customerId = toPositiveInt(input.customerId);
    if (requireCustomer && !customerId) errors.customerId = 'Chưa chọn khách hàng';
    const purchaseDate = isBlank(input.purchaseDate) ? null : String(input.purchaseDate);
    if (purchaseDate && !isIsoDate(purchaseDate)) errors.purchaseDate = 'Ngày mua dạng YYYY-MM-DD';
    if (purchaseDate && purchaseDate > clock().toISOString().slice(0, 10)) errors.purchaseDate = 'Ngày mua không được ở tương lai';
    const warrantyMonths = input.warrantyMonths === undefined || input.warrantyMonths === '' ? 12 : Number(input.warrantyMonths);
    if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 60) errors.warrantyMonths = 'Số tháng bảo hành từ 0 đến 60';
    assertValid(errors);

    if (!(await catalogRepo.findProductById(db, productId))) {
      throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Dòng máy không tồn tại', { productId: 'Dòng máy không tồn tại' });
    }
    if (requireCustomer && !(await customerRepo.findById(db, customerId))) {
      throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Khách hàng không tồn tại');
    }
    return { serialNo, productId, customerId, purchaseDate, warrantyMonths };
  }

  /** Them ket qua QT-05 de giao dien hien "con/het/chua xac minh bao hanh" ngay khi tra cuu. */
  function withWarranty(device) {
    const w = kiemTraConBaoHanh({ ngayMua: device.purchase_date, soThangBaoHanh: device.warranty_months }, clock());
    return { ...device, warranty: w };
  }

  async function getEntity(id) {
    const deviceId = toPositiveInt(id);
    if (!deviceId) throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Mã thiết bị không hợp lệ');
    const device = await deviceRepo.findById(db, deviceId);
    if (!device) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Không tìm thấy thiết bị');
    return device;
  }

  return {
    normalizeSerial,

    async findBySerial(rawSerial) {
      const serialNo = normalizeSerial(rawSerial);
      if (!SERIAL_RE.test(serialNo)) {
        throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Serial/IMEI không hợp lệ', { serialNo: 'Serial/IMEI gồm 6–50 ký tự' });
      }
      const device = await deviceRepo.findBySerial(db, serialNo);
      if (!device) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Chưa ghi nhận thiết bị với Serial/IMEI này');
      return withWarranty(device);
    },

    async getById(id) {
      return withWarranty(await getEntity(id));
    },

    async listByCustomer(customerId) {
      const id = toPositiveInt(customerId);
      if (!id) throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Mã khách hàng không hợp lệ');
      return (await deviceRepo.listByCustomer(db, id)).map(withWarranty);
    },

    /** FR3: ghi nhan thiet bi; tu choi neu Serial/IMEI da thuoc khach khac (QT-03). */
    async create(input) {
      const data = await validateInput(input, { requireCustomer: true });
      const existing = await deviceRepo.findBySerial(db, data.serialNo);
      if (existing) {
        const sameOwner = Number(existing.customer_id) === data.customerId;
        throw new AppError(
          ErrorCodes.XUNG_DOT,
          sameOwner ? 'Thiết bị đã được ghi nhận cho khách hàng này' : 'Serial/IMEI đã thuộc về khách hàng khác (QT-03)',
          { serialNo: 'Serial/IMEI đã tồn tại' }
        );
      }
      return withWarranty(await deviceRepo.create(db, data));
    },

    async update(id, input) {
      const current = await getEntity(id);
      const data = await validateInput(input, { requireCustomer: false });
      const existing = await deviceRepo.findBySerial(db, data.serialNo);
      if (existing && Number(existing.device_id) !== Number(current.device_id)) {
        throw new AppError(ErrorCodes.XUNG_DOT, 'Serial/IMEI đã tồn tại (QT-03)', { serialNo: 'Serial/IMEI đã tồn tại' });
      }
      return withWarranty(await deviceRepo.update(db, current.device_id, data));
    },

    async remove(id) {
      const current = await getEntity(id);
      const tickets = await deviceRepo.countTickets(db, current.device_id);
      if (tickets > 0) throw new AppError(ErrorCodes.XUNG_DOT, `Không thể xóa: thiết bị đã có ${tickets} phiếu bảo hành`);
      await deviceRepo.remove(db, current.device_id);
    },
  };
}

module.exports = { createDeviceService, normalizeSerial };
