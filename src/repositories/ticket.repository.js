const LIST_SELECT = `
  SELECT t.ticket_id, t.ticket_code, t.status, t.priority, t.is_warranty, t.received_at, t.due_date,
         t.issue_desc, t.center_id, ic.category_name, c.full_name AS customer_name, c.phone AS customer_phone,
         p.product_name, d.serial_no`;
const FROM_JOIN = `
  FROM ticket t
  JOIN customer c ON c.customer_id = t.customer_id
  JOIN device d   ON d.device_id   = t.device_id
  JOIN product p  ON p.product_id  = d.product_id
  LEFT JOIN issue_category ic ON ic.category_id = t.category_id`;

/** Sinh ma phieu tu SEQUENCE (NFR2: khong tu dem MAX()+1) -> BH-100001/2026. */
async function nextTicketCode(db, year) {
  const { rows } = await db.query("SELECT nextval('ticket_code_seq') AS n");
  return `BH-${String(rows[0].n).padStart(6, '0')}/${year}`;
}

async function insertTicket(db, t) {
  const { rows } = await db.query(
    `INSERT INTO ticket (ticket_code, customer_id, device_id, center_id, created_by, category_id,
                         issue_desc, priority, status, received_at, due_date, is_warranty)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ticket_id`,
    [t.ticketCode, t.customerId, t.deviceId, t.centerId, t.createdBy, t.categoryId,
      t.issueDesc, t.priority, t.status, t.receivedAt, t.dueDate, t.isWarranty]
  );
  // BIGSERIAL duoc pg tra ve dang chuoi -> doi sang so cho dung hop dong API (BUG-01).
  return Number(rows[0].ticket_id);
}

async function insertStatusLog(db, log) {
  await db.query(
    `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [log.ticketId, log.fromStatus, log.toStatus, log.changedBy, log.note]
  );
}

async function findById(db, id) {
  const { rows } = await db.query(
    `${LIST_SELECT}, d.purchase_date, d.warranty_months, t.category_id, e.full_name AS created_by_name,
            s.center_name
     ${FROM_JOIN}
     JOIN employee e ON e.employee_id = t.created_by
     JOIN service_center s ON s.center_id = t.center_id
     WHERE t.ticket_id = $1`,
    [id]
  );
  return rows[0] || null;
}

/** Khoa dong phieu trong transaction de 2 quan ly khong xet duyet cung luc. */
async function findByIdForUpdate(db, id) {
  const { rows } = await db.query('SELECT ticket_id, status, center_id FROM ticket WHERE ticket_id = $1 FOR UPDATE', [id]);
  return rows[0] || null;
}

async function updateReview(db, id, { status, isWarranty }) {
  await db.query('UPDATE ticket SET status = $2, is_warranty = $3 WHERE ticket_id = $1', [id, status, isWarranty]);
}

async function listStatusLogs(db, ticketId) {
  const { rows } = await db.query(
    `SELECT l.log_id, l.from_status, l.to_status, l.changed_at, l.note, e.full_name AS changed_by_name
     FROM ticket_status_log l JOIN employee e ON e.employee_id = l.changed_by
     WHERE l.ticket_id = $1 ORDER BY l.changed_at, l.log_id`,
    [ticketId]
  );
  return rows;
}

/**
 * Danh sach phieu cua 1 trung tam, co loc + phan trang (FR8).
 * slaState duoc quy doi sang dieu kien tren due_date ngay trong SQL.
 */
async function list(db, f) {
  const where = ['t.center_id = $1'];
  const params = [f.centerId];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`)); // `?` lap lai dung chung 1 tham so
  };
  if (f.status) add('t.status = ?', f.status);
  if (f.priority) add('t.priority = ?', f.priority);
  if (f.from) add('t.received_at >= ?::date', f.from);
  if (f.to) add("t.received_at < (?::date + INTERVAL '1 day')", f.to);
  if (f.q) add('(t.ticket_code ILIKE ? OR c.phone LIKE ?)', `%${f.q}%`);
  if (f.slaState === 'TRE_HAN') add('t.due_date < ?', f.now);
  if (f.slaState === 'SAP_TRE') {
    add('t.due_date >= ?', f.now);
    add('t.due_date <= ?', f.nearDueLimit);
  }
  if (f.slaState === 'TRONG_HAN') add('t.due_date > ?', f.nearDueLimit);

  const whereSql = where.join(' AND ');
  params.push(f.limit, f.offset);
  const { rows } = await db.query(
    `${LIST_SELECT}, count(*) OVER()::int AS total_count
     ${FROM_JOIN}
     WHERE ${whereSql}
     ORDER BY t.received_at DESC, t.ticket_id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

module.exports = {
  nextTicketCode, insertTicket, insertStatusLog, findById, findByIdForUpdate,
  updateReview, listStatusLogs, list,
};
