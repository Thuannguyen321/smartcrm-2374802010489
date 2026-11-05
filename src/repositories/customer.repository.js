// Lop truy cap du lieu: CHI chua cau SQL, khong chua quy tac nghiep vu.
// Moi ham nhan `db` (Pool hoac client trong transaction) lam tham so dau.
const COLS = 'customer_id, full_name, phone, email, address, segment, created_at';

async function findById(db, id) {
  const { rows } = await db.query(`SELECT ${COLS} FROM customer WHERE customer_id = $1`, [id]);
  return rows[0] || null;
}

async function findByPhone(db, phone) {
  const { rows } = await db.query(`SELECT ${COLS} FROM customer WHERE phone = $1`, [phone]);
  return rows[0] || null;
}

async function list(db, { q, limit, offset }) {
  const params = [];
  let where = '';
  if (q) {
    params.push(`%${q}%`);
    where = `WHERE full_name ILIKE $1 OR phone LIKE $1`;
  }
  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT ${COLS}, count(*) OVER()::int AS total_count FROM customer ${where}
     ORDER BY customer_id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function create(db, c) {
  const { rows } = await db.query(
    `INSERT INTO customer (full_name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
    [c.fullName, c.phone, c.email, c.address]
  );
  return rows[0];
}

async function update(db, id, c) {
  const { rows } = await db.query(
    `UPDATE customer SET full_name = $2, phone = $3, email = $4, address = $5
     WHERE customer_id = $1 RETURNING ${COLS}`,
    [id, c.fullName, c.phone, c.email, c.address]
  );
  return rows[0] || null;
}

async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM customer WHERE customer_id = $1', [id]);
  return rowCount > 0;
}

async function countDevices(db, id) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM device WHERE customer_id = $1', [id]);
  return rows[0].n;
}

module.exports = { findById, findByPhone, list, create, update, remove, countDevices };
