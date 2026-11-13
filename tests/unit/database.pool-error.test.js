// BUG-10: CSDL bi dung / khoi dong lai -> pool phat 'error'. Truoc ban sua khong ai nghe -> Node dung ca tien trinh.
describe('Pool CSDL khi mat ket noi (BUG-10)', () => {
  const urlCu = process.env.DATABASE_URL;
  let db;

  beforeAll(() => {
    process.env.DATABASE_URL = 'postgres://u:p@127.0.0.1:1/khong_ton_tai'; // khong ket noi that
    db = require('../../src/config/database');
  });

  afterAll(async () => {
    await db.closePool();
    if (urlCu === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = urlCu;
  });

  test('[luong dung] pool co bo nghe su kien error', () => {
    expect(db.getPool().listenerCount('error')).toBeGreaterThanOrEqual(1);
  });

  test('[loi] phat loi 57P01 tren pool KHONG nem ra ngoai, chi ghi log ma loi', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' });
    expect(() => db.getPool().emit('error', err)).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('57P01'));
    expect(spy.mock.calls[0][0]).not.toContain('postgres://');
    spy.mockRestore();
  });
});
