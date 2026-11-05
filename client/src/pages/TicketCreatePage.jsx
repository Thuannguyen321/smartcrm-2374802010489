// M2 - Tiep nhan & tao phieu bao hanh (UC01 -> UC02 -> UC03 -> UC05 -> UC04).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createCustomer, lookupCustomer } from '../api/customers.api';
import { createDevice, lookupDevice } from '../api/devices.api';
import { createTicket, previewSla } from '../api/tickets.api';
import { listCategories, listProducts } from '../api/catalog.api';
import DataState from '../components/DataState';
import Field from '../components/Field';
import { useAsync } from '../utils/useAsync';
import { PRIORITY_LABEL, WARRANTY_LABEL, fmtDate, fmtDateTime } from '../utils/format';

export default function TicketCreatePage() {
  const catalog = useAsync(() => Promise.all([listCategories(), listProducts()]), []);

  // Khung 1 - khach hang
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerMsg, setCustomerMsg] = useState(null);
  const [newCustomer, setNewCustomer] = useState(null); // { fullName } khi SDT chua co
  // Khung 2 - thiet bi
  const [serial, setSerial] = useState('');
  const [device, setDevice] = useState(null);
  const [deviceMsg, setDeviceMsg] = useState(null);
  const [newDevice, setNewDevice] = useState(null);
  // Khung 3 - su co
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  // Khung 4 - SLA + ket qua
  const [sla, setSla] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!priority) return setSla(null);
    previewSla(priority).then(setSla).catch(() => setSla(null));
  }, [priority]);

  const fieldErrors = (err) => setErrors(err.details || {});

  async function findCustomer(e) {
    e.preventDefault();
    setCustomer(null); setCustomerMsg(null); setNewCustomer(null); setErrors({});
    setDevice(null); setDeviceMsg(null); setNewDevice(null);
    try {
      setCustomer(await lookupCustomer(phone));
    } catch (err) {
      if (err.code === 'KHONG_TIM_THAY') {
        setCustomerMsg({ type: 'warn', text: 'Chưa có hồ sơ với SĐT này. Nhập họ tên để tạo hồ sơ mới (UC02).' });
        setNewCustomer({ fullName: '' });
      } else {
        fieldErrors(err);
        setCustomerMsg({ type: 'error', text: err.message });
      }
    }
  }

  async function saveCustomer(e) {
    e.preventDefault();
    try {
      setCustomer(await createCustomer({ fullName: newCustomer.fullName, phone }));
      setNewCustomer(null);
      setCustomerMsg({ type: 'ok', text: 'Đã tạo hồ sơ khách hàng mới.' });
      setErrors({});
    } catch (err) {
      fieldErrors(err);
      setCustomerMsg({ type: 'error', text: err.message });
    }
  }

  async function findDevice(e) {
    e.preventDefault();
    setDevice(null); setDeviceMsg(null); setNewDevice(null); setErrors({});
    try {
      const d = await lookupDevice(serial);
      if (d.customerId !== customer.customerId) {
        setDeviceMsg({ type: 'error', text: `Serial/IMEI này đã thuộc khách hàng khác (${d.customerName}) — QT-03.` });
        return;
      }
      setDevice(d);
    } catch (err) {
      if (err.code === 'KHONG_TIM_THAY') {
        setDeviceMsg({ type: 'warn', text: 'Thiết bị chưa được ghi nhận. Nhập thông tin máy để ghi nhận (UC03).' });
        setNewDevice({ productId: '', purchaseDate: '', warrantyMonths: 12 });
      } else {
        fieldErrors(err);
        setDeviceMsg({ type: 'error', text: err.message });
      }
    }
  }

  async function saveDevice(e) {
    e.preventDefault();
    try {
      setDevice(await createDevice({ ...newDevice, serialNo: serial, customerId: customer.customerId }));
      setNewDevice(null);
      setDeviceMsg({ type: 'ok', text: 'Đã ghi nhận thiết bị.' });
      setErrors({});
    } catch (err) {
      fieldErrors(err);
      setDeviceMsg({ type: 'error', text: err.message });
    }
  }

  function onCategory(e) {
    const id = e.target.value;
    setCategoryId(id);
    const cat = catalog.data?.[0].find((c) => String(c.categoryId) === id);
    if (cat) setPriority(cat.defaultPriority); // QT-A1: goi y muc uu tien theo nhom
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true); setSubmitError(null); setErrors({});
    try {
      setCreated(await createTicket({ phone, serialNo: device.serialNo, categoryId: Number(categoryId), priority, issueDesc }));
    } catch (err) {
      fieldErrors(err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setPhone(''); setCustomer(null); setCustomerMsg(null); setNewCustomer(null);
    setSerial(''); setDevice(null); setDeviceMsg(null); setNewDevice(null);
    setCategoryId(''); setPriority(''); setIssueDesc(''); setCreated(null); setErrors({}); setSubmitError(null);
  }

  if (created) {
    return (
      <section className="card success-card">
        <div className="success-icon">✓</div>
        <h1>Đã tạo phiếu {created.ticketCode}</h1>
        <p>Trạng thái: <strong>{created.status === 'MOI' ? 'Mới' : 'Chờ xác minh bảo hành'}</strong> · Ưu tiên: <strong>{PRIORITY_LABEL[created.priority]}</strong></p>
        <p>Kết quả bảo hành: <strong>{WARRANTY_LABEL[created.warrantyResult]}</strong></p>
        <p>Hạn cam kết SLA: <strong>{fmtDateTime(created.dueDate)}</strong></p>
        <p className="muted">Đọc mã phiếu cho khách hàng để tra cứu sau này.</p>
        <div className="actions">
          <Link to={`/tickets/${created.ticketId}`} className="btn btn-primary">Xem chi tiết phiếu</Link>
          <button className="btn" onClick={resetAll}>Tiếp nhận phiếu khác</button>
        </div>
      </section>
    );
  }

  const Msg = ({ m }) => (m ? <div className={`alert alert-${m.type}`}>{m.text}</div> : null);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Tiếp nhận yêu cầu bảo hành</h1>
          <p className="muted">Làm lần lượt 4 bước. Mỗi bước mở khi bước trước đã xong.</p>
        </div>
      </div>
      <DataState loading={catalog.loading} error={catalog.error} onRetry={catalog.reload}>
        <div className="grid-2">
          <div className="card step">
            <h2><span className="step-no">1</span>Khách hàng</h2>
            <form className="inline" onSubmit={findCustomer}>
              <Field label="Số điện thoại" error={!newCustomer && errors.phone}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="VD: 0901234567" />
              </Field>
              <button className="btn">Tra cứu</button>
            </form>
            <Msg m={customerMsg} />
            {newCustomer && (
              <form className="inline" onSubmit={saveCustomer}>
                <Field label="Họ tên khách hàng" error={errors.fullName || errors.phone}>
                  <input value={newCustomer.fullName} onChange={(e) => setNewCustomer({ fullName: e.target.value })} />
                </Field>
                <button className="btn btn-primary">Tạo hồ sơ</button>
              </form>
            )}
            {customer && (
              <dl className="kv">
                <dt>Khách hàng</dt><dd><strong>{customer.fullName}</strong></dd>
                <dt>SĐT</dt><dd>{customer.phone}</dd>
              </dl>
            )}
          </div>

          <div className={`card step ${customer ? '' : 'disabled'}`}>
            <h2><span className="step-no">2</span>Thiết bị</h2>
            <form className="inline" onSubmit={findDevice}>
              <Field label="Serial / IMEI" error={!newDevice && errors.serialNo}>
                <input value={serial} disabled={!customer} onChange={(e) => setSerial(e.target.value)} placeholder="VD: SN-IP15-2026-88" />
              </Field>
              <button className="btn" disabled={!customer}>Tra cứu</button>
            </form>
            <Msg m={deviceMsg} />
            {newDevice && (
              <form onSubmit={saveDevice} className="stack">
                <Field label="Dòng máy" error={errors.productId}>
                  <select value={newDevice.productId} onChange={(e) => setNewDevice({ ...newDevice, productId: e.target.value })}>
                    <option value="">— Chọn dòng máy —</option>
                    {catalog.data?.[1].map((p) => <option key={p.productId} value={p.productId}>{p.brand} · {p.productName}</option>)}
                  </select>
                </Field>
                <div className="grid-2 tight">
                  <Field label="Ngày mua" error={errors.purchaseDate} hint="Bỏ trống nếu khách không có hóa đơn">
                    <input type="date" value={newDevice.purchaseDate} onChange={(e) => setNewDevice({ ...newDevice, purchaseDate: e.target.value })} />
                  </Field>
                  <Field label="Số tháng bảo hành" error={errors.warrantyMonths}>
                    <input type="number" min="0" max="60" value={newDevice.warrantyMonths} onChange={(e) => setNewDevice({ ...newDevice, warrantyMonths: e.target.value })} />
                  </Field>
                </div>
                <button className="btn btn-primary">Ghi nhận thiết bị</button>
              </form>
            )}
            {device && (
              <dl className="kv">
                <dt>Dòng máy</dt><dd><strong>{device.productName}</strong></dd>
                <dt>Ngày mua</dt><dd>{fmtDate(device.purchaseDate)} · {device.warrantyMonths} tháng</dd>
                <dt>Bảo hành</dt><dd><span className={`badge w-${device.warranty.result}`}>{WARRANTY_LABEL[device.warranty.result]}</span></dd>
              </dl>
            )}
          </div>

          <div className={`card step ${device ? '' : 'disabled'}`}>
            <h2><span className="step-no">3</span>Sự cố & mức ưu tiên</h2>
            <div className="grid-2 tight">
              <Field label="Nhóm sự cố" error={errors.categoryId}>
                <select value={categoryId} onChange={onCategory} disabled={!device}>
                  <option value="">— Chọn nhóm —</option>
                  {catalog.data?.[0].map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </select>
              </Field>
              <Field label="Mức ưu tiên" error={errors.priority} hint="Gợi ý theo nhóm, có thể đổi">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={!device}>
                  <option value="">—</option>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Mô tả lỗi" error={errors.issueDesc}>
              <textarea rows="3" value={issueDesc} disabled={!device} onChange={(e) => setIssueDesc(e.target.value)} placeholder="Mô tả hiện tượng lỗi khách báo" />
            </Field>
          </div>

          <form className={`card step ${device ? '' : 'disabled'}`} onSubmit={submit}>
            <h2><span className="step-no">4</span>Xác nhận tạo phiếu</h2>
            <dl className="kv">
              <dt>Hạn SLA dự kiến</dt><dd><strong>{sla ? fmtDateTime(sla.dueDate) : '— chọn mức ưu tiên —'}</strong></dd>
              <dt>Trạng thái phiếu</dt>
              <dd>{device ? (device.warranty.result === 'CHUA_XAC_MINH_BAO_HANH' ? 'Chờ xác minh bảo hành (cần Quản lý duyệt)' : 'Mới') : '—'}</dd>
            </dl>
            {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}
            <button className="btn btn-primary btn-block" disabled={!device || submitting}>
              {submitting ? 'Đang tạo phiếu…' : 'Tạo phiếu bảo hành'}
            </button>
          </form>
        </div>
      </DataState>
    </section>
  );
}
