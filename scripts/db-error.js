// Doi loi ket noi CSDL thanh thong bao doc duoc (BUG-04).
// Tren Windows, "localhost" phan giai ra ca ::1 va 127.0.0.1; khi ca hai deu bi tu choi,
// thu vien pg nem AggregateError co message RONG -> truoc day chi in "THAT BAI: ".
function moTaLoiCsdl(err) {
  const ds = err && Array.isArray(err.errors) && err.errors.length ? err.errors : [err];
  const code = (err && err.code) || ds.map((e) => e && e.code).find(Boolean) || null;
  const chiTiet = (err && err.message) || ds.map((e) => e && e.message).filter(Boolean).join('; ') || String(err);

  let goiY = '';
  if (code === 'ECONNREFUSED') {
    goiY = 'PostgreSQL chua chay hoac sai cong. Chay "docker compose up -d db" (hoac bat dich vu PostgreSQL) roi kiem tra DATABASE_URL trong .env.';
  } else if (code === '28P01') {
    goiY = 'Sai ten dang nhap/mat khau CSDL. Kiem tra DATABASE_URL trong .env.';
  } else if (code === '3D000') {
    goiY = 'CSDL chua ton tai. Xem README muc 3 (tao user va CSDL smartcrm_db).';
  }
  return { code, message: `${code ? `[${code}] ` : ''}${chiTiet}${goiY ? `\n  -> ${goiY}` : ''}` };
}

module.exports = { moTaLoiCsdl };
