# Deployment Guide - Smart CRM, flow L2 (track SE), tag v1.0

Smart CRM module of Mekong Mobile: receiving and classifying warranty requests (flow L2).
Student: Nguyen Hoang Thuan - 2374802010489. Repository: https://github.com/Thuannguyen321/smartcrm-2374802010489

The whole system (React UI + Node.js API + PostgreSQL 16) starts with **two commands** after cloning.
Database tables and sample data are created automatically; no Node.js or PostgreSQL install is needed.

## 1. Requirements

| Item | Version / value | Check with |
|---|---|---|
| OS | Windows 10/11, macOS 13+ or Linux x86_64/arm64 | - |
| Docker Engine + Docker Compose v2 | Docker 24+ and Compose 2.20+ (Docker Desktop 4.25+ on Windows/macOS). Tested with Docker 29.9 / Compose 5.6 (Linux) | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Free disk | about 1.5 GB (images `node:20-alpine`, `postgres:16-alpine`, build cache) | - |
| Free port | `3000` on the host (change with `APP_PORT` in `.env`, see section 3) | Windows: `netstat -ano \| findstr :3000` - Linux/macOS: `lsof -i :3000` |
| Internet | needed for the **first** build only (pull images, `npm ci`) | - |

Docker Desktop must be **running** before step 3. Node.js and PostgreSQL do **not** need to be installed.

## 2. Setup steps

Run each command in a terminal (Windows: PowerShell; macOS/Linux: bash). One command per step.

1. Clone the submitted version (tag `v1.0`) into an empty folder and enter it:
   ```bash
   git clone --branch v1.0 https://github.com/Thuannguyen321/smartcrm-2374802010489.git smartcrm
   cd smartcrm
   ```
2. Create the configuration file from the template (sample values work as-is for testing):
   ```bash
   cp .env.example .env
   ```
   Windows PowerShell: `copy .env.example .env`
3. Build and start everything (first run takes about 1-3 minutes):
   ```bash
   docker compose up -d --build
   ```

What happens in step 3: the `db` container (PostgreSQL 16) starts and becomes `healthy`; only then the `app` container starts, runs the migrations (8 tables), loads the sample data, and serves the API and the built React UI on port 3000.

Open the UI: http://localhost:3000 and log in with a demo account from section 4.

Stop: `docker compose down` (keeps data). Reset to a clean state: `docker compose down -v` (also deletes the database volume).

## 3. Environment variables

All variables are read from `.env` (template: `.env.example`, committed; `.env` itself is never committed).

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `APP_PORT` | Host port that opens the app (`http://localhost:<APP_PORT>`) | `3000` | no (default 3000) |
| `DB_NAME` | PostgreSQL database name, created on first start | `smartcrm_db` | yes |
| `DB_USER` | PostgreSQL user, created on first start | `smartcrm` | yes |
| `DB_PASSWORD` | PostgreSQL password. Letters and digits only (it is put into a connection URL). **Change it for a real deployment.** | `smartcrm_dev` | yes |
| `JWT_SECRET` | Key used to sign login tokens, >= 32 random characters (`openssl rand -hex 32`). If it is left at the sample value or is shorter than 32 characters, the app **refuses to use it** and generates a temporary random key (users must log in again after each restart) - see BUG-06. **Set it for a real deployment.** | `doi-thanh-chuoi-bi-mat-cua-ban` | yes for production |
| `JWT_EXPIRES_IN` | Token lifetime | `8h` | no (default 8h) |
| `CORS_ORIGIN` | Origin allowed to call the API when the UI runs separately on the Vite dev server | `http://localhost:5173` | no |
| `TZ` | Time zone of the app, used for SLA working hours and warranty end dates | `Asia/Ho_Chi_Minh` (set in `docker-compose.yml`) | no |
| `DATABASE_URL` | Only for running Node.js directly on the host (development). In Docker it is built automatically as `postgres://DB_USER:DB_PASSWORD@db:5432/DB_NAME`. | `postgres://smartcrm:smartcrm_dev@localhost:5432/smartcrm_db` | no (Docker) |
| `PORT` | Only for running Node.js directly on the host. Inside Docker the app always listens on 3000. | `3000` | no (Docker) |

If a required variable is missing, `docker compose up` stops immediately with a message such as `required variable DB_PASSWORD is missing a value: Thieu DB_PASSWORD - hay chay cp .env.example .env`.

## 4. Sample data

Loaded **automatically** at every start of the `app` container (`node scripts/migrate.js && node scripts/seed.js`, files in `database/migrations/` and `database/seeds/`). Every insert uses `ON CONFLICT DO NOTHING` and migrations are recorded in `schema_migrations`, so restarting never duplicates rows.

After the first start the database contains:

| Table | Rows | Table | Rows |
|---|---|---|---|
| `service_center` | 3 | `customer` | 6 |
| `employee` | 3 | `device` | 7 |
| `issue_category` | 6 | `ticket` | 5 (`BH-000001/2026` ... `BH-000005/2026`) |
| `product` | 8 | `ticket_status_log` | 5 |

The app log prints these counts: `docker compose logs app | grep seed`.

Demo accounts (sample data, not real secrets; passwords are stored as bcrypt hashes) - password `Mekong@2026` for all:

| Username | Role | Service centre |
|---|---|---|
| `letan01` | RECEPTIONIST - creates tickets | TTBH Mekong Can Tho |
| `quanly01` | MANAGER - reviews tickets, edits/deletes customers | TTBH Mekong Can Tho |
| `letan02` | RECEPTIONIST | TTBH Mekong Vinh Long |

## 5. Verify it works

Run in the project folder after step 3. Each command has the expected result.

| # | Command | Expected result |
|---|---|---|
| 1 | `docker compose ps` | Two services `app` and `db`, both `Up ... (healthy)`. (`app` shows `health: starting` for up to ~20 s.) |
| 2 | `curl -s http://localhost:3000/health` | `{"status":"ok","db":"up"}` |
| 3 | `docker compose exec app npm test` | Ends with `Test Suites: 14 passed, 14 total` and `Tests: 84 passed, 84 total` (72 unit/API + 12 system test cases TC-01...TC-12 on the real PostgreSQL, in a separate database `smartcrm_db_test`). Takes about 15 s. |
| 4 | `docker compose exec app npm run tc -- TC-05` | Runs one test case of the Test Report and prints its steps, expected and actual result, ending with `Tong: 1 test case · PASS 1 · FAIL 0`. Replace `TC-05` by any `TC-01` ... `TC-12`. |
| 5 | Browser: http://localhost:3000, log in `letan01` / `Mekong@2026` | Ticket list "Danh sách phiếu" shows the 5 sample tickets `BH-000001/2026` ... `BH-000005/2026`. |
| 6 | Re-run check (C8): `docker compose restart app`, wait until healthy, then `docker compose logs app --tail 12` | Migrations print `bo qua` (skipped) and seed prints the **same** counts as section 4 (`ticket 5 dong`, `customer 6 dong`). |

Windows PowerShell: use `curl.exe` instead of `curl` (or open http://localhost:3000/health in the browser).

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Port 3000 used by another program | Set `APP_PORT=3001` in `.env`, run `docker compose up -d` again, use http://localhost:3001 |
| `required variable DB_PASSWORD is missing a value: Thieu DB_PASSWORD - hay chay cp .env.example .env` | Step 2 skipped (no `.env`) | `cp .env.example .env` |
| `Cannot connect to the Docker daemon` / `open //./pipe/dockerDesktopLinuxEngine` | Docker Desktop is not running | Start Docker Desktop, wait until it says "Engine running", retry step 3 |
| `app` stays `unhealthy` / `password authentication failed` | `DB_*` values changed after the database volume was created | `docker compose down -v` then `docker compose up -d --build` (deletes data) |
| Login works but you are logged out after a restart | `JWT_SECRET` is still the sample value (a temporary key is generated at each start) | Put a random value of >= 32 characters in `JWT_SECRET`, then `docker compose up -d` |
| Something else | - | Read the log first: `docker compose logs app --tail 50` |

## 7. Monitoring & alerts

Monitoring already available: `GET /health` checks the app and the database (Docker marks `app` `unhealthy` after 5 failed checks, 10 s apart); errors are logged as `[error] <METHOD> <path> ...` without tokens or phone numbers; `docker compose ps` shows the state of both services.

### ALERT-01 Database unreachable
- Measure: result of `GET /health`, every 10 s (Docker healthcheck).
- Threshold: `db` is `down` (HTTP 503) on 5 consecutive checks (about 1 minute).
- Notify: on-duty operator of the service centre system, by chat message.
- Action: 1) `docker compose ps` - is `db` running? 2) if not: `docker compose start db`, then `curl -s http://localhost:3000/health` must return `{"status":"ok","db":"up"}` within 30 s (the app reconnects by itself, BUG-10). 3) still failing after 10 minutes: send `docker compose logs db --tail 50` to the developer.

### ALERT-02 Tickets about to miss the SLA (business)
- Measure: number of tickets with SLA state `SAP_TRE` (due within 4 hours) per centre, every hour - `GET /api/v1/tickets?slaState=SAP_TRE` as a manager, read `meta.total`.
- Threshold: more than 5 tickets in one centre.
- Notify: manager of that service centre (`MANAGER` role), by e-mail.
- Action: open the ticket list filtered "Sắp trễ", reassign those tickets to free technicians first, oldest due date first.

## 8. Development without Docker for the app (optional)

Only for changing code: start just the database with its port opened on 127.0.0.1, then run Node.js 20 on the host.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
npm ci
npm run db:setup
npm test
npm start
```
