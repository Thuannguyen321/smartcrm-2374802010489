// BUG-06: khong duoc dung JWT_SECRET mau (cong khai trong .env.example) de ky token.
describe('env.jwtSecret (BUG-06)', () => {
  const cu = process.env.JWT_SECRET;
  let warn;
  beforeEach(() => { jest.resetModules(); warn = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warn.mockRestore(); if (cu === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = cu; });

  test('[luong dung] khoa rieng >= 32 ky tu -> dung dung khoa do', () => {
    process.env.JWT_SECRET = 'k'.repeat(40);
    expect(require('../../src/config/env').jwtSecret()).toBe('k'.repeat(40));
  });

  test('[bao mat] gia tri mau trong .env.example -> khong dung, sinh khoa ngau nhien va canh bao', () => {
    process.env.JWT_SECRET = 'doi-thanh-chuoi-bi-mat-cua-ban';
    const env = require('../../src/config/env');
    const s = env.jwtSecret();
    expect(s).not.toBe('doi-thanh-chuoi-bi-mat-cua-ban');
    expect(s.length).toBeGreaterThanOrEqual(64);
    expect(env.jwtSecret()).toBe(s); // on dinh trong cung tien trinh
    expect(warn).toHaveBeenCalled();
  });

  test('[bien] 31 ky tu -> coi la qua ngan', () => {
    process.env.JWT_SECRET = 'a'.repeat(31);
    expect(require('../../src/config/env').jwtSecret()).not.toBe('a'.repeat(31));
  });
});
