// Lop API - dinh tuyen. Moi route: middleware xac thuc/phan quyen -> controller.
const express = require('express');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

/** Boc handler async de loi duoc chuyen toi errorHandler (Express 4 khong tu bat Promise reject). */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createRouter({ controllers, authService }) {
  const { auth, customer, device, ticket } = controllers;
  const router = express.Router();
  const staff = [authenticate(authService), requireRole('RECEPTIONIST', 'MANAGER')];

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  router.post('/auth/login', wrap(auth.login));
  router.get('/auth/me', staff, wrap(auth.me));

  router.get('/catalog/categories', staff, wrap(auth.categories));
  router.get('/catalog/products', staff, wrap(auth.products));

  // Khach hang - CRUD day du (FR1, FR2)
  router.get('/customers', staff, wrap(customer.list));
  router.get('/customers/lookup', staff, wrap(customer.lookup));
  router.get('/customers/:id', staff, wrap(customer.get));
  router.get('/customers/:id/devices', staff, wrap(customer.devices));
  router.post('/customers', staff, wrap(customer.create));
  router.put('/customers/:id', staff, requireRole('MANAGER'), wrap(customer.update)); // NV tiep nhan chi thay SDT da che
  router.delete('/customers/:id', staff, requireRole('MANAGER'), wrap(customer.remove));

  // Thiet bi - CRUD day du (FR3)
  router.get('/devices/lookup', staff, wrap(device.lookup));
  router.get('/devices/:id', staff, wrap(device.get));
  router.post('/devices', staff, wrap(device.create));
  router.put('/devices/:id', staff, wrap(device.update));
  router.delete('/devices/:id', staff, requireRole('MANAGER'), wrap(device.remove));

  // Phieu bao hanh - Tao / Xem / Xet duyet (FR4-FR8). Khong sua/xoa (TD-10).
  router.get('/tickets', staff, wrap(ticket.list));
  router.get('/tickets/sla-preview', staff, wrap(ticket.slaPreview));
  router.get('/tickets/:id', staff, wrap(ticket.get));
  router.post('/tickets', staff, requireRole('RECEPTIONIST'), wrap(ticket.create));
  router.patch('/tickets/:id/review', staff, requireRole('MANAGER'), wrap(ticket.review));

  return router;
}

module.exports = { createRouter };
