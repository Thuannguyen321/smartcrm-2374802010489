// GET /health - cach nhanh nhat de nguoi cham (va healthcheck cua Docker) biet he thong da len.
// Kiem tra ca CSDL: CSDL khong phan hoi -> 503 de `docker compose ps` bao "unhealthy".
const { getPool } = require('./config/database');

const TIMEOUT_MS = 2000;

/** Ping CSDL bang SELECT 1, toi da 2 giay. Tra 'up' hoac 'down' (khong lo chi tiet loi). */
async function pingDb(pool = getPool()) {
  let timer;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS); }),
    ]);
    return 'up';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

function healthHandler(ping = pingDb) {
  return async (_req, res) => {
    const db = await ping();
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db });
  };
}

module.exports = { pingDb, healthHandler };
