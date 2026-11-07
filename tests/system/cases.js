// 12 test case he thong cua Test Report buoi 14 (docs/testing/test-report.md).
// Moi case: tien dieu kien = CSDL trong + migrate + seed (resetDb), roi chay DUNG cac buoc da ghi.
// Ham run() tra { thucTe, pass }: thucTe ghi cu the ma trang thai, ma loi, dem ban ghi truoc/sau.
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const API = '/api/v1';
const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** So khop ket qua: moi dieu kien sai duoc ghi lai -> FAIL neu co bat ky dieu kien nao sai. */
function judge(parts, checks) {
  const sai = checks.filter(([ok]) => !ok).map(([, msg]) => msg);
  return { thucTe: parts.join(' · '), pass: sai.length === 0, sai };
}

async function ticketIdByCode(ctx, code) {
  return Number((await ctx.one('SELECT ticket_id FROM ticket WHERE ticket_code = $1', [code])).ticket_id);
}

/** Tao thiet bi bien cho TC-03/TC-04 qua API (nhu nhan vien tiep nhan ghi nhan thiet bi). */
async function taoThietBi(ctx, token, serialNo, purchaseDate) {
  const kh = await ctx.one("SELECT customer_id FROM customer WHERE phone = '0977333444'");
  const sp = await ctx.one("SELECT product_id FROM product WHERE model_code = 'SS-A55'");
  const res = await ctx.api.post(`${API}/devices`).set(auth(token)).send({
    customerId: Number(kh.customer_id), productId: Number(sp.product_id), serialNo, purchaseDate, warrantyMonths: 12,
  });
  if (res.status !== 201) throw new Error(`Khong tao duoc thiet bi ${serialNo}: ${res.status} ${JSON.stringify(res.body)}`);
}

const CASES = [
  {
    id: 'TC-01', loai: 'Luồng đúng', uuTien: 'Cao', nguon: 'UC04 / FR4',
    tieuDe: 'Tạo phiếu bảo hành với dữ liệu hợp lệ',
    tienDieuKien: 'resetDb + seed; KH 0901234567 sở hữu SN-IP15-2026-88 (mua 3 tháng trước, BH 12 tháng)',
    buoc: 'Đăng nhập letan01 → POST /api/v1/tickets {phone:0901234567, serialNo:SN-IP15-2026-88, categoryId:1, issueDesc:"Màn hình bị sọc ngang"}',
    mongDoi: '201; mã BH-xxxxxx/YYYY; status MOI; priority CAO (QT-A1); CON_BAO_HANH; ticket +1; ticket_status_log +1',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const t0 = await ctx.count('ticket'); const l0 = await ctx.count('ticket_status_log');
      const res = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '0901234567', serialNo: 'SN-IP15-2026-88', categoryId: 1, issueDesc: 'Màn hình bị sọc ngang' });
      const t1 = await ctx.count('ticket'); const l1 = await ctx.count('ticket_status_log');
      const d = res.body.data || {};
      return judge(
        [`${res.status}`, `ticketCode=${d.ticketCode}`, `status=${d.status}`, `priority=${d.priority}`, `${d.warrantyResult}`,
          `ticket ${t0}->${t1}`, `ticket_status_log ${l0}->${l1}`],
        [[res.status === 201, 'ma trang thai'], [/^BH-\d{6}\/\d{4}$/.test(d.ticketCode || ''), 'ma phieu'],
          [d.status === 'MOI', 'status'], [d.priority === 'CAO', 'priority'], [d.warrantyResult === 'CON_BAO_HANH', 'bao hanh'],
          [t1 === t0 + 1, 'so phieu'], [l1 === l0 + 1, 'so log']]
      );
    },
  },
  {
    id: 'TC-02', loai: 'Luồng đúng', uuTien: 'Cao', nguon: 'UC07 / QT-A3',
    tieuDe: 'Quản lý chấp nhận bảo hành phiếu "Chờ xác minh"',
    tienDieuKien: 'resetDb + seed; phiếu BH-000004/2026 đang CHO_XAC_MINH, có 1 dòng log',
    buoc: 'Đăng nhập quanly01 → PATCH /api/v1/tickets/{id BH-000004}/review {decision:CHAP_NHAN, note:"Khách xuất trình hoá đơn mua hàng"}',
    mongDoi: '200; status MOI; isWarranty true; log của phiếu 1→2; trong bảng ticket status = MOI',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'quanly01');
      const id = await ticketIdByCode(ctx, 'BH-000004/2026');
      const l0 = await ctx.count('ticket_status_log', 'WHERE ticket_id = $1', [id]);
      const res = await ctx.api.patch(`${API}/tickets/${id}/review`).set(auth(token))
        .send({ decision: 'CHAP_NHAN', note: 'Khách xuất trình hoá đơn mua hàng' });
      const l1 = await ctx.count('ticket_status_log', 'WHERE ticket_id = $1', [id]);
      const row = await ctx.one('SELECT status, is_warranty FROM ticket WHERE ticket_id = $1', [id]);
      const d = res.body.data || {};
      return judge(
        [`${res.status}`, `status=${d.status}`, `isWarranty=${d.isWarranty}`, `log ${l0}->${l1}`, `CSDL status=${row.status}, is_warranty=${row.is_warranty}`],
        [[res.status === 200, 'ma trang thai'], [d.status === 'MOI', 'status'], [d.isWarranty === true, 'isWarranty'],
          [l1 === l0 + 1, 'so log'], [row.status === 'MOI' && row.is_warranty === true, 'CSDL']]
      );
    },
  },
  {
    id: 'TC-03', loai: 'Giá trị biên', uuTien: 'Cao', nguon: 'QT-05 (biên trên)',
    tieuDe: 'Tiếp nhận đúng NGÀY CUỐI bảo hành → còn bảo hành',
    tienDieuKien: 'resetDb + seed; tạo thiết bị SN-TC03-BIEN mua đúng 12 tháng trước hôm nay (giờ VN), BH 12 tháng → hết hạn = hôm nay',
    buoc: 'letan01: POST /api/v1/devices (thiết bị trên) → POST /api/v1/tickets {phone:0977333444, serialNo:SN-TC03-BIEN, categoryId:2, issueDesc:"Pin chai nhanh"}',
    mongDoi: '201; warrantyResult CON_BAO_HANH; warrantyEndDate = hôm nay; isWarranty true',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const homNay = ctx.localDate();
      const ngayMua = ctx.addMonthsIso(homNay, -12);
      await taoThietBi(ctx, token, 'SN-TC03-BIEN', ngayMua);
      const res = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '0977333444', serialNo: 'SN-TC03-BIEN', categoryId: 2, issueDesc: 'Pin chai nhanh' });
      const d = res.body.data || {};
      return judge(
        [`hôm nay=${homNay}`, `ngày mua=${ngayMua}`, `${res.status}`, `${d.warrantyResult}`, `warrantyEndDate=${d.warrantyEndDate}`, `isWarranty=${d.isWarranty}`],
        [[res.status === 201, 'ma trang thai'], [d.warrantyResult === 'CON_BAO_HANH', 'ket qua BH'],
          [d.warrantyEndDate === homNay, 'ngay het han'], [d.isWarranty === true, 'isWarranty']]
      );
    },
  },
  {
    id: 'TC-04', loai: 'Giá trị biên', uuTien: 'Cao', nguon: 'QT-05 (biên ngoài)',
    tieuDe: 'Tiếp nhận SAU ngày hết hạn 1 ngày → hết bảo hành',
    tienDieuKien: 'resetDb + seed; thiết bị SN-TC04-BIEN mua 12 tháng + 1 ngày trước hôm nay → hết hạn = hôm qua',
    buoc: 'letan01: POST /api/v1/devices → POST /api/v1/tickets {phone:0977333444, serialNo:SN-TC04-BIEN, categoryId:2, issueDesc:"Pin chai nhanh"}',
    mongDoi: '201; warrantyResult HET_BAO_HANH; warrantyEndDate = hôm qua; isWarranty false; status MOI',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const homNay = ctx.localDate();
      const homQua = ctx.addDaysIso(homNay, -1);
      const ngayMua = ctx.addDaysIso(ctx.addMonthsIso(homNay, -12), -1);
      await taoThietBi(ctx, token, 'SN-TC04-BIEN', ngayMua);
      const res = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '0977333444', serialNo: 'SN-TC04-BIEN', categoryId: 2, issueDesc: 'Pin chai nhanh' });
      const d = res.body.data || {};
      return judge(
        [`hôm nay=${homNay}`, `ngày mua=${ngayMua}`, `${res.status}`, `${d.warrantyResult}`, `warrantyEndDate=${d.warrantyEndDate}`, `isWarranty=${d.isWarranty}`, `status=${d.status}`],
        [[res.status === 201, 'ma trang thai'], [d.warrantyResult === 'HET_BAO_HANH', 'ket qua BH'],
          [d.warrantyEndDate === homQua, 'ngay het han'], [d.isWarranty === false, 'isWarranty'], [d.status === 'MOI', 'status']]
      );
    },
  },
  {
    id: 'TC-05', loai: 'Giá trị biên', uuTien: 'Trung bình', nguon: 'FR4 – mô tả lỗi ≥ 5 ký tự',
    tieuDe: 'Mô tả lỗi 4 ký tự bị từ chối, 5 ký tự được nhận',
    tienDieuKien: 'resetDb + seed',
    buoc: 'letan01: POST /api/v1/tickets (KH 0912345678, SN-S24-2026-15, categoryId 2) lần 1 issueDesc="Hỏng" (4), lần 2 issueDesc="Hỏng!" (5)',
    mongDoi: 'Lần 1: 400 DU_LIEU_KHONG_HOP_LE, details.issueDesc, ticket không đổi; lần 2: 201, ticket +1',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const base = { phone: '0912345678', serialNo: 'SN-S24-2026-15', categoryId: 2 };
      const t0 = await ctx.count('ticket');
      const r4 = await ctx.api.post(`${API}/tickets`).set(auth(token)).send({ ...base, issueDesc: 'Hỏng' });
      const t1 = await ctx.count('ticket');
      const r5 = await ctx.api.post(`${API}/tickets`).set(auth(token)).send({ ...base, issueDesc: 'Hỏng!' });
      const t2 = await ctx.count('ticket');
      return judge(
        [`4 ký tự: ${r4.status} ${r4.body.error} details.issueDesc="${r4.body.details?.issueDesc}" ticket ${t0}->${t1}`,
          `5 ký tự: ${r5.status} ${r5.body.data?.ticketCode} ticket ${t1}->${t2}`],
        [[r4.status === 400 && r4.body.error === 'DU_LIEU_KHONG_HOP_LE' && !!r4.body.details?.issueDesc, 'lan 1'],
          [t1 === t0, 'khong them ban ghi'], [r5.status === 201, 'lan 2'], [t2 === t1 + 1, 'them 1 ban ghi']]
      );
    },
  },
  {
    id: 'TC-06', loai: 'Dữ liệu sai', uuTien: 'Cao', nguon: 'QT-02',
    tieuDe: 'SĐT 9 chữ số → 400, nêu rõ trường phone, không ghi phiếu',
    tienDieuKien: 'resetDb + seed',
    buoc: 'letan01: POST /api/v1/tickets {phone:"090123456", serialNo:SN-IP15-2026-88, categoryId:1, issueDesc:"Màn hình bị sọc"}',
    mongDoi: '400 DU_LIEU_KHONG_HOP_LE; details.phone có nội dung; ticket và ticket_status_log không đổi',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const t0 = await ctx.count('ticket'); const l0 = await ctx.count('ticket_status_log');
      const res = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '090123456', serialNo: 'SN-IP15-2026-88', categoryId: 1, issueDesc: 'Màn hình bị sọc' });
      const t1 = await ctx.count('ticket'); const l1 = await ctx.count('ticket_status_log');
      return judge(
        [`${res.status}`, `${res.body.error}`, `details.phone="${res.body.details?.phone}"`, `ticket ${t0}->${t1}`, `log ${l0}->${l1}`],
        [[res.status === 400, 'ma trang thai'], [res.body.error === 'DU_LIEU_KHONG_HOP_LE', 'ma loi'],
          [!!res.body.details?.phone, 'truong loi'], [t1 === t0 && l1 === l0, 'tac dung phu']]
      );
    },
  },
  {
    id: 'TC-07', loai: 'Dữ liệu sai', uuTien: 'Cao', nguon: 'QT-03',
    tieuDe: 'Serial thuộc khách hàng khác → 409, không ghi phiếu',
    tienDieuKien: 'resetDb + seed; SN-IP15-2026-88 thuộc KH 0901234567',
    buoc: 'letan01: POST /api/v1/tickets {phone:0912345678, serialNo:SN-IP15-2026-88, categoryId:1, issueDesc:"Màn hình bị sọc"}',
    mongDoi: '409 XUNG_DOT, thông báo nêu QT-03; ticket không đổi',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const t0 = await ctx.count('ticket');
      const res = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '0912345678', serialNo: 'SN-IP15-2026-88', categoryId: 1, issueDesc: 'Màn hình bị sọc' });
      const t1 = await ctx.count('ticket');
      return judge(
        [`${res.status}`, `${res.body.error}`, `"${res.body.message}"`, `ticket ${t0}->${t1}`],
        [[res.status === 409, 'ma trang thai'], [res.body.error === 'XUNG_DOT', 'ma loi'],
          [/QT-03/.test(res.body.message || ''), 'thong bao'], [t1 === t0, 'tac dung phu']]
      );
    },
  },
  {
    id: 'TC-08', loai: 'Dữ liệu sai', uuTien: 'Trung bình', nguon: 'UC08 – id không tồn tại',
    tieuDe: 'Mã phiếu không tồn tại / vượt phạm vi → 404 / 400, KHÔNG 500',
    tienDieuKien: 'resetDb + seed (5 phiếu mẫu)',
    buoc: 'letan01: GET /api/v1/tickets/999999 ; GET /api/v1/tickets/99999999999999999999',
    mongDoi: 'Lần 1: 404 KHONG_TIM_THAY; lần 2: 400 DU_LIEU_KHONG_HOP_LE (không phải 500 LOI_HE_THONG)',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const r1 = await ctx.api.get(`${API}/tickets/999999`).set(auth(token));
      const r2 = await ctx.api.get(`${API}/tickets/99999999999999999999`).set(auth(token));
      return judge(
        [`/999999 → ${r1.status} ${r1.body.error}`, `/99999999999999999999 → ${r2.status} ${r2.body.error}`],
        [[r1.status === 404 && r1.body.error === 'KHONG_TIM_THAY', 'id khong ton tai'],
          [r2.status === 400 && r2.body.error === 'DU_LIEU_KHONG_HOP_LE', 'id vuot pham vi']]
      );
    },
  },
  {
    id: 'TC-09', loai: 'Bảo mật', uuTien: 'Cao', nguon: 'NFR4 – phạm vi trung tâm',
    tieuDe: 'Nhân viên trung tâm khác không xem được phiếu',
    tienDieuKien: 'resetDb + seed; BH-000001/2026 thuộc TTBH Cần Thơ; letan02 thuộc TTBH Vĩnh Long',
    buoc: 'Đăng nhập letan02 → GET /api/v1/tickets/{id BH-000001} ; GET /api/v1/tickets?q=BH-000001',
    mongDoi: 'Chi tiết: 403 KHONG_DU_QUYEN, không trả dữ liệu phiếu; danh sách: total 0',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan02');
      const id = await ticketIdByCode(ctx, 'BH-000001/2026');
      const r1 = await ctx.api.get(`${API}/tickets/${id}`).set(auth(token));
      const r2 = await ctx.api.get(`${API}/tickets?q=BH-000001`).set(auth(token));
      return judge(
        [`chi tiết → ${r1.status} ${r1.body.error}, có data=${r1.body.data !== undefined}`, `danh sách → ${r2.status} total=${r2.body.meta?.total}`],
        [[r1.status === 403 && r1.body.error === 'KHONG_DU_QUYEN' && r1.body.data === undefined, 'chi tiet'],
          [r2.status === 200 && r2.body.meta?.total === 0, 'danh sach']]
      );
    },
  },
  {
    id: 'TC-10', loai: 'Bảo mật', uuTien: 'Cao', nguon: 'NFR4 – JWT',
    tieuDe: 'Token giả mạo ký bằng JWT_SECRET mẫu trong .env.example bị từ chối',
    tienDieuKien: 'resetDb + seed; cấu hình đúng README mục 3 bước 2 (copy .env.example .env, giữ nguyên JWT_SECRET mẫu)',
    buoc: 'Tự ký JWT {role:MANAGER, centerId:1} bằng chuỗi JWT_SECRET công khai trong .env.example → GET /api/v1/customers với token đó',
    mongDoi: '401 CHUA_DANG_NHAP; không trả danh sách khách hàng (SĐT đầy đủ)',
    async run(ctx) {
      const example = fs.readFileSync(path.join(__dirname, '..', '..', '.env.example'), 'utf8');
      const secretMau = (example.match(/^JWT_SECRET=(.*)$/m) || [])[1];
      const cu = process.env.JWT_SECRET;
      process.env.JWT_SECRET = secretMau;
      let res;
      try {
        const request = require('supertest');
        const api = request(ctx.buildRealApp());
        const gia = jwt.sign({ employeeId: 1, fullName: 'Ke gia mao', role: 'MANAGER', centerId: 1 }, secretMau, { expiresIn: '1h' });
        res = await api.get(`${API}/customers`).set(auth(gia));
      } finally {
        if (cu === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = cu;
      }
      const n = Array.isArray(res.body.data) ? res.body.data.length : 0;
      return judge(
        [`JWT_SECRET mẫu="${secretMau}"`, `${res.status} ${res.body.error || ''}`, `số khách hàng trả về=${n}`, n ? `vd phone=${res.body.data[0].phone}` : ''].filter(Boolean),
        [[res.status === 401 && res.body.error === 'CHUA_DANG_NHAP', 'phai tu choi'], [n === 0, 'khong lo du lieu']]
      );
    },
  },
  {
    id: 'TC-11', loai: 'Chất lượng dữ liệu', uuTien: 'Cao', nguon: 'NFR5 / QT-04',
    tieuDe: 'Thời điểm ghi log khớp thời điểm tiếp nhận; trạng thái SLA phiếu mẫu đúng',
    tienDieuKien: 'resetDb + seed (CSDL múi giờ mặc định của Docker = UTC, ứng dụng chạy giờ VN); BH-000002 có hạn SLA = lúc seed + 2 giờ',
    buoc: 'letan01: POST /api/v1/tickets (KH 0901234567, SN-IP15-2026-88) → GET /api/v1/tickets/{id}; GET /api/v1/tickets?q=BH-000002',
    mongDoi: '|logs[0].changedAt − receivedAt| ≤ 60 giây; BH-000002 slaState = SAP_TRE',
    async run(ctx) {
      const token = await ctx.login(ctx.api, 'letan01');
      const c = await ctx.api.post(`${API}/tickets`).set(auth(token))
        .send({ phone: '0901234567', serialNo: 'SN-IP15-2026-88', categoryId: 1, issueDesc: 'Màn hình bị sọc ngang' });
      const g = await ctx.api.get(`${API}/tickets/${c.body.data.ticketId}`).set(auth(token));
      const nhan = g.body.data.receivedAt; const log = g.body.data.logs[0]?.changedAt;
      const lechGiay = Math.round((new Date(log) - new Date(nhan)) / 1000);
      const l = await ctx.api.get(`${API}/tickets?q=BH-000002`).set(auth(token));
      const p2 = l.body.data[0] || {};
      return judge(
        [`receivedAt=${nhan}`, `log.changedAt=${log}`, `lệch ${lechGiay} giây`, `BH-000002 dueDate=${p2.dueDate} slaState=${p2.slaState}`],
        [[Math.abs(lechGiay) <= 60, 'lech thoi gian'], [p2.slaState === 'SAP_TRE', 'trang thai SLA']]
      );
    },
  },
  {
    id: 'TC-12', loai: 'Tái lập', uuTien: 'Cao', nguon: 'C5 – migration + seed',
    tieuDe: 'Chạy migration + seed lần hai không lỗi, không nhân đôi dữ liệu',
    tienDieuKien: 'resetDb + seed (đã chạy migrate + seed lần 1)',
    buoc: 'node scripts/migrate.js ; node scripts/seed.js (lần 2) → đếm 8 bảng trước/sau',
    mongDoi: 'Cả hai lệnh thoát mã 0; migrate in "bo qua" cho 2 file; số dòng 8 bảng giữ nguyên',
    async run(ctx) {
      const bang = ['service_center', 'employee', 'issue_category', 'product', 'customer', 'device', 'ticket', 'ticket_status_log'];
      const dem = async () => Promise.all(bang.map((b) => ctx.count(b)));
      const truoc = await dem();
      const m = ctx.runScript('migrate.js');
      const s = ctx.runScript('seed.js');
      const sau = await dem();
      const boQua = (m.out.match(/bo qua/g) || []).length;
      return judge(
        [`migrate exit=${m.code} (bỏ qua ${boQua} file)`, `seed exit=${s.code}`, `trước=[${truoc.join(',')}]`, `sau=[${sau.join(',')}]`],
        [[m.code === 0 && s.code === 0, 'ma thoat'], [boQua === 2, 'bo qua migration'], [truoc.join() === sau.join(), 'so dong']]
      );
    },
  },
];

module.exports = { CASES };
