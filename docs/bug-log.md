# Nhật ký lỗi (bug log)

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489 · Track SE

| Mã | Mức độ | Tóm tắt | Commit sửa | Trạng thái |
|---|---|---|---|---|
| BUG-01 … BUG-03 | – | Lỗi gỡ trong Giai đoạn 2 (BT2), xem phần 1 | trong `e81a922` | Đã sửa |
| BUG-04 | Minor | `db:setup` báo lỗi rỗng khi CSDL chưa chạy (Windows) | [`7ab898b`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/7ab898b51081bb7a9b3e81cb3ab920ebd8b44e1f) | Đã sửa |
| BUG-05 | Major | Repo BT2 chỉ có submodule rỗng, thiếu tag v0.2 (giảng viên phát hiện) | [`e81a922`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/e81a922a088a811a351efaa188a7a1cf266aed16) | Đã sửa |
| BUG-06 | **Critical** | Ký được token MANAGER bằng `JWT_SECRET` mẫu công khai | [`6db3173`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/6db31733940cdd339406ace2a7b4316eb3e3b576) | Đã sửa |
| BUG-07 | **Major** | Ngày cuối bảo hành bị kết luận HẾT bảo hành (lùi 1 ngày ở giờ VN) | [`7f73f51`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/7f73f51ee4894e3827b66354a7c30d611f8313b7) | Đã sửa |
| BUG-08 | **Major** | Giờ ghi log lệch 7 tiếng, trạng thái SLA phiếu mẫu sai | [`19716d8`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/19716d8f07f2b152125bc153a5a93d5c7332bac9) | Đã sửa |
| BUG-09 | Minor | Mã phiếu vượt phạm vi BIGINT trả 500 thay vì 400 | [`283cd2b`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/283cd2bbd3e57fdfa588426c4b052ea9f6bd2edb) | Đã sửa |

**Cách phân loại mức độ** (ba câu hỏi): (1) người dùng còn làm được việc không; (2) dữ liệu có bị sai hoặc lộ không; (3) có cách làm tạm không.
Critical = lộ dữ liệu hoặc leo quyền, không cần điều kiện đặc biệt · Major = dữ liệu/quyết định nghiệp vụ sai hoặc người khác không dựng được hệ thống · Minor = sai thông báo/mã lỗi, dữ liệu không hỏng, có cách làm tạm.

## Phần 1 – Giai đoạn 2 (BT2)

Mỗi lỗi ghi đủ 7 dòng: hiện tượng · tái lập · khoanh vùng · nguyên nhân · cách sửa · xác nhận · loại lỗi.

## BUG-01 `ticketId` trả về dạng chuỗi trong API tạo phiếu
- Hiện tượng   : `POST /tickets` trả `"ticketId": "11"` (chuỗi) trong khi `GET /tickets` trả `ticketId: 5` (số).
- Tái lập      : Gọi `curl -X POST /api/v1/tickets ...` với dữ liệu hợp lệ, xem JSON trả về.
- Khoanh vùng  : Danh sách đi qua `presenters.ticketSummaryDto` (có `Number()`), còn API tạo phiếu trả thẳng giá trị từ `ticketRepo.insertTicket`.
- Nguyên nhân  : Thư viện `pg` trả cột BIGSERIAL (int8) về dạng chuỗi để không mất độ chính xác.
- Cách sửa     : `ticket.repository.insertTicket` đổi `rows[0].ticket_id` sang `Number(...)`; thêm test API kiểm tra `typeof ticketId === 'number'`.
- Xác nhận     : `npm test` – test "[luong dung] tao phieu -> 201 va ma phieu" PASS; curl trả `"ticketId": 13`.
- Loại lỗi     : Hợp đồng dữ liệu (hai đầu hiểu khác nhau về kiểu dữ liệu).

## BUG-02 Tắt backend thì giao diện báo "HTTP 500" khó hiểu
- Hiện tượng   : Khi tắt backend và chạy giao diện qua Vite, màn hình danh sách báo "Máy chủ không phản hồi đúng (HTTP 500)".
- Tái lập      : `npm run client:dev`, đăng nhập, tắt `npm start`, bấm F5 ở trang danh sách.
- Khoanh vùng  : `fetch()` không ném lỗi mạng vì Vite proxy vẫn sống; proxy trả 500 với body rỗng nên nhánh `!payload` được dùng.
- Nguyên nhân  : `client.js` chỉ coi lỗi mạng (fetch ném lỗi) là mất kết nối, bỏ sót trường hợp có proxy đứng trước backend.
- Cách sửa     : Mọi phản hồi lỗi không có JSON được quy về mã `KHONG_KET_NOI` với câu hướng dẫn "Kiểm tra backend đã chạy chưa rồi bấm Thử lại".
- Xác nhận     : Ảnh `docs/images/ui-17-loi-tat-backend.png` (thông báo mới) và `ui-18-thu-lai-thanh-cong.png` (bật lại backend, bấm Thử lại, tải được dữ liệu).
- Loại lỗi     : Logic xử lý lỗi ở lớp trình bày.

## BUG-03 Lọc theo mã phiếu/SĐT dùng sai số thứ tự tham số SQL
- Hiện tượng   : Lọc đồng thời `q` và `slaState` trả kết quả sai (điều kiện `q` so với giá trị thời gian).
- Tái lập      : `GET /tickets?q=BH&slaState=TRE_HAN`.
- Khoanh vùng  : Hàm `ticket.repository.list` – điều kiện `(t.ticket_code ILIKE ? OR c.phone LIKE ?)` có hai dấu `?`.
- Nguyên nhân  : Bản đầu chỉ thay dấu `?` đầu tiên bằng `$n`, dấu thứ hai được thay sau cùng bằng số thứ tự của tham số CUỐI.
- Cách sửa     : Dùng `replaceAll('?', '$n')` ngay khi thêm điều kiện để mọi `?` trong một điều kiện dùng chung một tham số.
- Xác nhận     : `GET /tickets?q=BH&slaState=TRE_HAN` chỉ trả phiếu BH-000001/2026 (đã trễ hạn).
- Loại lỗi     : Logic.

## Phần 2 – Giai đoạn 3 (buổi 14, kiểm thử hệ thống)

Mẫu bảy dòng buổi 13: mã và mức độ · phát hiện bởi · triệu chứng · cách tái lập · nguyên nhân · cách sửa · commit và xác nhận. Mỗi bug một commit riêng (`fix(phạm-vi): ... (BUG-xx)`).

### BUG-04 · Minor · `npm run db:setup` báo lỗi rỗng khi PostgreSQL chưa chạy
1. **Mã và mức độ:** BUG-04 · Minor – người dùng vẫn dựng được hệ thống sau khi bật Docker (có cách làm tạm), dữ liệu không ảnh hưởng; nhưng thông báo rỗng khiến người mới không biết phải làm gì.
2. **Phát hiện bởi:** Sinh viên, khi làm lại README mục 3 trên máy Windows (PowerShell) ngày 06/11/2026, quên bật Docker Desktop.
3. **Triệu chứng:** Terminal chỉ in `[migrate] THAT BAI: ` rồi dừng, không có mã lỗi hay lý do.
4. **Cách tái lập:** Tắt PostgreSQL/Docker Desktop → `npm run db:setup` trên Windows với `DATABASE_URL=...@localhost:5432/...`.
5. **Nguyên nhân:** Trên Windows `localhost` phân giải ra cả `::1` và `127.0.0.1`; cả hai đều bị từ chối nên `pg` ném `AggregateError` có `message` rỗng, mã lỗi nằm trong `err.errors[]`. `scripts/migrate.js`, `scripts/seed.js` chỉ in `err.message`.
6. **Cách sửa:** Thêm `scripts/db-error.js` (`moTaLoiCsdl`) lấy mã lỗi từ `err.code` hoặc `err.errors[]` và in kèm gợi ý (ECONNREFUSED → `docker compose up -d db`; 28P01 → sai mật khẩu; 3D000 → chưa tạo CSDL). Thêm `tests/unit/db-error.test.js` (3 test).
7. **Commit và xác nhận:** [`7ab898b`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/7ab898b51081bb7a9b3e81cb3ab920ebd8b44e1f) · chạy với cổng sai in `[ECONNREFUSED] ... -> PostgreSQL chua chay ...`; 3 unit test PASS – [ảnh BUG-04-fixed.png](screenshots/BUG-04-fixed.png).

### BUG-05 · Major · Repo BT2 không có mã nguồn (submodule rỗng), thiếu tag v0.2
1. **Mã và mức độ:** BUG-05 · Major – người khác (giảng viên) không lấy được mã nguồn, không dựng được hệ thống.
2. **Phát hiện bởi:** Giảng viên, khi chấm BT2 (nhận xét ngày 06/11/2026).
3. **Triệu chứng:** Repo chỉ có 3 tệp PDF và thư mục `smartcrm-2374802010489` không mở được; `git clone --branch v0.2` báo không có tag.
4. **Cách tái lập:** `git clone <repo> thu-nghiem` (bản trước 06/11) → `ls thu-nghiem/smartcrm-2374802010489` rỗng.
5. **Nguyên nhân:** Thư mục mã nguồn có `.git` riêng (`git init` lồng bên trong) nên repo ngoài chỉ lưu con trỏ commit (gitlink, mode 160000), không có `.gitmodules`; chưa từng `git push origin v0.2`.
6. **Cách sửa:** Bỏ repo lồng, đặt mã nguồn trực tiếp ở gốc repo, commit, tạo và đẩy tag `v0.2` (quyết định ở TD-14).
7. **Commit và xác nhận:** [`e81a922`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/e81a922a088a811a351efaa188a7a1cf266aed16) · clone mới thấy đủ `src/`, `tests/`, `docs/`; tag `v0.2` trỏ tới commit này. (Commit này đẩy toàn bộ mã nguồn nên không phải commit sửa một dòng; các bug BUG-04, 06–09 mới là commit riêng của đợt buổi 14.)

### BUG-06 · Critical · Token giả mạo được chấp nhận vì dùng `JWT_SECRET` mẫu công khai
1. **Mã và mức độ:** BUG-06 · Critical – bất kỳ ai đọc repo PUBLIC đều tự ký được token vai trò MANAGER, xem đủ SĐT khách hàng và xét duyệt/xoá dữ liệu mà không cần mật khẩu; không có cách làm tạm nào trong README.
2. **Phát hiện bởi:** Sinh viên, test case bảo mật **TC-10** (lần 1: FAIL).
3. **Triệu chứng:** `GET /api/v1/customers` với token tự ký → **200**, trả 6 khách hàng kèm SĐT đầy đủ (vd `0966555666`) – [ảnh lần 1](screenshots/lan-1/TC-10.png).
4. **Cách tái lập:** Làm đúng README (`cp .env.example .env`, không sửa) → `npm start` → ký JWT `{role:"MANAGER", centerId:1}` bằng chuỗi `doi-thanh-chuoi-bi-mat-cua-ban` → gọi API với token đó. Tự động: `npm run tc -- TC-10`.
5. **Nguyên nhân:** `src/config/env.js` chỉ kiểm `JWT_SECRET` có giá trị hay không, chấp nhận cả giá trị mẫu trong `.env.example` (công khai trên GitHub).
6. **Cách sửa:** `env.jwtSecret()` từ chối giá trị mẫu và khoá < 32 ký tự: sinh khoá ngẫu nhiên tạm thời cho tiến trình và in cảnh báo hướng dẫn tạo khoá riêng; ghi chú rõ trong `.env.example`. Thêm `tests/unit/env.test.js` (3 test).
7. **Commit và xác nhận:** [`6db3173`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/6db31733940cdd339406ace2a7b4316eb3e3b576) · TC-10 chạy lại → **401 CHUA_DANG_NHAP**, 0 khách hàng trả về – [ảnh BUG-06-fixed.png](screenshots/BUG-06-fixed.png); `npm test` 73/73 PASS.

### BUG-07 · Major · Thiết bị còn đúng ngày cuối bảo hành bị kết luận HẾT bảo hành
1. **Mã và mức độ:** BUG-07 · Major – quyết định nghiệp vụ sai và lưu sai vào CSDL (`is_warranty = false`): khách đáng được bảo hành miễn phí bị chuyển sang sửa tính phí; nhân viên không có cách nhận ra để làm tạm.
2. **Phát hiện bởi:** Sinh viên, test case giá trị biên **TC-03** và **TC-04** (lần 1: FAIL).
3. **Triệu chứng:** Thiết bị mua 07/11/2025, bảo hành 12 tháng, tiếp nhận 07/11/2026 → `HET_BAO_HANH`, `warrantyEndDate=2026-11-06`, `isWarranty=false` (mong đợi `CON_BAO_HANH`, `2026-11-07`) – [ảnh lần 1 TC-03](screenshots/lan-1/TC-03.png).
4. **Cách tái lập:** Máy chạy giờ Việt Nam (UTC+7) → tạo thiết bị có `purchaseDate` = hôm nay − 12 tháng → tạo phiếu. Tự động: `npm run tc -- TC-03 TC-04`. (Máy chạy giờ UTC không thấy lỗi – lý do unit test cũ dùng chuỗi ngày vẫn PASS.)
5. **Nguyên nhân:** `pg` trả cột DATE về `Date` lúc 00:00 giờ địa phương; `toDateOnly()` trong `warranty.policy.js` dùng `toISOString()` (UTC) → 00:00 ngày 07/11 giờ VN thành 17:00 ngày 06/11 UTC → ngày mua lùi 1 ngày.
6. **Cách sửa:** `toDateOnly()` đọc ngày/tháng/năm theo lịch địa phương (`getFullYear/getMonth/getDate`). Thêm 2 unit test biên với `Date` từ CSDL.
7. **Commit và xác nhận:** [`7f73f51`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/7f73f51ee4894e3827b66354a7c30d611f8313b7) · TC-03 → `CON_BAO_HANH`, hạn `2026-11-07`; TC-04 → `HET_BAO_HANH`, hạn `2026-11-06` – [ảnh BUG-07-fixed.png](screenshots/BUG-07-fixed.png).

### BUG-08 · Major · Giờ ghi lịch sử trạng thái lệch 7 tiếng, trạng thái SLA phiếu mẫu sai
1. **Mã và mức độ:** BUG-08 · Major – dữ liệu thời gian sai: lịch sử phiếu cho thấy phiếu được "tạo" trước khi được tiếp nhận 7 giờ; bộ lọc "Sắp trễ / Trễ hạn" (FR8) xếp sai phiếu → quản lý xử lý sai thứ tự ưu tiên.
2. **Phát hiện bởi:** Sinh viên, test case chất lượng dữ liệu **TC-11** (lần 1: FAIL).
3. **Triệu chứng:** `receivedAt=2026-11-07T00:46:29Z` nhưng `logs[0].changedAt=2026-11-06T17:46:29Z` (lệch −25200 giây); phiếu mẫu `BH-000002` hạn còn 2 giờ hiện `TRE_HAN` thay vì `SAP_TRE` – [ảnh lần 1](screenshots/lan-1/TC-11.png).
4. **Cách tái lập:** CSDL bằng Docker (`postgres:16-alpine`, múi giờ UTC) + ứng dụng chạy giờ VN → `npm run db:setup` → tạo phiếu → xem chi tiết. Tự động: `npm run tc -- TC-11`.
5. **Nguyên nhân:** Các cột kiểu `TIMESTAMP` (không múi giờ). Node ghi/đọc `Date` theo giờ địa phương (VN), còn `DEFAULT CURRENT_TIMESTAMP` (`ticket_status_log.changed_at`) và dữ liệu seed tính theo múi giờ phiên CSDL (UTC) → hai nguồn lệch nhau 7 giờ.
6. **Cách sửa:** `src/config/database.js` đặt `TimeZone` của mọi phiên CSDL bằng múi giờ của tiến trình Node (`-c TimeZone=<+07>-07`). Thêm `tests/unit/database.timezone.test.js` (3 test). Hướng lâu dài (đổi sang `TIMESTAMPTZ`) ghi ở TD-16. Lưu ý: CSDL dev đã có dữ liệu cũ cần dựng lại (`docker compose down -v` rồi `npm run db:setup`).
7. **Commit và xác nhận:** [`19716d8`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/19716d8f07f2b152125bc153a5a93d5c7332bac9) · TC-11 → lệch 0 giây, `BH-000002` = `SAP_TRE` – [ảnh BUG-08-fixed.png](screenshots/BUG-08-fixed.png).

### BUG-09 · Minor · Mã phiếu vượt phạm vi BIGINT trả 500 thay vì 400
1. **Mã và mức độ:** BUG-09 · Minor – chỉ xảy ra khi nhập mã sai cố ý; dữ liệu không hỏng, nhưng trả sai mã lỗi (500 "Lỗi hệ thống") và ghi stack trace vào log server.
2. **Phát hiện bởi:** Sinh viên, test case dữ liệu sai **TC-08** (lần 1: FAIL).
3. **Triệu chứng:** `GET /api/v1/tickets/99999999999999999999` → **500 LOI_HE_THONG**; log server: `value "100000000000000000000" is out of range for type bigint` (mã 22003) – [ảnh lần 1](screenshots/lan-1/TC-08.png).
4. **Cách tái lập:** Đăng nhập `letan01` → gọi đường dẫn trên. Tự động: `npm run tc -- TC-08`.
5. **Nguyên nhân:** `toPositiveInt()` (`src/utils/validate.js`) chỉ kiểm `Number.isInteger`, không giới hạn trên; số vượt BIGINT đi thẳng xuống PostgreSQL. `categoryId` (cột INT) có cùng lỗ hổng.
6. **Cách sửa:** Chỉ nhận số nguyên an toàn của JS (`Number.isSafeInteger`), thêm tham số `max`; `categoryId` giới hạn 2147483647. Thêm `tests/unit/validate.test.js` (4 test).
7. **Commit và xác nhận:** [`283cd2b`](https://github.com/Thuannguyen321/smartcrm-2374802010489/commit/283cd2bbd3e57fdfa588426c4b052ea9f6bd2edb) · TC-08 → `/999999` 404, `/99999999999999999999` **400 DU_LIEU_KHONG_HOP_LE** – [ảnh BUG-09-fixed.png](screenshots/BUG-09-fixed.png).

