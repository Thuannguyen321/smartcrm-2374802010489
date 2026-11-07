// Doc bien moi truong mot lan, kiem tra bien bat buoc ngay khi khoi dong
// de loi cau hinh hien ra som (thay vi loi "undefined" giua chung).
require('dotenv').config();
const crypto = require('crypto');

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thieu bien moi truong ${name}. Hay chay: cp .env.example .env`);
  }
  return value;
}

// Gia tri mau trong .env.example la CONG KHAI tren GitHub -> ai cung ky duoc token (BUG-06).
const JWT_SECRET_MAU = ['doi-thanh-chuoi-bi-mat-cua-ban'];
const JWT_SECRET_TOI_THIEU = 32;
let jwtSecretTam;

/**
 * Khoa ky JWT. Neu .env chua dat khoa rieng (bo trong, con gia tri mau, hoac < 32 ky tu)
 * thi KHONG dung gia tri do: sinh khoa ngau nhien cho tien trinh nay va canh bao.
 * Token cu het hieu luc khi khoi dong lai - chap nhan duoc o moi truong dev.
 */
function jwtSecret() {
  const value = process.env.JWT_SECRET || '';
  if (value.length >= JWT_SECRET_TOI_THIEU && !JWT_SECRET_MAU.includes(value)) return value;
  if (!jwtSecretTam) {
    jwtSecretTam = crypto.randomBytes(48).toString('hex');
    console.warn(
      `[env] JWT_SECRET ${value ? 'dang la gia tri mau hoac ngan hon 32 ky tu' : 'chua dat'} -> dung khoa ngau nhien tam thoi.`
      + ' Dat JWT_SECRET rieng trong .env (vd: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))").'
    );
  }
  return jwtSecretTam;
}

module.exports = {
  required,
  port: Number(process.env.PORT || 3000),
  databaseUrl: () => required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
