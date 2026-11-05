const { deviceDto } = require('./presenters');

function createDeviceController({ deviceService }) {
  return {
    async lookup(req, res) {
      res.json({ data: deviceDto(await deviceService.findBySerial(req.query.serial), req.user) });
    },
    async get(req, res) {
      res.json({ data: deviceDto(await deviceService.getById(req.params.id), req.user) });
    },
    async create(req, res) {
      res.status(201).json({ data: deviceDto(await deviceService.create(req.body || {}), req.user) });
    },
    async update(req, res) {
      res.json({ data: deviceDto(await deviceService.update(req.params.id, req.body || {}), req.user) });
    },
    async remove(req, res) {
      await deviceService.remove(req.params.id);
      res.status(204).end();
    },
  };
}

module.exports = { createDeviceController };
