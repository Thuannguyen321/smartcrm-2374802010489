# Khai báo sử dụng công cụ AI

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489

| Công cụ | Việc AI đã làm | Tệp / hàm liên quan | Cách sinh viên kiểm chứng |
|---|---|---|---|
| Claude (Anthropic) | Đề xuất và viết mã nguồn backend theo kiến trúc phân lớp đã thiết kế ở BT1 | `src/**` (services, policies, repositories, controllers) | Đọc lại từng hàm, đối chiếu với QT-02/03/04/05/A1/A3 trong SRS; chạy curl từng endpoint; chạy `npm test` |
| Claude (Anthropic) | Viết giao diện React 3 màn hình + đăng nhập + màn hình khách hàng | `client/src/**` | Chạy luồng chính trên trình duyệt với dữ liệu mẫu; tắt backend để kiểm tra trạng thái lỗi |
| Claude (Anthropic) | Viết bộ test Jest/supertest và repository giả | `tests/**` | Cố ý sửa sai quy tắc (vd đổi `<=` thành `<` trong QT-05) để thấy test FAIL, rồi hoàn tác |
| Claude (Anthropic) | Soạn nháp README, bug-log, báo cáo buổi 8 và buổi 10 | `README.md`, `docs/*.md` | Clone repo vào thư mục mới và làm đúng từng bước README mục 3 |
| Claude (Anthropic) | Buổi 14: viết 12 test case hệ thống và trình chạy `npm run tc`; chạy lần 1 tìm bug; đề xuất bản sửa BUG-04, BUG-06 … BUG-09; soạn Test Plan, Test Report, Bug Log, TD-14 … TD-17, CI; dựng ảnh chụp từ kết quả chạy | `tests/system/**`, `src/config/env.js`, `src/config/database.js`, `src/policies/warranty.policy.js`, `src/utils/validate.js`, `scripts/db-error.js`, `docs/**`, `.github/workflows/ci.yml` | Đọc lại từng bản sửa; chạy `npm test` và `npm run tc -- TC-xx` trên máy cá nhân; đối chiếu ảnh chụp với kết quả chạy lại |

Cam kết: em đã đọc, hiểu và chịu trách nhiệm về toàn bộ mã nguồn và tài liệu nộp; em giải thích được từng hàm khi giảng viên hỏi.
