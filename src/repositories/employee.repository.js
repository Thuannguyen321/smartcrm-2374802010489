async function findByUsername(db, username) {
  const { rows } = await db.query(
    `SELECT e.employee_id, e.full_name, e.role, e.center_id, e.username, e.password_hash, s.center_name
     FROM employee e LEFT JOIN service_center s ON s.center_id = e.center_id
     WHERE e.username = $1`,
    [username]
  );
  return rows[0] || null;
}

module.exports = { findByUsername };
