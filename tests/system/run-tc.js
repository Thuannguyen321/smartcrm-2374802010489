// Chay va in chi tiet tung test case de chup anh minh chung (docs/screenshots/TC-xx.png).
//   npm run tc            -> chay ca 12 test case
//   npm run tc -- TC-05   -> chi chay TC-05 (giang vien chon ngau nhien)
const { resetDb, createContext, closePool, TEST_URL } = require('./context');
const { CASES } = require('./cases');

async function main() {
  const ids = process.argv.slice(2).map((s) => s.toUpperCase());
  const chon = ids.length ? CASES.filter((c) => ids.includes(c.id)) : CASES;
  if (chon.length === 0) throw new Error(`Khong co test case ${ids.join(', ')}`);
  const db = new URL(TEST_URL);
  console.log(`CSDL test: ${db.host}${db.pathname} · TZ ung dung: ${process.env.TZ} · ${new Date().toString()}`);
  let pass = 0;
  for (const tc of chon) {
    await resetDb();
    let r;
    try {
      r = await tc.run(createContext());
    } catch (err) {
      r = { pass: false, thucTe: `LOI KHI CHAY: ${err.message}`, sai: ['loi'] };
    }
    if (r.pass) pass += 1;
    console.log(`\n=== ${tc.id} · ${tc.loai} · Ưu tiên: ${tc.uuTien} · ${tc.tieuDe}`);
    console.log(`Tiền điều kiện : ${tc.tienDieuKien}`);
    console.log(`Các bước       : ${tc.buoc}`);
    console.log(`Mong đợi       : ${tc.mongDoi}`);
    console.log(`Thực tế        : ${r.thucTe}`);
    console.log(`Kết quả        : ${r.pass ? 'PASS' : `FAIL (sai: ${r.sai.join(', ')})`}`);
  }
  console.log(`\nTong: ${chon.length} test case · PASS ${pass} · FAIL ${chon.length - pass}`);
  if (pass !== chon.length) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(closePool);
