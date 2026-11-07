# Smart CRM – Mekong Mobile · Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Chuyên đề tốt nghiệp 1 · HK1 2026–2027 · Track **SE**
Sinh viên: **Nguyễn Hoàng Thuận** · MSSV **2374802010489** · Lớp học phần 0303

## 1. Giới thiệu

Module số hoá khâu tiếp nhận bảo hành tại quầy của Mekong Mobile: tra cứu / tạo khách hàng theo SĐT, ghi nhận thiết bị theo Serial/IMEI, tạo phiếu bảo hành có mã duy nhất, tự kiểm tra điều kiện bảo hành (QT-05), tự tính hạn SLA theo giờ làm việc (QT-04), quản lý trung tâm xét duyệt phiếu thiếu ngày mua (QT-A3) và theo dõi danh sách phiếu theo tình trạng SLA.

Luồng chính (UC04): Nhân viên nhập SĐT → tra cứu khách (tạo mới nếu chưa có) → nhập Serial/IMEI → tra cứu thiết bị (ghi nhận nếu chưa có) → chọn nhóm sự cố, hệ thống gợi ý mức ưu tiên và hạn SLA → bấm **Tạo phiếu** → hệ thống ghi phiếu + dòng lịch sử trạng thái trong một transaction và trả mã phiếu `BH-xxxxxx/YYYY`.

## 2. Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | 20 LTS trở lên (đã thử 20 và 22) | kèm npm 10 |
| PostgreSQL | 16 | chạy bằng Docker (khuyên dùng) hoặc cài trực tiếp |
| Docker Desktop | bất kỳ bản mới | chỉ cần nếu chạy CSDL bằng `docker compose` |
| Trình duyệt | Chrome / Edge / Firefox bản mới | |

Biến môi trường: xem `.env.example` (`DATABASE_URL`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`). Không commit file `.env`.

## 3. Các bước dựng hệ thống (mỗi bước một lệnh)

Chạy lần lượt trong terminal, tại thư mục gốc của repo:

```bash
# 1. Lấy mã nguồn đúng phiên bản nộp BT2
git clone --branch v0.2 https://github.com/Thuannguyen321/smartcrm-2374802010489.git && cd smartcrm-2374802010489

# 2. Tạo file cấu hình (Windows PowerShell: copy .env.example .env)
cp .env.example .env

# 3. Bật PostgreSQL 16 bằng Docker (đã cài PostgreSQL sẵn thì bỏ qua, sửa DATABASE_URL trong .env)
docker compose up -d db

# 4. Cài thư viện backend (theo package-lock.json)
npm ci

# 5. Tạo 8 bảng + nạp dữ liệu mẫu (chạy lại nhiều lần không nhân đôi dữ liệu)
npm run db:setup

# 6. Cài thư viện và build giao diện React
npm run client:install && npm run client:build

# 7. Chạy hệ thống, mở http://localhost:3000
npm start
```

Tài khoản demo (mật khẩu chung `Mekong@2026`):

| Tên đăng nhập | Vai trò | Trung tâm |
|---|---|---|
| `letan01` | Nhân viên tiếp nhận | TTBH Mekong Cần Thơ |
| `quanly01` | Quản lý trung tâm | TTBH Mekong Cần Thơ |
| `letan02` | Nhân viên tiếp nhận | TTBH Mekong Vĩnh Long |

Chế độ phát triển (sửa giao diện có tự tải lại): mở terminal thứ hai, chạy `npm run client:dev` rồi vào http://localhost:5173 (Vite chuyển tiếp `/api` sang cổng 3000).

Nên đặt `JWT_SECRET` riêng trong `.env` (≥ 32 ký tự, tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Nếu giữ giá trị mẫu, server tự sinh khoá tạm và phải đăng nhập lại sau mỗi lần khởi động (BUG-06).

Nếu cài PostgreSQL trực tiếp (không dùng Docker), tạo user và CSDL một lần:

```sql
CREATE USER smartcrm WITH PASSWORD 'smartcrm_dev' CREATEDB;
CREATE DATABASE smartcrm_db OWNER smartcrm;
```

## 4. Chạy kiểm thử

Cần PostgreSQL đang chạy (bước 3 ở mục 3) và file `.env`:

```bash
npm test                 # toàn bộ 73 test: unit + API + 12 test case hệ thống
npm run test:unit        # chỉ unit + API (61 test), không cần CSDL
npm run tc -- TC-05      # chạy và in chi tiết một test case của Test Report
```

- `tests/unit`, `tests/api`: 61 test dùng repository giả trong bộ nhớ.
- `tests/system`: 12 test case TC-01 … TC-12 gọi API thật với PostgreSQL thật, đủ năm loại (luồng đúng · biên · dữ liệu sai · bảo mật/chất lượng dữ liệu · tái lập). Dùng CSDL **riêng** `smartcrm_db_test` (tự tạo), mỗi test case tự `resetDb` + migrate + seed nên không đụng tới dữ liệu ở `smartcrm_db`. Ứng dụng chạy giờ Việt Nam trong test (`TC_TZ` để đổi).
- Test Plan, Test Report, ảnh chụp: `docs/testing/`, `docs/screenshots/`. CI: `.github/workflows/ci.yml`.

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
├── docker-compose.yml, .env.example, package.json, package-lock.json
```

## 6. Trạng thái hiện tại (buổi 12 – nộp BT2, tag `v0.2`)

- [x] Migration 8 bảng đúng DDL BT1 + 002 thêm cột đăng nhập (TD-08); chạy lại không lỗi (bảng `schema_migrations`)
- [x] Seed danh mục, nhân viên, khách hàng, thiết bị, phiếu mẫu; chạy lại không nhân đôi (C5)
- [x] CRUD đầy đủ cho **khách hàng** và **thiết bị**; phiếu bảo hành: tạo, xem danh sách/chi tiết, xét duyệt (không sửa/xoá theo TD-10)
- [x] QT-02 chuẩn hoá SĐT, QT-03 Serial thuộc 1 khách, QT-05 bảo hành, QT-04 SLA theo giờ làm việc đọc từ `sla.config.json`, QT-A1 ưu tiên mặc định, QT-A3 xét duyệt
- [x] Tạo phiếu + log trong một transaction, mã phiếu từ SEQUENCE (NFR2, NFR5)
- [x] JWT + phân quyền vai trò + phạm vi trung tâm; che SĐT cho nhân viên tiếp nhận (NFR4)
- [x] Giao diện React: đăng nhập, M1 danh sách + lọc + phân trang, M2 tiếp nhận 4 bước, M3 chi tiết + xét duyệt, màn hình khách hàng (tính năng phụ TD-13)
- [x] Mọi màn hình bọc `DataState` (đang tải · rỗng · lỗi + nút Thử lại); nhận 401 → xoá token, về trang đăng nhập
- [x] Buổi 14: 73 test PASS bằng `npm test` (gồm 12 test case hệ thống trên PostgreSQL thật); sửa BUG-04, BUG-06 … BUG-09; CI GitHub Actions
- [x] Đã thử clone vào thư mục mới và chạy theo mục 3
- [ ] Redis cache danh mục: chưa làm (TD-09, chưa cần với 6 dòng danh mục)
- [ ] In phiếu, xuất Excel, giao diện di động: cắt khỏi phạm vi BT2 (TD-12)

## 7. API chính (`/api/v1`)

| Phương thức | Đường dẫn | Vai trò | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | – | Đăng nhập, trả JWT |
| GET | `/customers?q=&page=` · `/customers/lookup?phone=` · `/customers/:id` | NV, QL | Tra cứu khách hàng (FR1) |
| POST / PUT / DELETE | `/customers` · `/customers/:id` | NV (POST), QL | Tạo / sửa / xoá khách hàng (FR2) |
| GET | `/devices/lookup?serial=` · `/devices/:id` | NV, QL | Tra cứu thiết bị + kết quả QT-05 |
| POST / PUT / DELETE | `/devices` · `/devices/:id` | NV, QL (DELETE) | Ghi nhận / sửa / xoá thiết bị (FR3) |
| GET | `/tickets?status=&priority=&slaState=&from=&to=&q=&page=` | NV, QL | Danh sách phiếu của trung tâm (FR8) |
| GET | `/tickets/:id` | NV, QL | Chi tiết + lịch sử trạng thái |
| GET | `/tickets/sla-preview?priority=` | NV, QL | Xem trước hạn SLA |
| POST | `/tickets` | NV | Tạo phiếu (FR4–FR6) |
| PATCH | `/tickets/:id/review` | QL | Xét duyệt phiếu chờ xác minh (FR7) |

Lỗi luôn trả JSON `{ "error": "<MA_LOI>", "message": "...", "details": { "<truong>": "..." } }` với mã 400 / 401 / 403 / 404 / 409 / 503.

## 8. Tài liệu

- `docs/thay-doi-thiet-ke.md` – nhật ký thay đổi thiết kế (TD-01 … TD-17)
- `docs/bug-log.md` – nhật ký lỗi BUG-01 … BUG-09, mỗi bug kèm link commit sửa
- `docs/testing/test-plan.md`, `docs/testing/test-report.md` – Test Plan và Test Report buổi 14
- `docs/screenshots/` – ảnh chụp kết quả chạy từng test case (`TC-xx.png`, lần 1 trong `lan-1/`) và xác nhận sửa bug (`BUG-xx-fixed.png`)
- `docs/ai-disclosure.md` – khai báo sử dụng công cụ AI
- `docs/images/` – ảnh chụp kết quả chạy thật
