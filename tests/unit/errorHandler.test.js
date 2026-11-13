// BUG-11: CSDL khong ket noi duoc -> 503 CSDL_KHONG_SAN_SANG (khong phai 500), phan hoi khong lo chi tiet.
const { errorHandler } = require('../../src/middlewares/errorHandler');

function goi(err) {
  const res = { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  errorHandler(err, { method: 'GET', path: '/api/v1/tickets', originalUrl: '/api/v1/tickets?q=0901234567' }, res, () => {});
  return res;
}

describe('errorHandler khi CSDL khong san sang (BUG-11)', () => {
  let spy;
  beforeEach(() => { spy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  test.each(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', '57P01'])('[loi] ma %s -> 503', (code) => {
    const res = goi(Object.assign(new Error(`getaddrinfo ${code} db`), { code }));
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('CSDL_KHONG_SAN_SANG');
    expect(JSON.stringify(res.body)).not.toMatch(/getaddrinfo|db:5432|stack/);
  });

  test('[bao mat] log chi co duong dan + ma loi, khong co query string (co the chua SDT)', () => {
    goi(Object.assign(new Error('getaddrinfo ENOTFOUND db'), { code: 'ENOTFOUND' }));
    expect(spy.mock.calls[0][0]).toBe('[error] GET /api/v1/tickets - CSDL khong san sang (ENOTFOUND)');
  });

  test('[luong dung] loi khong luong truoc van la 500 LOI_HE_THONG, khong tra stack', () => {
    const res = goi(new Error('bat ngo'));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'LOI_HE_THONG', message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  });
});
