# Nhật ký lỗi (bug log) – Giai đoạn 2

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
