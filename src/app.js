const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { createRouter } = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

/**
 * Tao ung dung Express tu cac dependency da lap san (xem container.js).
 * Tach rieng khoi server.js de test API bang supertest voi service gia.
 */
function createApp({ controllers, authService, corsOrigin = '*', serveClient = false }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', createRouter({ controllers, authService }));
  app.use('/api', notFound);

  // Neu da build frontend (npm run client:build) thi phuc vu luon tai cung cong.
  const dist = path.join(__dirname, '..', 'client', 'dist');
  if (serveClient && fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
