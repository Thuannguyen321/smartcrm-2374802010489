// Chuyen hang CSDL (snake_case) -> DTO tra cho client (camelCase).
// Day la "hop dong du lieu" giua backend va frontend: doi ten truong o day thi
// phai doi o client/src/api/*.api.js tuong ung.
const { maskPhone } = require('../policies/phone.policy');

/** NFR4: Nhan vien tiep nhan chi thay SDT da che; Quan ly thay day du. */
const phoneFor = (phone, user) => (user && user.role === 'MANAGER' ? phone : maskPhone(phone));
const iso = (d) => (d ? new Date(d).toISOString() : null);
const dateOnly = (d) => {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  // pg tra DATE ve Date luc 00:00 gio dia phuong -> lay theo gio dia phuong, khong doi sang UTC.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function customerDto(c, user) {
  return {
    customerId: Number(c.customer_id),
    fullName: c.full_name,
    phone: phoneFor(c.phone, user),
    email: c.email,
    address: c.address,
    segment: c.segment,
    createdAt: iso(c.created_at),
  };
}

function deviceDto(d, user) {
  return {
    deviceId: Number(d.device_id),
    customerId: Number(d.customer_id),
    customerName: d.customer_name,
    customerPhone: d.customer_phone ? phoneFor(d.customer_phone, user) : undefined,
    productId: Number(d.product_id),
    productName: d.product_name,
    brand: d.brand,
    serialNo: d.serial_no,
    purchaseDate: dateOnly(d.purchase_date),
    warrantyMonths: d.warranty_months,
    warranty: d.warranty
      ? { result: d.warranty.lyDo, isUnderWarranty: d.warranty.conBaoHanh, endDate: d.warranty.ngayHetHan }
      : undefined,
  };
}

function ticketSummaryDto(t, user) {
  return {
    ticketId: Number(t.ticket_id),
    ticketCode: t.ticket_code,
    status: t.status,
    priority: t.priority,
    isWarranty: t.is_warranty,
    categoryName: t.category_name,
    customerName: t.customer_name,
    customerPhone: phoneFor(t.customer_phone, user),
    productName: t.product_name,
    serialNo: t.serial_no,
    issueDesc: t.issue_desc,
    receivedAt: iso(t.received_at),
    dueDate: iso(t.due_date),
    slaState: t.sla_state,
  };
}

function ticketDetailDto(t, user) {
  return {
    ...ticketSummaryDto(t, user),
    centerName: t.center_name,
    createdByName: t.created_by_name,
    purchaseDate: dateOnly(t.purchase_date),
    warrantyMonths: t.warranty_months,
    logs: (t.logs || []).map((l) => ({
      fromStatus: l.from_status,
      toStatus: l.to_status,
      changedAt: iso(l.changed_at),
      changedByName: l.changed_by_name,
      note: l.note,
    })),
  };
}

function pageDto(result, mapItem) {
  return {
    data: result.items.map(mapItem),
    meta: { page: result.page, pageSize: result.pageSize, total: result.total },
  };
}

module.exports = { customerDto, deviceDto, ticketSummaryDto, ticketDetailDto, pageDto, phoneFor };
