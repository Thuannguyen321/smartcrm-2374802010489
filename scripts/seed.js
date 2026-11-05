// Nap du lieu mau tu database/seeds/*.sql. Moi cau lenh dung ON CONFLICT DO NOTHING
// nen chay nhieu lan khong nhan doi dong (C5). In so dong tung bang de doi chieu.
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../src/config/database');

const DIR = path.join(__dirname, '..', 'database', 'seeds');
const TABLES = ['service_center', 'employee', 'issue_category', 'product', 'customer', 'device', 'ticket', 'ticket_status_log'];

async function main() {
  const pool = getPool();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(DIR, file), 'utf8'));
    console.log(`[seed] da nap ${file}`);
  }
  for (const t of TABLES) {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${t}`);
    console.log(`[seed] ${t.padEnd(18)} ${String(rows[0].n).padStart(3)} dong`);
  }
}

main()
  .catch((err) => {
    console.error(`[seed] THAT BAI: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(closePool);
