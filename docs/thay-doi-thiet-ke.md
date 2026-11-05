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
