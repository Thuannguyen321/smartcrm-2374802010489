# Khai báo sử dụng công cụ AI

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489

| Công cụ | Việc AI đã làm | Tệp / hàm liên quan | Cách sinh viên kiểm chứng |
|---|---|---|---|
| Claude (Anthropic) | Đề xuất và viết mã nguồn backend theo kiến trúc phân lớp đã thiết kế ở BT1 | `src/**` (services, policies, repositories, controllers) | Đọc lại từng hàm, đối chiếu với QT-02/03/04/05/A1/A3 trong SRS; chạy curl từng endpoint; chạy `npm test` |
| Claude (Anthropic) | Viết giao diện React 3 màn hình + đăng nhập + màn hình khách hàng | `client/src/**` | Chạy luồng chính trên trình duyệt với dữ liệu mẫu; tắt backend để kiểm tra trạng thái lỗi |
| Claude (Anthropic) | Viết bộ test Jest/supertest và repository giả | `tests/**` | Cố ý sửa sai quy tắc (vd đổi `<=` thành `<` trong QT-05) để thấy test FAIL, rồi hoàn tác |
| Claude (Anthropic) | Soạn nháp README, bug-log, báo cáo buổi 8 và buổi 10 | `README.md`, `docs/*.md` | Clone repo vào thư mục mới và làm đúng từng bước README mục 3 |
| Claude (Anthropic) | Buổi 14: viết 12 test case hệ thống và trình chạy `npm run tc`; chạy lần 1 tìm bug; đề xuất bản sửa BUG-04, BUG-06 … BUG-09; soạn Test Plan, Test Report, Bug Log, TD-14 … TD-17, CI; dựng ảnh chụp từ kết quả chạy | `tests/system/**`, `src/config/env.js`, `src/config/database.js`, `src/policies/warranty.policy.js`, `src/utils/validate.js`, `scripts/db-error.js`, `docs/**`, `.github/workflows/ci.yml` | Đọc lại từng bản sửa; chạy `npm test` và `npm run tc -- TC-xx` trên máy cá nhân; đối chiếu ảnh chụp với kết quả chạy lại |

## Giai đoạn 3 – buổi 16 (đóng gói, tài liệu, BT3)

| Công cụ | Việc AI đã làm | Tệp / hàm liên quan | Cách sinh viên kiểm chứng |
|---|---|---|---|
| Claude (Anthropic) | Viết `Dockerfile` hai giai đoạn, `docker-compose.yml` có healthcheck, `.env.example`, `.dockerignore`, `.gitattributes`, endpoint `GET /health`, job CI `docker` | `Dockerfile`, `docker-compose*.yml`, `.env.example`, `src/health.js`, `src/app.js`, `.github/workflows/ci.yml` | Chạy phép thử máy trắng: `docker compose down -v`, clone theo tag `v1.0` vào thư mục trống, `cp .env.example .env`, `docker compose up -d --build`, `docker compose ps` (healthy), `curl /health`, `docker compose exec app npm test` (84/84) – ảnh `docs/screenshots/bt3-*.png` |
| Claude (Anthropic) | Chạy thử checklist bảo mật, phát hiện và đề xuất bản sửa BUG-10 (pool thiếu `on('error')`), BUG-11 (lỗi kết nối CSDL trả 500) kèm unit test | `src/config/database.js`, `src/middlewares/errorHandler.js`, `tests/unit/database.pool-error.test.js`, `tests/unit/errorHandler.test.js` | Chạy test trên mã cũ thấy FAIL, trên mã mới PASS; tự `docker compose stop db` rồi gọi API để thấy 503 và app không chết |
| Claude (Anthropic) | Soạn Deployment Guide (tiếng Anh), checklist bảo mật, API docs 23 endpoint (ví dụ request/response sinh từ lần gọi thật), TD-18…TD-21, Bug Log BUG-10/11, báo cáo PDF BT3 | `docs/deployment-guide.md`, `docs/checklist-bao-mat.md`, `docs/api-docs.md`, `docs/thay-doi-thiet-ke.md`, `docs/bug-log.md` | Làm đúng từng bước Guide trên máy Windows của mình; đếm route trong `src/routes/index.js` (22) + `/health` = 23 endpoint trong tài liệu; gọi lại vài endpoint bằng curl so với ví dụ |

Cam kết: em đã đọc, hiểu và chịu trách nhiệm về toàn bộ mã nguồn và tài liệu nộp; em giải thích được từng hàm khi giảng viên hỏi.
