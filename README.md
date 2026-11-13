# Smart CRM – Mekong Mobile · Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Chuyên đề tốt nghiệp 1 · HK1 2026–2027 · Track **SE**
Sinh viên: **Nguyễn Hoàng Thuận** · MSSV **2374802010489** · Lớp học phần 0303

## 1. Giới thiệu

Module số hoá khâu tiếp nhận bảo hành tại quầy của Mekong Mobile: tra cứu / tạo khách hàng theo SĐT, ghi nhận thiết bị theo Serial/IMEI, tạo phiếu bảo hành có mã duy nhất, tự kiểm tra điều kiện bảo hành (QT-05), tự tính hạn SLA theo giờ làm việc (QT-04), quản lý trung tâm xét duyệt phiếu thiếu ngày mua (QT-A3) và theo dõi danh sách phiếu theo tình trạng SLA.

Luồng chính (UC04): Nhân viên nhập SĐT → tra cứu khách (tạo mới nếu chưa có) → nhập Serial/IMEI → tra cứu thiết bị (ghi nhận nếu chưa có) → chọn nhóm sự cố, hệ thống gợi ý mức ưu tiên và hạn SLA → bấm **Tạo phiếu** → hệ thống ghi phiếu + dòng lịch sử trạng thái trong một transaction và trả mã phiếu `BH-xxxxxx/YYYY`.

## 2. Chạy hệ thống – hai lệnh (BT3, tag `v1.0`)

Chỉ cần **Docker Desktop** (Docker 24+, Compose v2) và **Git**; không cần cài Node.js hay PostgreSQL.

```bash
git clone --branch v1.0 https://github.com/Thuannguyen321/smartcrm-2374802010489.git smartcrm && cd smartcrm
```

```bash
cp .env.example .env              # Windows PowerShell: copy .env.example .env
docker compose up -d --build
```

Mở http://localhost:3000 – đăng nhập `letan01` / `Mekong@2026`. Bảng tạo, dữ liệu mẫu nạp tự động khi container `app` khởi động (chạy lại không nhân đôi).

Kiểm tra (chi tiết và kết quả mong đợi: [Deployment Guide](docs/deployment-guide.md) mục 5):

```bash
docker compose ps                         # app, db: healthy
curl -s http://localhost:3000/health      # {"status":"ok","db":"up"}
docker compose exec app npm test          # Tests: 84 passed, 84 total
```

Tài khoản demo (mật khẩu chung `Mekong@2026`):

| Tên đăng nhập | Vai trò | Trung tâm |
|---|---|---|
| `letan01` | Nhân viên tiếp nhận | TTBH Mekong Cần Thơ |
| `quanly01` | Quản lý trung tâm | TTBH Mekong Cần Thơ |
| `letan02` | Nhân viên tiếp nhận | TTBH Mekong Vĩnh Long |

Biến môi trường: bảng đầy đủ ở Deployment Guide mục 3. Khi triển khai thật phải đổi `DB_PASSWORD` và đặt `JWT_SECRET` ≥ 32 ký tự (giữ giá trị mẫu thì server tự sinh khoá tạm – BUG-06). Không commit file `.env`.

## 3. Phát triển trên máy (không bắt buộc)

Cần Node.js 20+. Bật riêng CSDL có mở cổng 127.0.0.1:5432 rồi chạy Node trực tiếp:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
npm ci
npm run db:setup
npm run client:install && npm run client:build
npm start
```

Sửa giao diện có tự tải lại: terminal thứ hai `npm run client:dev`, vào http://localhost:5173.

## 4. Chạy kiểm thử

Trong container (cách người chấm dùng): `docker compose exec app npm test`. Trên máy: bật CSDL như mục 3 rồi:

```bash
npm test                 # toàn bộ 84 test: 72 unit + API, 12 test case hệ thống
npm run test:unit        # chỉ unit + API (72 test), không cần CSDL
npm run tc -- TC-05      # chạy và in chi tiết một test case của Test Report
```

- `tests/unit`, `tests/api`: 72 test dùng repository giả trong bộ nhớ.
- `tests/system`: 12 test case TC-01 … TC-12 gọi API thật với PostgreSQL thật, đủ năm loại. Dùng CSDL **riêng** `smartcrm_db_test` (tự tạo), mỗi test case tự `resetDb` + migrate + seed.
- Test Plan, Test Report: `docs/testing/`; ảnh: `docs/screenshots/`. CI: `.github/workflows/ci.yml` (job `test` và job `docker` chạy đúng hai lệnh của Deployment Guide).

## 5. Kiến trúc và cấu trúc thư mục

Kiến trúc phân lớp (đã nộp ở BT1, ảnh `docs/images/d-01-kien-truc.png`):

```
Presentation (client/ – React)  →  API (src/routes, src/controllers, src/middlewares)
   →  Nghiệp vụ (src/services, src/policies)  →  Truy cập dữ liệu (src/repositories)  →  PostgreSQL 16
```

```
smartcrm-2374802010489/
├── client/                    # Lớp trình bày – React + Vite
│   └── src/
│       ├── api/               # client.js (nơi DUY NHẤT gọi fetch) + *.api.js theo nghiệp vụ
│       ├── components/        # DataState (đang tải/rỗng/lỗi), Layout, Field, Badges
│       ├── pages/             # M1 TicketList, M2 TicketCreate, M3 TicketDetail, Login, Customers
│       └── auth/              # AuthContext: lưu token, xử lý 401
├── src/                       # Backend – Node.js + Express
│   ├── routes/                # Lớp API: định tuyến + phân quyền
│   ├── controllers/           # Lớp API: đọc req, gọi service, trả DTO (presenters.js = hợp đồng dữ liệu)
│   ├── middlewares/           # JWT, phân quyền vai trò, errorHandler (quy đổi mã lỗi → HTTP)
│   ├── services/              # Lớp nghiệp vụ: customer, device, ticket, auth (không biết req/res)
│   ├── policies/              # Quy tắc nghiệp vụ thuần: QT-02 SĐT, QT-04 SLA, QT-05 bảo hành
│   ├── repositories/          # Lớp truy cập dữ liệu: chỉ chứa câu SQL
│   ├── config/                # env.js, database.js (pool + transaction), sla.config.json (NFR6)
│   ├── container.js           # Lắp ráp repository → service → controller
│   ├── app.js / server.js
├── database/
│   ├── migrations/            # 001_init_schema.sql (8 bảng theo DDL BT1), 002_employee_auth.sql
│   └── seeds/                 # Dữ liệu mẫu, ON CONFLICT DO NOTHING
├── scripts/                   # migrate.js, seed.js, db-error.js (thông báo lỗi kết nối CSDL)
├── tests/                     # unit/, api/ (repository giả), system/ (TC-01…TC-12 trên CSDL thật)
├── docs/                      # thay-doi-thiet-ke.md, bug-log.md, testing/, screenshots/, images/
├── Dockerfile, docker-compose.yml, docker-compose.dev.yml, .env.example, .dockerignore
├── package.json, package-lock.json
```

## 6. Trạng thái hiện tại (buổi 16 – nộp BT3, tag `v1.0`)

- [x] BT2: migration 8 bảng, seed, CRUD khách hàng/thiết bị, tạo/xem/xét duyệt phiếu, JWT + phân quyền + phạm vi trung tâm, giao diện React 3 màn hình
- [x] Buổi 14: 12 test case hệ thống đủ 5 loại, sửa BUG-04, BUG-06 … BUG-09, CI GitHub Actions
- [x] Buổi 16: đóng gói Docker Compose (2 lệnh), `/health`, healthcheck, khởi tạo CSDL tự động; phép thử máy trắng đạt; sửa BUG-10, BUG-11; 84/84 test PASS trong container
- [x] Deployment Guide (EN), checklist bảo mật 7 mục, API docs 23 endpoint (EN)
- [ ] Nâng `react-router-dom` 7 / `vite` 6 để hết cảnh báo `npm audit` của giao diện (checklist mục 7)
- [ ] Redis cache danh mục (TD-09), in phiếu, xuất Excel, giao diện di động (TD-12), giới hạn đăng nhập sai

## 7. API chính (`/api/v1`)

| Phương thức | Đường dẫn | Vai trò | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | – | Đăng nhập, trả JWT |
| GET | `/health` (gốc, không token) · `/api/v1/health` | – | Kiểm tra hệ thống + CSDL |
| GET | `/customers?q=&page=` · `/customers/lookup?phone=` · `/customers/:id` | NV, QL | Tra cứu khách hàng (FR1) |
| POST / PUT / DELETE | `/customers` · `/customers/:id` | NV (POST), QL | Tạo / sửa / xoá khách hàng (FR2) |
| GET | `/devices/lookup?serial=` · `/devices/:id` | NV, QL | Tra cứu thiết bị + kết quả QT-05 |
| POST / PUT / DELETE | `/devices` · `/devices/:id` | NV, QL (DELETE) | Ghi nhận / sửa / xoá thiết bị (FR3) |
| GET | `/tickets?status=&priority=&slaState=&from=&to=&q=&page=` | NV, QL | Danh sách phiếu của trung tâm (FR8) |
| GET | `/tickets/:id` | NV, QL | Chi tiết + lịch sử trạng thái |
| GET | `/tickets/sla-preview?priority=` | NV, QL | Xem trước hạn SLA |
| POST | `/tickets` | NV | Tạo phiếu (FR4–FR6) |
| PATCH | `/tickets/:id/review` | QL | Xét duyệt phiếu chờ xác minh (FR7) |

Đầy đủ 23 endpoint, mỗi endpoint 7 mục kèm ví dụ chạy thật: [docs/api-docs.md](docs/api-docs.md). Lỗi luôn trả JSON `{ "error": "<MA_LOI>", "message": "...", "details": { "<truong>": "..." } }` với mã 400 / 401 / 403 / 404 / 409 / 503.

## 8. Tài liệu

- `docs/deployment-guide.md` – Deployment Guide (tiếng Anh, BT3)
- `docs/checklist-bao-mat.md` – checklist bảo mật 7 mục, có minh chứng
- `docs/api-docs.md` – API docs (tiếng Anh, track SE)

- `docs/thay-doi-thiet-ke.md` – nhật ký thay đổi thiết kế (TD-01 … TD-21)
- `docs/bug-log.md` – nhật ký lỗi BUG-01 … BUG-11, mỗi bug kèm link commit sửa
- `docs/testing/test-plan.md`, `docs/testing/test-report.md` – Test Plan và Test Report buổi 14
- `docs/screenshots/` – ảnh chụp chạy thật: phép thử máy trắng BT3 (`bt3-01` … `bt3-07`), checklist bảo mật (`sec-1` … `sec-7`), từng test case (`TC-xx.png`, lần 1 trong `lan-1/`), bug (`BUG-xx-truoc.png`, `BUG-xx-fixed.png`)
- `docs/ai-disclosure.md` – khai báo sử dụng công cụ AI
- `docs/images/` – ảnh chụp kết quả chạy thật
