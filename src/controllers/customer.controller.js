// Lop API: doc req -> goi service -> tra JSON. Khong chua quy tac nghiep vu.
const { customerDto, deviceDto, pageDto } = require('./presenters');

function createCustomerController({ customerService, deviceService }) {
  return {
    async list(req, res) {
      if (req.query.phone) {
        const c = await customerService.findByPhone(req.query.phone);
        return res.json({ data: [customerDto(c, req.user)], meta: { page: 1, pageSize: 1, total: 1 } });
      }
      const result = await customerService.list(req.query);
      return res.json(pageDto(result, (c) => customerDto(c, req.user)));
    },
    async lookup(req, res) {
      res.json({ data: customerDto(await customerService.findByPhone(req.query.phone), req.user) });
    },
    async get(req, res) {
      res.json({ data: customerDto(await customerService.getById(req.params.id), req.user) });
    },
    async create(req, res) {
      res.status(201).json({ data: customerDto(await customerService.create(req.body || {}), req.user) });
    },
    async update(req, res) {
      res.json({ data: customerDto(await customerService.update(req.params.id, req.body || {}), req.user) });
    },
    async remove(req, res) {
      await customerService.remove(req.params.id);
      res.status(204).end();
    },
    async devices(req, res) {
      const list = await deviceService.listByCustomer(req.params.id);
      res.json({ data: list.map((d) => deviceDto(d, req.user)) });
    },
  };
}

module.exports = { createCustomerController };
