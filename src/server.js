const env = require('./config/env');
const { createApp } = require('./app');
const { buildContainer } = require('./container');
const { getPool, closePool } = require('./config/database');
const { healthHandler } = require('./health');

async function main() {
  const { controllers, authService } = buildContainer();
  // Kiem tra CSDL ngay khi khoi dong: bao loi ro rang thay vi de request dau tien treo.
  try {
    await getPool().query('SELECT 1');
  } catch (err) {
    console.error(`[server] Khong ket noi duoc CSDL (${err.code || err.message}). Kiem tra DATABASE_URL trong .env va CSDL da chay chua.`);
    process.exit(1);
  }
  const app = createApp({ controllers, authService, corsOrigin: env.corsOrigin, serveClient: true, health: healthHandler() });
  const server = app.listen(env.port, () => {
    console.log(`[server] Smart CRM API dang chay tai cong ${env.port} (API: /api/v1, kiem tra: /health)`);
  });

  const shutdown = () => server.close(() => closePool().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
