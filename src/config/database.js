const { Pool } = require('pg');
const env = require('./env');

let pool;

/**
 * Mui gio cua phien CSDL = mui gio cua tien trinh Node, dang POSIX "<+07>-07" (BUG-08).
 * Cac cot TIMESTAMP (khong mui gio): pg ghi/doc Date theo gio dia phuong cua Node,
 * con DEFAULT CURRENT_TIMESTAMP va seed lai tinh theo mui gio phien CSDL (Docker = UTC)
 * -> hai nguon lech nhau 7 tieng. Dat chung mot mui gio de moi gia tri cung he quy chieu.
 * (POSIX dao dau: "<+07>-07" nghia la UTC+7.)
 */
function sessionTimeZone(date = new Date()) {
  const off = -date.getTimezoneOffset(); // phut, VN = +420
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = abs % 60 ? String(abs % 60).padStart(2, '0') : '';
  const posixSign = off >= 0 ? '-' : '+';
  return `<${sign}${hh}${mm}>${posixSign}${hh}${mm ? `:${mm}` : ''}`;
}

/** Pool ket noi dung chung cho toan ung dung (tao lan dau khi duoc goi). */
function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl(), max: 10, options: `-c TimeZone=${sessionTimeZone()}` });
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

module.exports = { getPool, withTransaction, closePool, sessionTimeZone };
