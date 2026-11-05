const { Pool } = require('pg');
const env = require('./env');

let pool;

/** Pool ket noi dung chung cho toan ung dung (tao lan dau khi duoc goi). */
function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl(), max: 10 });
  }
  return pool;
}

/**
 * Chay fn trong MOT transaction (NFR5): COMMIT neu fn thanh cong,
 * ROLLBACK neu fn nem loi -> khong co phieu luu do dang.
 */
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { getPool, withTransaction, closePool };
