# Nhật ký thay đổi thiết kế

Sinh viên: Nguyễn Hoàng Thuận · MSSV 2374802010489 · Track SE · Luồng L2 (Tiếp nhận và phân loại yêu cầu bảo hành)

> File này được đọc lại khi chấm BT2 và BT3 (tiêu chí 3: Nhất quán & Tích lũy).
> Mỗi thay đổi có mã TD-xx và đủ bốn dòng: phản hồi — quyết định — lý do — ảnh hưởng.

## Sau phản hồi Bài tập 1 (buổi 8)

### TD-01 Sửa link repo trên trang bìa và đẩy đủ tài liệu gốc
- Phản hồi của GV : Link GitHub trên trang bìa trỏ sai tới `/actions/new`; repo rỗng (0 commit), thiếu file gốc `.drawio` và `srs.md`.
- Quyết định      : SỬA
- Lý do           : Repo là minh chứng bắt buộc cho mọi bài tập sau; giảng viên phải clone được.
- Ảnh hưởng       : Sửa trang bìa; khởi tạo repo theo cấu trúc chuẩn; đẩy `docs/*.drawio`, `docs/srs.md`.

### TD-02 Rút gọn phạm vi còn 7 User Story / 8 FR
- Phản hồi của GV : 13 US và 13 FR vượt giới hạn 5–7 US của một luồng.
- Quyết định      : SỬA
- Lý do           : Đúng phạm vi luồng L2; các chức năng phụ được gộp thành quy tắc nghiệp vụ hoặc tiêu chí GWT.
- Ảnh hưởng       : Cập nhật mục 1.3 SRS, bảng RTM, sơ đồ Use Case (UC01–UC08).

### TD-03 Vẽ lại sơ đồ bằng công cụ đồ hoạ
- Phản hồi của GV : Sơ đồ Use Case, kiến trúc, ERD, wireframe vẽ bằng ký tự ASCII.
- Quyết định      : SỬA
- Lý do           : Sơ đồ ASCII khó đọc và không đúng ký hiệu UML.
- Ảnh hưởng       : Vẽ lại trên draw.io, có bảng chú thích ký hiệu (legend); lưu file gốc trong `docs/`.

### TD-04 Bổ sung khoá ngoại còn thiếu
- Phản hồi của GV : Thiếu FK tại `ticket_status_log.changed_by` và `device.product_id`.
- Quyết định      : SỬA
- Lý do           : Không có FK thì CSDL chấp nhận nhân viên / sản phẩm không tồn tại.
- Ảnh hưởng       : `changed_by → employee(employee_id)`, `product_id → product(product_id)` trong `001_init_schema.sql`.

### TD-05 Bổ sung bảng `product`
- Phản hồi của GV : Wireframe hiển thị "Tên máy/Model" nhưng bảng `device` không có cột lưu thông tin này.
- Quyết định      : SỬA
- Lý do           : Tên máy lặp lại cho nhiều thiết bị → tách bảng để đạt 3NF.
- Ảnh hưởng       : Thêm bảng `product (product_id, product_name, brand, model_code)`; cập nhật ERD và từ điển dữ liệu.

### TD-06 Bổ sung khai báo sử dụng AI và cam kết liêm chính
- Phản hồi của GV : Thiếu bảng khai báo công cụ AI và cam kết liêm chính học thuật.
- Quyết định      : SỬA
- Lý do           : Bắt buộc theo chính sách học phần.
- Ảnh hưởng       : Thêm Phụ lục B trong báo cáo và tệp `docs/ai-disclosure.md`.

### TD-07 Sửa số bảng trong ERD từ "7 bảng" thành 8 bảng
- Phản hồi của GV : (Tự rà soát khi dựng migration) Báo cáo ghi "ERD 7 bảng" nhưng DDL có 8 bảng (thêm `issue_category`).
- Quyết định      : SỬA
- Lý do           : Mô tả phải khớp DDL; `issue_category` là bảng danh mục cần cho QT-A1 (ưu tiên mặc định theo nhóm sự cố).
- Ảnh hưởng       : Sửa chữ "7 bảng" thành "8 bảng" trong SRS và ERD; DDL không đổi.

### TD-08 Thêm cột đăng nhập vào bảng `employee`
- Phản hồi của GV : (Tự rà soát) NFR4 yêu cầu JWT nhưng bảng `employee` không có cột nào để xác thực.
- Quyết định      : SỬA
- Lý do           : Không có tên đăng nhập và mật khẩu băm thì không cấp được JWT, không phân biệt được vai trò RECEPTIONIST / MANAGER.
- Ảnh hưởng       : Migration `002_employee_auth.sql` thêm `username UNIQUE`, `password_hash` (bcrypt). Không thay đổi các bảng khác.

### TD-09 Giữ nguyên PostgreSQL, KHÔNG dùng Redis ở prototype
- Phản hồi của GV : (Tự rà soát) Sơ đồ kiến trúc có Redis cache cho `issue_category`.
- Quyết định      : GIỮ NGUYÊN sơ đồ (Redis ghi rõ là tuỳ chọn), KHÔNG hiện thực ở BT2
- Lý do           : Bảng `issue_category` chỉ có 6 dòng; truy vấn có chỉ mục mất < 5 ms nên chưa cần cache. Thêm Redis làm tăng một thành phần phải cài khi giảng viên clone repo (C1).
- Ảnh hưởng       : Không. Ghi chú trong README mục 6.

## Trong Sprint 2 (buổi 10)

### TD-10 Phiếu bảo hành chỉ có Tạo – Xem – Xét duyệt, không có Sửa/Xoá
- Phản hồi của GV : (Tự rà soát) BT2 yêu cầu "≥ 2 thực thể đủ CRUD".
- Quyết định      : GIỮ NGUYÊN quy tắc bất biến của phiếu; đủ CRUD được hiện thực cho `customer` và `device`
- Lý do           : SRS mục WON'T đã chốt "không sửa nội dung lỗi hoặc xoá phiếu sau khi tạo" (audit trail). Thay đổi duy nhất được phép trên phiếu là xét duyệt (UC07) và được ghi vào `ticket_status_log`.
- Ảnh hưởng       : API `/customers` và `/devices` có đủ GET/POST/PUT/DELETE; `/tickets` có GET/POST và `PATCH /tickets/:id/review`.

### TD-11 Phiếu "Từ chối bảo hành" chuyển sang trạng thái MOI với `is_warranty = false`
- Phản hồi của GV : (Tự rà soát) QT-A3 ghi "chuyển phiếu sang trạng thái Mới" cho cả Chấp nhận lẫn Từ chối, nên không phân biệt được hai kết quả.
- Quyết định      : SỬA cách lưu kết quả
- Lý do           : Dùng cột `is_warranty` đã có trong DDL: Chấp nhận → `true` (bảo hành miễn phí), Từ chối → `false` (sửa chữa tính phí). Không cần thêm trạng thái mới nên CHECK của cột `status` giữ nguyên.
- Ảnh hưởng       : `ticket.service.reviewTicket`; dòng log ghi rõ quyết định và ghi chú.

### TD-12 Cắt bớt phạm vi giao diện
- Phản hồi của GV : (Tự quyết định khi thiếu thời gian, theo hướng dẫn buổi 10)
- Quyết định      : CẮT có ghi nhận
- Lý do           : Ưu tiên luồng chính chạy end-to-end, test và README. Phần bị cắt: in phiếu ra giấy, xuất Excel, giao diện cho thiết bị di động.
- Ảnh hưởng       : Không ảnh hưởng FR1–FR8.

## Buổi 12 (hoàn thiện BT2)

### TD-13 Thêm màn hình quản lý khách hàng (tính năng phụ)
- Phản hồi của GV : (Buổi 12 cho phép thêm ≥ 1 tính năng phụ nếu luồng chính đã ổn định)
- Quyết định      : THÊM
- Lý do           : Dùng lại API CRUD `/customers` đã có; giúp nhân viên sửa SĐT/họ tên nhập sai mà không cần vào CSDL.
- Ảnh hưởng       : Thêm `client/src/pages/CustomersPage.jsx`; không đổi backend.

## Sau phản hồi Bài tập 2 (buổi 14)

Phản hồi riêng của giảng viên cho BT2 (06/11/2026): repo chỉ có 3 tệp PDF và một thư mục submodule rỗng, không lấy được mã nguồn nên C1, C2, C4, C5 chưa đạt; thiếu tag `v0.2`. Ngoài ra đối chiếu sáu lỗi phổ biến giảng viên nêu ở buổi 14 (bảng cuối mục này).

### TD-14 Đẩy mã nguồn trực tiếp vào repo, bỏ submodule rỗng, tạo tag v0.2
- Phản hồi của GV : Repo chỉ có 3 PDF + thư mục submodule rỗng (không có `.gitmodules`); thiếu tag v0.2.
- Quyết định      : SỬA (đã làm ở commit `e81a922`, ghi thành BUG-05)
- Lý do           : Giảng viên chấm bằng `git clone --branch v0.2`; mã nguồn phải nằm trực tiếp trong repo.
- Ảnh hưởng       : Mã nguồn ở gốc repo, README chạy được ngay sau `cd`; tag `v0.2` trỏ tới `e81a922`. Không đổi chức năng.

### TD-15 Thêm tầng test hệ thống chạy trên PostgreSQL thật
- Phản hồi của GV : (Buổi 14) "Test quá ít, chỉ test luồng đúng" là lỗi phổ biến; BT3 yêu cầu 10–12 test case chạy thật, đủ năm loại.
- Quyết định      : SỬA – thêm `tests/system/` (12 test case TC-01…TC-12) gọi API thật với CSDL thật; giữ nguyên 61 test unit/API cũ.
- Lý do           : Test cũ dùng repository giả nên không bắt được lỗi nằm ở ranh giới ứng dụng ↔ CSDL (kiểu dữ liệu DATE, múi giờ, giới hạn BIGINT) – đúng ba trong năm bug của đợt này.
- Ảnh hưởng       : `npm test` nay cần PostgreSQL đang chạy (`docker compose up -d db`); dùng CSDL riêng `<tên>_test` nên không xoá dữ liệu dev. `npm run test:unit` vẫn chạy không cần CSDL. Thêm `npm run tc -- TC-xx` để chạy lại một test case khi giảng viên chọn.

### TD-16 Múi giờ: giữ cột TIMESTAMP, đặt múi giờ phiên CSDL theo ứng dụng
- Phản hồi của GV : (Tự phát hiện qua TC-11 – BUG-08)
- Quyết định      : SỬA tạm ở tầng kết nối; CHƯA đổi kiểu cột
- Lý do           : Đổi 4 cột sang `TIMESTAMPTZ` cần migration chuyển đổi dữ liệu và sửa ERD/DDL đã nộp ở BT1; trước hạn BT3 chọn cách ít rủi ro là đặt `TimeZone` của phiên = múi giờ tiến trình Node (một chỗ trong `src/config/database.js`).
- Ảnh hưởng       : Dữ liệu tạo trước bản sửa trong CSDL dev cần dựng lại (`docker compose down -v` → `npm run db:setup`). Đổi sang `TIMESTAMPTZ` ghi vào việc còn lại sau BT3.

### TD-17 Không dùng JWT_SECRET mẫu, sinh khoá tạm khi chưa cấu hình
- Phản hồi của GV : (Buổi 14) "Có secret trong lịch sử commit" là lỗi Critical phổ biến; repo BT3 phải PUBLIC.
- Quyết định      : SỬA (BUG-06)
- Lý do           : `.env.example` công khai nên giá trị mẫu của nó tương đương không có khoá. Chọn sinh khoá ngẫu nhiên tạm thời thay vì dừng server để README mục 3 vẫn chạy được nguyên văn (phép thử thư mục trống).
- Ảnh hưởng       : Chưa đặt khoá riêng thì phải đăng nhập lại sau mỗi lần khởi động server. Production bắt buộc đặt `JWT_SECRET` ≥ 32 ký tự.

### Đối chiếu sáu lỗi phổ biến của lớp (buổi 14)

| Lỗi phổ biến | Tình trạng repo này | Quyết định |
|---|---|---|
| Clone theo README không chạy được | Đã gặp: repo BT2 không có mã (BUG-05); `db:setup` báo lỗi rỗng trên Windows (BUG-04) | SỬA – TD-14, BUG-04 |
| Chưa commit tệp khoá phiên bản | `package-lock.json` và `client/package-lock.json` đã có trong repo; README dùng `npm ci` | GIỮ NGUYÊN |
| Test quá ít, chỉ luồng đúng | 46 test cũ chưa có tầng hệ thống, chưa có bảo mật/tái lập | SỬA – TD-15 (73 test, đủ 5 loại) |
| Service chứa req/res hoặc SQL | Đã kiểm: `src/services` không có `req`, `res`, `query(` (ảnh `docs/images/t-09-kiem-tra-tach-lop.png`) | GIỮ NGUYÊN |
| Có secret trong lịch sử commit | Lịch sử chỉ có `.env.example`, không có `.env` (`git log --all -- .env` rỗng). Nhưng khoá mẫu được server chấp nhận | SỬA – TD-17, BUG-06 |
| Nhận xét sinh viên không đồng ý | Không có | – |
