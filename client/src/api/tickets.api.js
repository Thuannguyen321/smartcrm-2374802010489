// Hop dong voi backend: xem src/controllers/presenters.js (ticketSummaryDto, ticketDetailDto).
import { api } from './client';

/** @returns {Promise<{data: Array, meta: {page, pageSize, total}}>} */
export const listTickets = (filters) => api.get('/tickets', filters);
export const getTicket = (id) => api.get(`/tickets/${id}`).then((r) => r.data);
export const createTicket = (payload) => api.post('/tickets', payload).then((r) => r.data);
export const reviewTicket = (id, decision, note) => api.patch(`/tickets/${id}/review`, { decision, note }).then((r) => r.data);
export const previewSla = (priority) => api.get('/tickets/sla-preview', { priority }).then((r) => r.data);
