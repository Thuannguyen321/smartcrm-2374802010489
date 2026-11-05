const { ticketSummaryDto, ticketDetailDto, pageDto } = require('./presenters');

function createTicketController({ ticketService }) {
  return {
    async list(req, res) {
      const result = await ticketService.listTickets(req.query, req.user);
      res.json(pageDto(result, (t) => ticketSummaryDto(t, req.user)));
    },
    async get(req, res) {
      res.json({ data: ticketDetailDto(await ticketService.getTicket(req.params.id, req.user), req.user) });
    },
    async create(req, res) {
      res.status(201).json({ success: true, data: await ticketService.createTicket(req.body || {}, req.user) });
    },
    async review(req, res) {
      const t = await ticketService.reviewTicket(req.params.id, req.body || {}, req.user);
      res.json({ data: ticketDetailDto(t, req.user) });
    },
    async slaPreview(req, res) {
      res.json({ data: ticketService.previewSla(req.query.priority) });
    },
  };
}

module.exports = { createTicketController };
