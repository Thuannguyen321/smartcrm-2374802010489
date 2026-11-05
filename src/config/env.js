// Doc bien moi truong mot lan, kiem tra bien bat buoc ngay khi khoi dong
// de loi cau hinh hien ra som (thay vi loi "undefined" giua chung).
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thieu bien moi truong ${name}. Hay chay: cp .env.example .env`);
  }
  return value;
}

module.exports = {
  required,
  port: Number(process.env.PORT || 3000),
  databaseUrl: () => required('DATABASE_URL'),
  jwtSecret: () => required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
