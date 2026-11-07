// Moi truong chay test he thong (buoi 14): API that + PostgreSQL that.
// Dung CSDL RIENG <ten_csdl>_test de khong xoa du lieu dang dung o CSDL chinh.
//
// Mui gio cua tien trinh Node co dinh la gio Viet Nam (giong may Windows cua sinh vien),
// con CSDL chay trong Docker mac dinh la UTC -> tai lap dung moi truong that.
process.env.TZ = process.env.TC_TZ || 'Asia/Ho_Chi_Minh';

const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const ROOT = path.join(__dirname, '..', '..');

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('Thieu DATABASE_URL (hay chay: cp .env.example .env) - test he thong can PostgreSQL dang chay');
  const u = new URL(base);
  const name = u.pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) u.pathname = `/${name}_test`;
  return { url: u.toString(), adminUrl: base };
}

const conf = testDatabaseUrl();
const TEST_URL = typeof conf === 'string' ? conf : conf.url;
const ADMIN_URL = typeof conf === 'string' ? null : conf.adminUrl;
process.env.DATABASE_URL = TEST_URL; // phai dat TRUOC khi nap src/config/database

const { Client } = require('pg');
const request = require('supertest');
const { getPool, closePool } = require('../../src/config/database');

/** Tao CSDL _test neu chua co (chi lam khi suy ra tu DATABASE_URL). */
async function ensureTestDatabase() {
  if (!ADMIN_URL) return;
  const name = new URL(TEST_URL).pathname.slice(1);
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount === 0) await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }
}

/** Chay script cua du an (migrate/seed) trong tien trinh rieng, giong nguoi dung go lenh. */
function runScript(file) {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', file)], {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: TEST_URL },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

/** TIEN DIEU KIEN chung: CSDL trong -> migrate -> seed (resetDb + seed). */
async function resetDb() {
  await ensureTestDatabase();
  await getPool().query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  for (const f of ['migrate.js', 'seed.js']) {
    const r = runScript(f);
    if (r.code !== 0) throw new Error(`${f} that bai:\n${r.out}`);
  }
}

async function count(table, where = '', params = []) {
  const { rows } = await getPool().query(`SELECT count(*)::int AS n FROM ${table} ${where}`, params);
  return rows[0].n;
}

async function one(sql, params = []) {
  const { rows } = await getPool().query(sql, params);
  return rows[0];
}

/** Lap ung dung THAT (container that, CSDL that) - giong src/server.js nhung khong mo cong. */
function buildRealApp() {
  // Nap lai container de doc bien moi truong hien tai (TC-10 doi JWT_SECRET).
  resetModuleCache();
  const { createApp } = require('../../src/app');
  const { buildContainer } = require('../../src/container');
  const { controllers, authService } = buildContainer();
  return createApp({ controllers, authService });
}

function resetModuleCache() {
  // Xoa cache module env/container/auth de buildContainer() doc lai process.env.
  for (const key of Object.keys(require.cache)) {
    if (/[\\/]src[\\/](config[\\/]env|container)\.js$/.test(key)) delete require.cache[key];
  }
}

async function login(api, username, password = 'Mekong@2026') {
  const res = await api.post('/api/v1/auth/login').send({ username, password });
  if (res.status !== 200) throw new Error(`Dang nhap ${username} that bai: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

/** Ngay theo lich dia phuong (gio VN) dang YYYY-MM-DD. */
function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Cong/tru thang theo dung quy tac QT-05 (ngay 31 -> ngay cuoi thang). */
function addMonthsIso(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

function createContext() {
  const app = buildRealApp();
  return {
    api: request(app),
    buildRealApp,
    login,
    count,
    one,
    db: getPool(),
    runScript,
    localDate,
    addMonthsIso,
    addDaysIso,
  };
}

module.exports = { resetDb, createContext, closePool, TEST_URL };
