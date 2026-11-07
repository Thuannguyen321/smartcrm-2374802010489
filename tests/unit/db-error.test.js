// BUG-04: db:setup tren Windows bao loi rong (AggregateError) khi PostgreSQL chua chay.
const { moTaLoiCsdl } = require('../../scripts/db-error');

describe('moTaLoiCsdl (BUG-04)', () => {
  test('[luong dung] ECONNREFUSED -> in ma loi kem goi y bat PostgreSQL', () => {
    const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
    const r = moTaLoiCsdl(err);
    expect(r.code).toBe('ECONNREFUSED');
    expect(r.message).toContain('docker compose up -d db');
  });

  test('[bien] AggregateError message rong (Windows ::1 + 127.0.0.1) -> van lay duoc ma loi', () => {
    const e1 = Object.assign(new Error('connect ECONNREFUSED ::1:5432'), { code: 'ECONNREFUSED' });
    const e2 = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
    const r = moTaLoiCsdl(new AggregateError([e1, e2], ''));
    expect(r.code).toBe('ECONNREFUSED');
    expect(r.message).toContain('::1:5432');
    expect(r.message).not.toMatch(/^\s*$/);
  });

  test('[du lieu sai] loi khong co ma -> giu nguyen thong bao, khong them goi y sai', () => {
    const r = moTaLoiCsdl(new Error('syntax error at or near "SELEC"'));
    expect(r.code).toBeNull();
    expect(r.message).toBe('syntax error at or near "SELEC"');
  });
});
