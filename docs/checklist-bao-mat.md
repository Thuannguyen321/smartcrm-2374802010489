# Checklist bảo mật – Smart CRM, luồng L2 (BT3, tag v1.0)

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489 · Track SE
Cách làm: mỗi mục tự kiểm bằng lệnh hoặc test chạy thật trên hệ thống đã đóng gói (`docker compose up -d --build`, ngày 13/11/2026), ghi trạng thái **ĐÃ LÀM / CHƯA LÀM / KHÔNG ÁP DỤNG** kèm một dòng minh chứng. Ảnh chụp kết quả lệnh nằm trong `docs/screenshots/sec-*.png`.

| # | Mục (OWASP Top 10:2025) | Trạng thái | Minh chứng (một dòng) | Ảnh |
|---|---|---|---|---|
| 1 | Không có secret nào trong repo (A02) | **ĐÃ LÀM** | `git log --all --oneline -- .env` → rỗng; `git check-ignore -v .env` → `.gitignore:4:.env`; grep `password/secret/api_key = "..."` trong `src/ scripts/ client/src/` chỉ ra `password: ''` (ô nhập rỗng của form đăng nhập) | `sec-1.png` |
| 2 | Dữ liệu vào được kiểm ở tầng ứng dụng (A05) | **ĐÃ LÀM** | Mọi câu SQL dùng tham số `$1, $2…` (grep `${req.` / `+ req.` trong repositories, services → rỗng); gửi `q=' OR '1'='1` → 0 khách hàng; SĐT `' OR '1'='1` → 400; TC-05, TC-06 (dữ liệu sai → 400) PASS | `sec-2.png` |
| 3 | Kiểm soát truy cập theo chủ sở hữu (A01) | **ĐÃ LÀM** | TC-09: nhân viên trung tâm Vĩnh Long mở phiếu của trung tâm Cần Thơ → 403 `KHONG_DU_QUYEN`, danh sách total 0 – PASS; TC-10: token giả ký bằng `JWT_SECRET` mẫu → 401 – PASS | `sec-3.png` |
| 4 | Mật khẩu, dữ liệu nhạy cảm băm/mã hoá (A04 · A07) | **ĐÃ LÀM** | `SELECT username, password_hash FROM employee` → chuỗi `$2a$10$…` (bcrypt, cost 10), không đọc được mật khẩu; SĐT khách hàng bị che `090****567` với vai trò tiếp nhận (NFR4) | `sec-4.png` |
| 5 | Thông báo lỗi không lộ cấu trúc bên trong (A10 · A02) | **ĐÃ LÀM** | JSON hỏng → 400 `"Body không phải JSON hợp lệ"`; tắt CSDL rồi gọi API → 503 `CSDL_KHONG_SAN_SANG` (trước đây 500 – BUG-11), `/health` → 503 `{"db":"down"}`; không có stack, tên bảng, chuỗi kết nối trong phản hồi | `sec-5.png` |
| 6 | Nhật ký không ghi secret, dữ liệu cá nhân (A09) | **ĐÃ LÀM** | Sau khi gọi API với `?q=0901234567` và tắt CSDL: `docker compose logs app \| grep -iE "password\|token\|bearer\|0[0-9]{9}"` → rỗng; log lỗi chỉ ghi phương thức + đường dẫn + mã lỗi (`[error] GET /api/v1/tickets - CSDL khong san sang (ENOTFOUND)`) | `sec-6.png` |
| 7 | Phụ thuộc ghim phiên bản, đã kiểm lỗ hổng (A03) | **CHƯA LÀM xong** | Đã ghim: `package-lock.json`, `client/package-lock.json`, image `node:20-alpine`, `postgres:16-alpine`; `npm audit --omit=dev` (backend) → **0 lỗ hổng**. Còn lại: giao diện `react-router-dom` 6.30 – 2 cảnh báo *moderate* (bản sửa là 7.x, đổi API); công cụ dev `vite`/`esbuild` (1 *high*, chỉ ảnh hưởng dev server, không có trong image) và `jest` (6 *low*). Kế hoạch: nâng `vite` 6 và `react-router-dom` 7 sau BT3, chạy lại UI test tay | `sec-7.png` |

## Ghi chú trung thực

- Mục 4: ba tài khoản demo dùng chung **một** chuỗi băm (cùng muối) vì seed nạp sẵn một hash cho mật khẩu demo `Mekong@2026`. Đây là dữ liệu mẫu; hệ thống chưa có chức năng tạo nhân viên/đổi mật khẩu nên chưa có hash riêng cho từng người. Khi có chức năng đó, mỗi lần băm `bcrypt.hash()` sinh muối riêng.
- Mục 3: phạm vi theo **trung tâm** chỉ áp cho phiếu bảo hành. Khách hàng và thiết bị dùng chung giữa các trung tâm (một khách mang máy tới trung tâm nào cũng được) – đây là quyết định nghiệp vụ (SRS NFR4), nhân viên tiếp nhận chỉ thấy SĐT đã che.
- Mục 1: `docker-compose.yml`, `.github/workflows/ci.yml` và `.env.example` chứa mật khẩu CSDL **mẫu** `smartcrm_dev` dùng cho môi trường thử/CI, không phải secret thật; Deployment Guide mục 3 ghi rõ phải đổi khi triển khai thật. `JWT_SECRET` mẫu bị ứng dụng từ chối dùng (BUG-06).
- Chưa có giới hạn số lần đăng nhập sai (rate limit) – ghi vào việc còn lại, thuộc phạm vi CĐTN2.
- **Cập nhật 19/11/2026 (sau v1.0, DevSecOps):** mục 1 và mục 7 nay được kiểm **tự động ở mỗi lần push/PR** trong job `security` của `.github/workflows/ci.yml`: `gitleaks` quét secret trong các commit mới (giá trị mẫu được phép liệt kê ở `.gitleaks.toml`), `npm audit --omit=dev --audit-level=high` cho backend và `client/`. Mọi GitHub Action ghim theo commit SHA, token CI chỉ có quyền `contents: read`; `.github/dependabot.yml` mở PR nâng thư viện/action/image hằng tuần. Mục 7 vẫn **CHƯA LÀM xong** cho tới khi nâng `react-router-dom` 7 và `vite` 6.
- Điền checklist bằng cách chạy thử đã phát hiện thêm hai bug thật: **BUG-10 (Major)** app dừng hẳn khi CSDL khởi động lại, **BUG-11 (Minor)** CSDL mất kết nối trả 500 và ghi query string vào log. Cả hai đã sửa, xem `docs/bug-log.md`.
