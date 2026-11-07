// Chay cac file database/migrations/*.sql theo thu tu ten file.
// Moi file chi chay MOT lan (ghi vao bang schema_migrations) -> chay lai khong loi (C5).
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../src/config/database');
const { moTaLoiCsdl } = require('./db-error');

const DIR = path.join(__dirname, '..', 'database', 'migrations');

async function main() {
  const pool = getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

  const done = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`[migrate] bo qua  ${file} (da chay)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[migrate] da chay ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} loi: ${err.message}`);
    } finally {
      client.release();
    }
  }
  const tables = await pool.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name <> 'schema_migrations'"
  );
  console.log(`[migrate] xong. So bang nghiep vu: ${tables.rows[0].n}`);
}

main()
  .catch((err) => {
    console.error(`[migrate] THAT BAI: ${moTaLoiCsdl(err).message}`);
    process.exitCode = 1;
  })
  .finally(closePool);
