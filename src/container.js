// Noi DUY NHAT lap rap cac lop voi nhau: repository -> service -> controller.
// Nho vay service khong tu require CSDL, va test co the truyen repository gia.
const env = require('./config/env');
const slaConfig = require('./config/sla.config.json');
const { getPool, withTransaction } = require('./config/database');

const customerRepo = require('./repositories/customer.repository');
const deviceRepo = require('./repositories/device.repository');
const ticketRepo = require('./repositories/ticket.repository');
const catalogRepo = require('./repositories/catalog.repository');
const employeeRepo = require('./repositories/employee.repository');

const { createCustomerService } = require('./services/customer.service');
const { createDeviceService } = require('./services/device.service');
const { createTicketService } = require('./services/ticket.service');
const { createAuthService } = require('./services/auth.service');
const { createCatalogService } = require('./services/catalog.service');

const { createCustomerController } = require('./controllers/customer.controller');
const { createDeviceController } = require('./controllers/device.controller');
const { createTicketController } = require('./controllers/ticket.controller');
const { createAuthController } = require('./controllers/auth.controller');

function buildContainer() {
  const db = getPool();
  const authService = createAuthService({ db, employeeRepo, jwtSecret: env.jwtSecret(), jwtExpiresIn: env.jwtExpiresIn });
  const catalogService = createCatalogService({ db, catalogRepo });
  const customerService = createCustomerService({ db, customerRepo });
  const deviceService = createDeviceService({ db, deviceRepo, customerRepo, catalogRepo });
  const ticketService = createTicketService({
    db, withTransaction, ticketRepo, customerRepo, deviceRepo, catalogRepo, slaConfig,
  });

  return {
    authService,
    controllers: {
      auth: createAuthController({ authService, catalogService }),
      customer: createCustomerController({ customerService, deviceService }),
      device: createDeviceController({ deviceService }),
      ticket: createTicketController({ ticketService }),
    },
  };
}

module.exports = { buildContainer };
