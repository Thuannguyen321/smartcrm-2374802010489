# Test Plan rút gọn – Smart CRM, luồng L2

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489 · Track SE · Buổi 14 (07/11/2026)
Liên quan: [Test Report](test-report.md) · [Bug Log](../bug-log.md) · ảnh chụp trong [`docs/screenshots/`](../screenshots/)

## 1. Phạm vi

**Kiểm thử:** backend API `/api/v1` chạy cùng PostgreSQL 16 thật, theo luồng L2:

| Chức năng | Use case / quy tắc | Test case |
|---|---|---|
| Tạo phiếu bảo hành | UC04, FR4–FR6, QT-02, QT-03, QT-04, QT-05, QT-A1 | TC-01, TC-03 … TC-07, TC-11 |
| Xét duyệt phiếu "Chờ xác minh" | UC07, QT-A3 | TC-02 |
| Xem chi tiết / danh sách phiếu | UC08, FR8 | TC-08, TC-09, TC-11 |
| Xác thực JWT, phạm vi trung tâm | NFR4 | TC-09, TC-10 |
| Dựng CSDL: migration + seed | C5 | TC-12 |

**Chủ ý KHÔNG kiểm thử ở đợt này (và lý do):**

- Giao diện React: đã kiểm tay ở BT2 (ảnh `docs/images/ui-*.png`); đợt này tập trung vào nghiệp vụ và dữ liệu, nơi lỗi gây hậu quả nặng nhất.
- Hiệu năng, tải đồng thời, khoá `FOR UPDATE` khi hai quản lý xét duyệt cùng lúc: cần công cụ tạo tải, ngoài phạm vi chuyên đề.
- Tương thích trình duyệt, giao diện di động, in phiếu, xuất Excel: đã cắt khỏi phạm vi (TD-12).
- Redis cache danh mục: không hiện thực (TD-09).
- CRUD khách hàng/thiết bị chi tiết: đã có unit test ở tầng service (`customer.service.test.js`); ở tầng hệ thống chỉ dùng API thiết bị làm bước chuẩn bị (TC-03, TC-04).

## 2. Loại test và số lượng mỗi tầng

| Tầng | Công cụ | Số test | Chạy bằng |
|---|---|---|---|
| Unit (policies, services, utils, scripts) | Jest | 55 | `npm test` hoặc `npm run test:unit` |
| API (route → controller → service, repository giả) | Jest + supertest | 6 | như trên |
| **Hệ thống** (API thật + PostgreSQL thật) – 12 test case của Test Report | Jest + supertest + pg | 12 | `npm test`, `npm run test:system`, hoặc `npm run tc -- TC-xx` |
| **Tổng** | | **73** | **`npm test` (một lệnh)** |

12 test case hệ thống chia đủ năm loại BT3 yêu cầu:

| Loại | Test case |
|---|---|
| Luồng đúng | TC-01, TC-02 |
| Giá trị biên (hai bên ranh giới) | TC-03 (đúng ngày hết hạn), TC-04 (sau hạn 1 ngày), TC-05 (mô tả 4 / 5 ký tự) |
| Dữ liệu sai | TC-06 (SĐT 9 số), TC-07 (Serial của khách khác), TC-08 (id không tồn tại / vượt phạm vi) |
| Bảo mật / chất lượng dữ liệu | TC-09 (trung tâm khác), TC-10 (token giả mạo), TC-11 (thời điểm log, trạng thái SLA) |
| Tái lập | TC-12 (migration + seed lần hai) |

**Kỹ thuật chọn dữ liệu:**

- *Phân vùng tương đương:* SĐT hợp lệ / sai định dạng; Serial cùng chủ / khác chủ; người dùng cùng trung tâm / khác trung tâm; token ký bằng khoá thật / khoá công khai.
- *Giá trị biên:* ngày tiếp nhận = ngày hết hạn bảo hành và = ngày hết hạn + 1 (QT-05); mô tả lỗi 4 và 5 ký tự (ngưỡng 5); mã phiếu 999999 (hợp lệ nhưng không có) và 99999999999999999999 (vượt BIGINT); `categoryId` 2147483647 / 2147483648 (cột INT, ở unit test).
- *Đoán lỗi theo môi trường:* ứng dụng chạy giờ Việt Nam, CSDL Docker chạy UTC → kiểm tra các giá trị ngày/giờ (TC-03, TC-04, TC-11).

## 3. Tiêu chí thành công (đo được)

1. 100% test case ưu tiên **Cao** PASS ở lần chạy cuối; mọi test case đều có ảnh chụp `docs/screenshots/TC-xx.png`.
2. `npm test` chạy một lệnh, **0 FAIL** (hiện tại 73/73).
3. Không còn bug Critical/Major ở trạng thái mở trong Bug Log.
4. Dữ liệu người dùng nhập sai không bao giờ gây 500: luôn là 400/404/409 kèm JSON `{error, message, details}`.
5. Mọi thao tác thất bại không để lại bản ghi: đếm bảng `ticket`, `ticket_status_log` trước/sau bằng nhau.
6. Chạy migration + seed lần hai: mã thoát 0, số dòng 8 bảng không đổi.

## 4. Môi trường và dữ liệu thử

- Node.js 20/22, PostgreSQL 16 (`docker compose up -d db`, image `postgres:16-alpine`, múi giờ CSDL mặc định UTC).
- Múi giờ tiến trình ứng dụng khi test: `Asia/Ho_Chi_Minh` (đặt trong `tests/system/global-setup.js`, giống máy Windows của sinh viên; đổi bằng biến `TC_TZ`).
- CSDL test **riêng**: `<tên CSDL trong DATABASE_URL>_test` (vd `smartcrm_db_test`), tự tạo nếu chưa có → không xoá dữ liệu đang dùng.
- Tiền điều kiện chung của mọi test case: `resetDb` (xoá schema) → `node scripts/migrate.js` → `node scripts/seed.js`.
- Dữ liệu seed: 3 trung tâm, 3 nhân viên (`letan01`, `quanly01` – Cần Thơ; `letan02` – Vĩnh Long; mật khẩu `Mekong@2026`), 6 khách hàng, 7 thiết bị, 5 phiếu mẫu `BH-000001/2026` … `BH-000005/2026`.
- Dữ liệu biên tạo trong test case, tính theo ngày chạy: `SN-TC03-BIEN` (mua đúng 12 tháng trước), `SN-TC04-BIEN` (12 tháng + 1 ngày).
- CI: `.github/workflows/ci.yml` chạy `npm test` với PostgreSQL 16 trên GitHub Actions ở mỗi lần push.
