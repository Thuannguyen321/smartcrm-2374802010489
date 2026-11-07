// Test he thong TC-01..TC-12 (buoi 14) - chay chung voi `npm test`.
// Can PostgreSQL dang chay (docker compose up -d db). Dung CSDL rieng <ten>_test.
const { resetDb, createContext, closePool } = require('./context');
const { CASES } = require('./cases');

describe('He thong (API that + PostgreSQL that)', () => {
  afterAll(closePool);

  for (const tc of CASES) {
    test(`${tc.id} [${tc.loai}] ${tc.tieuDe}`, async () => {
      await resetDb();
      const r = await tc.run(createContext());
      if (!r.pass) throw new Error(`FAIL (sai: ${r.sai.join(', ')})\nMong doi: ${tc.mongDoi}\nThuc te : ${r.thucTe}`);
    }, 60000);
  }
});
