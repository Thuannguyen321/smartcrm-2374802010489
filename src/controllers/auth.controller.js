function createAuthController({ authService, catalogService }) {
  return {
    async login(req, res) {
      res.json({ data: await authService.login(req.body || {}) });
    },
    async me(req, res) {
      res.json({ data: req.user });
    },
    async categories(_req, res) {
      const rows = await catalogService.listCategories();
      res.json({
        data: rows.map((c) => ({ categoryId: c.category_id, categoryName: c.category_name, defaultPriority: c.default_priority })),
      });
    },
    async products(_req, res) {
      const rows = await catalogService.listProducts();
      res.json({ data: rows.map((p) => ({ productId: Number(p.product_id), productName: p.product_name, brand: p.brand })) });
    },
  };
}

module.exports = { createAuthController };
