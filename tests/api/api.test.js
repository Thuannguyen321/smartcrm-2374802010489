// Kiem thu lop API (route -> controller -> service) bang supertest + repository gia.
// Muc dich: dam bao ma HTTP va hinh dang JSON loi dung hop dong (C7, NFR4).
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAuthService } = require('../../src/services/auth.service');
const { createTicketService } = require('../../src/services/ticket.service');
const { createCustomerService } = require('../../src/services/customer.service');
const { createDeviceService } = require('../../src/services/device.service');
const { createCatalogService } = require('../../src/services/catalog.service');
const { createTicketController } = require('../../src/controllers/ticket.controller');
const { createCustomerController } = require('../../src/controllers/customer.controller');
const { createDeviceController } = require('../../src/controllers/device.controller');
const { createAuthController } = require('../../src/controllers/auth.controller');
const slaConfig = require('../../src/config/sla.config.json');
const { buildFakes } = require('../helpers/fakeRepos');

const SECRET = 'test-secret';

function buildApp() {
  const f = buildFakes();
  const authService = createAuthService({ db: {}, employeeRepo: { findByUsername: async () => null }, jwtSecret: SECRET, jwtExpiresIn: '1h' });
  const customerService = createCustomerService({ db: {}, customerRepo: f.customerRepo });
  const deviceService = createDeviceService({ db: {}, ...f });
  const ticketService = createTicketService({ db: {}, ...f, slaConfig });
  const controllers = {
    auth: createAuthController({ authService, catalogService: createCatalogService({ db: {}, catalogRepo: f.catalogRepo }) }),
    customer: createCustomerController({ customerService, deviceService }),
    device: createDeviceController({ deviceService }),
    ticket: createTicketController({ ticketService }),
  };
  return createApp({ controllers, authService });
}

const jwt = require('jsonwebtoken');
const tokenFor = (role) => jwt.sign({ employeeId: 1, role, centerId: 1, fullName: 'Test' }, SECRET);

describe('API /api/v1', () => {
  const app = buildApp();

  test('[NFR4] thieu token -> 401 CHUA_DANG_NHAP', async () => {
    const res = await request(app).get('/api/v1/tickets');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('CHUA_DANG_NHAP');
  });

  test('[NFR4] quan ly khong duoc tao phieu -> 403 KHONG_DU_QUYEN', async () => {
    const res = await request(app).post('/api/v1/tickets').set('Authorization', `Bearer ${tokenFor('MANAGER')}`).send({});
    expect(res.status).toBe(403);
  });

  test('[C7] body JSON hong -> 400, khong lo loi tho cua thu vien', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${tokenFor('RECEPTIONIST')}`)
      .set('Content-Type', 'application/json')
      .send('{"phone": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'Body không phải JSON hợp lệ' });
  });

  test('[luong dung] tao phieu -> 201 va ma phieu', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${tokenFor('RECEPTIONIST')}`)
      .send({ phone: '0901234567', serialNo: 'SN-IP15-2026-88', categoryId: 1, issueDesc: 'Man hinh soc xanh' });
    expect(res.status).toBe(201);
    expect(res.body.data.ticketCode).toMatch(/^BH-\d{6}\/\d{4}$/);
    expect(typeof res.body.data.ticketId).toBe('number');
  });

  test('[NFR4] nhan vien tiep nhan thay SDT da che, quan ly thay day du', async () => {
    const url = '/api/v1/devices/lookup?serial=SN-IP15-2026-88';
    const asReceptionist = await request(app).get(url).set('Authorization', `Bearer ${tokenFor('RECEPTIONIST')}`);
    const asManager = await request(app).get(url).set('Authorization', `Bearer ${tokenFor('MANAGER')}`);
    expect(asReceptionist.body.data.customerPhone).toBe('090****567');
    expect(asManager.body.data.customerPhone).toBe('0901234567');
  });

  test('duong dan khong ton tai -> 404 dang JSON', async () => {
    const res = await request(app).get('/api/v1/khong-co');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('KHONG_TIM_THAY');
  });
});
