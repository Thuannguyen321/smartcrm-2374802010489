// Lop nghiep vu Phieu bao hanh - trung tam cua luong L2.
// FR4 (tao phieu + log trong 1 transaction), FR5 (QT-05), FR6 (QT-A1, QT-04),
// FR7 (xet duyet QT-A3), FR8 (danh sach + loc).
const { AppError, ErrorCodes } = require('../utils/AppError');
const { assertValid, isBlank, isIsoDate, toPositiveInt, MAX_INT4 } = require('../utils/validate');
const { normalizePhone } = require('../policies/phone.policy');
const { kiemTraConBaoHanh, WarrantyResult } = require('../policies/warranty.policy');
const { computeDueDate, slaState, PRIORITIES } = require('../policies/sla.policy');
const { normalizeSerial } = require('./device.service');

const STATUSES = ['MOI', 'CHO_XAC_MINH'];
const SLA_STATES = ['TRONG_HAN', 'SAP_TRE', 'TRE_HAN'];
const DECISIONS = ['CHAP_NHAN', 'TU_CHOI'];

function createTicketService({
  db, withTransaction, ticketRepo, customerRepo, deviceRepo, catalogRepo, slaConfig, clock = () => new Date(),
}) {
  function validateCreate(input) {
    const errors = {};
    const phone = normalizePhone(input.phone);
    if (!phone) errors.phone = 'SĐT phải gồm 10 chữ số và bắt đầu bằng 0 (QT-02)';
    const serialNo = normalizeSerial(input.serialNo);
    if (!serialNo) errors.serialNo = 'Chưa nhập Serial/IMEI';
    const categoryId = toPositiveInt(input.categoryId, MAX_INT4); // issue_category.category_id la SERIAL (INT)
    if (!categoryId) errors.categoryId = 'Chưa chọn nhóm sự cố';
    const issueDesc = String(input.issueDesc || '').trim();
    if (issueDesc.length < 5) errors.issueDesc = 'Mô tả lỗi tối thiểu 5 ký tự';
    if (issueDesc.length > 2000) errors.issueDesc = 'Mô tả lỗi tối đa 2000 ký tự';
    const priority = isBlank(input.priority) ? null : String(input.priority);
    if (priority && !PRIORITIES.includes(priority)) errors.priority = 'Mức ưu tiên chỉ nhận CAO, TRUNG_BINH, THAP';
    assertValid(errors);
    return { phone, serialNo, categoryId, issueDesc, priority };
  }

  /** Quy tac pham vi du lieu (NFR4): chi xem/xu ly phieu cua trung tam minh. */
  function assertSameCenter(ticket, user) {
    if (Number(ticket.center_id) !== Number(user.centerId)) {
      throw new AppError(ErrorCodes.KHONG_DU_QUYEN, 'Phiếu thuộc trung tâm khác');
    }
  }

  return {
    /**
     * UC04 - Tao phieu bao hanh.
     * Buoc 1-3 doc va kiem tra; buoc 4 ghi phieu + dong log dau tien trong CUNG transaction.
     */
    async createTicket(input, user) {
      const data = validateCreate(input);

      const customer = await customerRepo.findByPhone(db, data.phone);
      if (!customer) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Chưa có hồ sơ khách hàng với SĐT này (UC02)');

      const device = await deviceRepo.findBySerial(db, data.serialNo);
      if (!device) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Chưa ghi nhận thiết bị với Serial/IMEI này (UC03)');
      if (Number(device.customer_id) !== Number(customer.customer_id)) {
        throw new AppError(ErrorCodes.XUNG_DOT, 'Serial/IMEI đã thuộc về khách hàng khác (QT-03)');
      }

      const category = await catalogRepo.findCategoryById(db, data.categoryId);
      if (!category || !category.is_active) {
        throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Nhóm sự cố không tồn tại', { categoryId: 'Nhóm sự cố không tồn tại' });
      }

      const now = clock();
      const priority = data.priority || category.default_priority; // QT-A1
      const dueDate = computeDueDate(now, priority, slaConfig); // QT-04
      const warranty = kiemTraConBaoHanh(
        { ngayMua: device.purchase_date, soThangBaoHanh: device.warranty_months },
        now
      ); // QT-05
      const status = warranty.lyDo === WarrantyResult.CHUA_XAC_MINH_BAO_HANH ? 'CHO_XAC_MINH' : 'MOI';
      const isWarranty = warranty.conBaoHanh !== false;

      const created = await withTransaction(async (trx) => {
        const ticketCode = await ticketRepo.nextTicketCode(trx, now.getFullYear());
        const ticketId = await ticketRepo.insertTicket(trx, {
          ticketCode,
          customerId: customer.customer_id,
          deviceId: device.device_id,
          centerId: user.centerId,
          createdBy: user.employeeId,
          categoryId: category.category_id,
          issueDesc: data.issueDesc,
          priority,
          status,
          receivedAt: now,
          dueDate,
          isWarranty,
        });
        await ticketRepo.insertStatusLog(trx, {
          ticketId,
          fromStatus: null,
          toStatus: status,
          changedBy: user.employeeId,
          note: `Tạo phiếu - ${warranty.lyDo}`,
        });
        return { ticketId, ticketCode };
      });

      return {
        ticketId: created.ticketId,
        ticketCode: created.ticketCode,
        status,
        priority,
        warrantyResult: warranty.lyDo,
        warrantyEndDate: warranty.ngayHetHan,
        isWarranty,
        receivedAt: now.toISOString(),
        dueDate: dueDate.toISOString(),
        createdBy: user.employeeId,
      };
    },

    /** Xem truoc han SLA tren man hinh tiep nhan (khung 4 cua M2) - dung chung QT-04 voi createTicket. */
    previewSla(priority) {
      if (!PRIORITIES.includes(priority)) {
        throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Mức ưu tiên không hợp lệ', { priority: 'CAO, TRUNG_BINH hoặc THAP' });
      }
      const now = clock();
      return { priority, receivedAt: now.toISOString(), dueDate: computeDueDate(now, priority, slaConfig).toISOString() };
    },

    /** FR8 - danh sach phieu cua trung tam nguoi dung, loc + phan trang 20 dong. */
    async listTickets(query, user) {
      const errors = {};
      const page = toPositiveInt(query.page || 1);
      if (!page) errors.page = 'Trang phải là số nguyên dương';
      const pageSize = Math.min(toPositiveInt(query.pageSize || 20) || 20, 100);
      const pick = (name, allowed) => {
        if (isBlank(query[name])) return null;
        if (!allowed.includes(query[name])) errors[name] = `Chỉ nhận: ${allowed.join(', ')}`;
        return query[name];
      };
      const status = pick('status', STATUSES);
      const priority = pick('priority', PRIORITIES);
      const sla = pick('slaState', SLA_STATES);
      const from = isBlank(query.from) ? null : query.from;
      const to = isBlank(query.to) ? null : query.to;
      if (from && !isIsoDate(from)) errors.from = 'Ngày dạng YYYY-MM-DD';
      if (to && !isIsoDate(to)) errors.to = 'Ngày dạng YYYY-MM-DD';
      if (from && to && from > to) errors.to = 'Đến ngày phải sau Từ ngày';
      assertValid(errors);

      const now = clock();
      const rows = await ticketRepo.list(db, {
        centerId: user.centerId,
        status,
        priority,
        slaState: sla,
        from,
        to,
        q: isBlank(query.q) ? null : String(query.q).trim(),
        now,
        nearDueLimit: new Date(now.getTime() + (slaConfig.nearDueHours || 4) * 3600 * 1000),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      return {
        items: rows.map((r) => ({ ...r, sla_state: slaState(r.due_date, now, slaConfig) })),
        page,
        pageSize,
        total: rows[0]?.total_count || 0,
      };
    },

    /** UC08 - chi tiet phieu + lich su trang thai. */
    async getTicket(id, user) {
      const ticketId = toPositiveInt(id);
      if (!ticketId) throw new AppError(ErrorCodes.DU_LIEU_KHONG_HOP_LE, 'Mã phiếu không hợp lệ');
      const ticket = await ticketRepo.findById(db, ticketId);
      if (!ticket) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Không tìm thấy phiếu bảo hành');
      assertSameCenter(ticket, user);
      const logs = await ticketRepo.listStatusLogs(db, ticketId);
      return { ...ticket, sla_state: slaState(ticket.due_date, clock(), slaConfig), logs };
    },

    /**
     * UC07 / QT-A3 - Quan ly xet duyet phieu CHO_XAC_MINH.
     * CHAP_NHAN -> MOI + is_warranty=true; TU_CHOI -> MOI + is_warranty=false (TD-11).
     * Ghi chu bat buoc. Khoa dong phieu (FOR UPDATE) de khong bi xet duyet 2 lan.
     */
    async reviewTicket(id, input, user) {
      if (user.role !== 'MANAGER') throw new AppError(ErrorCodes.KHONG_DU_QUYEN, 'Chỉ Quản lý trung tâm được xét duyệt');
      const ticketId = toPositiveInt(id);
      const errors = {};
      if (!ticketId) errors.id = 'Mã phiếu không hợp lệ';
      if (!DECISIONS.includes(input.decision)) errors.decision = 'Quyết định chỉ nhận CHAP_NHAN hoặc TU_CHOI';
      const note = String(input.note || '').trim();
      if (note.length < 5) errors.note = 'Ghi chú xét duyệt bắt buộc, tối thiểu 5 ký tự';
      if (note.length > 200) errors.note = 'Ghi chú tối đa 200 ký tự';
      assertValid(errors);

      await withTransaction(async (trx) => {
        const ticket = await ticketRepo.findByIdForUpdate(trx, ticketId);
        if (!ticket) throw new AppError(ErrorCodes.KHONG_TIM_THAY, 'Không tìm thấy phiếu bảo hành');
        assertSameCenter(ticket, user);
        if (ticket.status !== 'CHO_XAC_MINH') {
          throw new AppError(ErrorCodes.SAI_TRANG_THAI, 'Chỉ xét duyệt được phiếu đang Chờ xác minh bảo hành');
        }
        const isWarranty = input.decision === 'CHAP_NHAN';
        await ticketRepo.updateReview(trx, ticketId, { status: 'MOI', isWarranty });
        await ticketRepo.insertStatusLog(trx, {
          ticketId,
          fromStatus: 'CHO_XAC_MINH',
          toStatus: 'MOI',
          changedBy: user.employeeId,
          note: `${input.decision}: ${note}`,
        });
      });
      return this.getTicket(ticketId, user);
    },
  };
}

module.exports = { createTicketService, STATUSES, SLA_STATES, DECISIONS };
