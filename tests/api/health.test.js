// GET /health (BT3): 200 khi CSDL tra loi, 503 khi CSDL khong phan hoi - khong lo chi tiet loi.
const request = require('supertest');
const { createApp } = require('../../src/app');
const { healthHandler, pingDb } = require('../../src/health');

const controllers = { auth: {}, customer: {}, device: {}, ticket: {} };
const authService = { verify: () => { throw new Error('khong dung'); } };

describe('GET /health', () => {
  test('CSDL len -> 200 {status:ok, db:up}', async () => {
    const app = createApp({ controllers, authService, health: healthHandler(async () => 'up') });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });

  test('CSDL xuong -> 503 {status:degraded, db:down}', async () => {
    const app = createApp({ controllers, authService, health: healthHandler(async () => 'down') });
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'degraded', db: 'down' });
  });

  test('pingDb: query loi -> "down", khong nem loi ra ngoai', async () => {
    const pool = { query: async () => { throw Object.assign(new Error('getaddrinfo ENOTFOUND db'), { code: 'ENOTFOUND' }); } };
    await expect(pingDb(pool)).resolves.toBe('down');
  });
});
