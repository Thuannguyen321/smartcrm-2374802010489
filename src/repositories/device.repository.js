const SELECT = `
  SELECT d.device_id, d.customer_id, d.product_id, d.serial_no, d.purchase_date, d.warranty_months,
         d.created_at, p.product_name, p.brand, c.full_name AS customer_name, c.phone AS customer_phone
  FROM device d
  JOIN product p  ON p.product_id = d.product_id
  JOIN customer c ON c.customer_id = d.customer_id`;

async function findById(db, id) {
  const { rows } = await db.query(`${SELECT} WHERE d.device_id = $1`, [id]);
  return rows[0] || null;
}

async function findBySerial(db, serialNo) {
  const { rows } = await db.query(`${SELECT} WHERE d.serial_no = $1`, [serialNo]);
  return rows[0] || null;
}

async function listByCustomer(db, customerId) {
  const { rows } = await db.query(`${SELECT} WHERE d.customer_id = $1 ORDER BY d.device_id DESC`, [customerId]);
  return rows;
}

async function create(db, d) {
  const { rows } = await db.query(
    `INSERT INTO device (customer_id, product_id, serial_no, purchase_date, warranty_months)
     VALUES ($1, $2, $3, $4, $5) RETURNING device_id`,
    [d.customerId, d.productId, d.serialNo, d.purchaseDate, d.warrantyMonths]
  );
  return findById(db, rows[0].device_id);
}

async function update(db, id, d) {
  const { rowCount } = await db.query(
    `UPDATE device SET product_id = $2, serial_no = $3, purchase_date = $4, warranty_months = $5
     WHERE device_id = $1`,
    [id, d.productId, d.serialNo, d.purchaseDate, d.warrantyMonths]
  );
  return rowCount > 0 ? findById(db, id) : null;
}

async function remove(db, id) {
  const { rowCount } = await db.query('DELETE FROM device WHERE device_id = $1', [id]);
  return rowCount > 0;
}

async function countTickets(db, id) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM ticket WHERE device_id = $1', [id]);
  return rows[0].n;
}

module.exports = { findById, findBySerial, listByCustomer, create, update, remove, countTickets };
