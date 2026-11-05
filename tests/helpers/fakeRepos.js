// Repository GIA trong bo nho: test lop nghiep vu ma khong can PostgreSQL that.
// Test tu dung du lieu no can (fixture) -> chay duoc tren may bat ky (phep thu "may sach").
function buildFakes() {
  const state = {
    customers: [
      { customer_id: '1', full_name: 'Nguyen Van An', phone: '0901234567', email: null, address: null, segment: 'MOI' },
      { customer_id: '2', full_name: 'Tran Thi Bich', phone: '0912345678', email: null, address: null, segment: 'MOI' },
    ],
    devices: [
      { device_id: '10', customer_id: '1', product_id: '1', serial_no: 'SN-IP15-2026-88', purchase_date: '2026-06-01', warranty_months: 12, product_name: 'iPhone 15', customer_name: 'Nguyen Van An', customer_phone: '0901234567' },
      { device_id: '11', customer_id: '1', product_id: '1', serial_no: 'SN-OLD-2023-01', purchase_date: '2023-01-10', warranty_months: 12, product_name: 'iPhone 15' },
      { device_id: '12', customer_id: '2', product_id: '1', serial_no: 'SN-NODATE-0001', purchase_date: null, warranty_months: 12, product_name: 'iPhone 15' },
    ],
    categories: [
      { category_id: 1, category_name: 'Man hinh', default_priority: 'CAO', is_active: true },
      { category_id: 4, category_name: 'Phan mem', default_priority: 'THAP', is_active: true },
    ],
    products: [{ product_id: '1', product_name: 'iPhone 15', brand: 'Apple' }],
    tickets: [],
    logs: [],
    seq: 100000,
    transactions: { committed: 0, rolledBack: 0 },
  };

  const customerRepo = {
    findById: async (_db, id) => state.customers.find((c) => Number(c.customer_id) === Number(id)) || null,
    findByPhone: async (_db, phone) => state.customers.find((c) => c.phone === phone) || null,
    list: async () => state.customers.map((c) => ({ ...c, total_count: state.customers.length })),
    create: async (_db, c) => {
      const row = { customer_id: String(state.customers.length + 1), full_name: c.fullName, phone: c.phone, email: c.email, address: c.address };
      state.customers.push(row);
      return row;
    },
    update: async (_db, id, c) => {
      const row = state.customers.find((x) => Number(x.customer_id) === Number(id));
      Object.assign(row, { full_name: c.fullName, phone: c.phone, email: c.email, address: c.address });
      return row;
    },
    remove: async (_db, id) => {
      state.customers = state.customers.filter((x) => Number(x.customer_id) !== Number(id));
      return true;
    },
    countDevices: async (_db, id) => state.devices.filter((d) => Number(d.customer_id) === Number(id)).length,
  };

  const deviceRepo = {
    findById: async (_db, id) => state.devices.find((d) => Number(d.device_id) === Number(id)) || null,
    findBySerial: async (_db, s) => state.devices.find((d) => d.serial_no === s) || null,
    listByCustomer: async (_db, id) => state.devices.filter((d) => Number(d.customer_id) === Number(id)),
    create: async (_db, d) => {
      const row = { device_id: String(100 + state.devices.length), customer_id: String(d.customerId), product_id: String(d.productId), serial_no: d.serialNo, purchase_date: d.purchaseDate, warranty_months: d.warrantyMonths };
      state.devices.push(row);
      return row;
    },
    update: async () => null,
    remove: async () => true,
    countTickets: async (_db, id) => state.tickets.filter((t) => Number(t.deviceId) === Number(id)).length,
  };

  const catalogRepo = {
    listCategories: async () => state.categories,
    findCategoryById: async (_db, id) => state.categories.find((c) => c.category_id === Number(id)) || null,
    listProducts: async () => state.products,
    findProductById: async (_db, id) => state.products.find((p) => Number(p.product_id) === Number(id)) || null,
  };

  const ticketRepo = {
    nextTicketCode: async (_db, year) => `BH-${String(++state.seq).padStart(6, '0')}/${year}`,
    insertTicket: async (_db, t) => {
      const id = state.tickets.length + 1;
      state.tickets.push({ ...t, ticket_id: id, status: t.status, center_id: t.centerId });
      return id;
    },
    insertStatusLog: async (_db, log) => {
      state.logs.push(log);
    },
    findById: async (_db, id) => {
      const t = state.tickets.find((x) => x.ticket_id === Number(id));
      return t ? { ...t, ticket_code: t.ticketCode, due_date: t.dueDate } : null;
    },
    findByIdForUpdate: async (_db, id) => state.tickets.find((x) => x.ticket_id === Number(id)) || null,
    updateReview: async (_db, id, { status, isWarranty }) => {
      Object.assign(state.tickets.find((x) => x.ticket_id === Number(id)), { status, isWarranty });
    },
    listStatusLogs: async (_db, id) => state.logs.filter((l) => l.ticketId === Number(id)),
    list: async () => [],
  };

  /** Mo phong transaction: neu fn nem loi thi khoi phuc trang thai truoc do (ROLLBACK). */
  async function withTransaction(fn) {
    const snapshot = JSON.stringify({ tickets: state.tickets, logs: state.logs });
    try {
      const r = await fn({});
      state.transactions.committed += 1;
      return r;
    } catch (err) {
      const s = JSON.parse(snapshot);
      state.tickets = s.tickets;
      state.logs = s.logs;
      state.transactions.rolledBack += 1;
      throw err;
    }
  }

  return { state, customerRepo, deviceRepo, catalogRepo, ticketRepo, withTransaction };
}

module.exports = { buildFakes };
