async function listCategories(db) {
  const { rows } = await db.query(
    'SELECT category_id, category_name, default_priority FROM issue_category WHERE is_active ORDER BY category_id'
  );
  return rows;
}

async function findCategoryById(db, id) {
  const { rows } = await db.query(
    'SELECT category_id, category_name, default_priority, is_active FROM issue_category WHERE category_id = $1',
    [id]
  );
  return rows[0] || null;
}

async function listProducts(db) {
  const { rows } = await db.query('SELECT product_id, product_name, brand, model_code FROM product ORDER BY brand, product_name');
  return rows;
}

async function findProductById(db, id) {
  const { rows } = await db.query('SELECT product_id, product_name, brand FROM product WHERE product_id = $1', [id]);
  return rows[0] || null;
}

module.exports = { listCategories, findCategoryById, listProducts, findProductById };
