// M3 - Chi tiet phieu + lich su trang thai (UC08) + xet duyet (UC07, chi Quan ly).
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTicket, reviewTicket } from '../api/tickets.api';
import DataState from '../components/DataState';
import Field from '../components/Field';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { useAsync } from '../utils/useAsync';
import { STATUS_LABEL, fmtDate, fmtDateTime } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

function ReviewForm({ ticketId, onDone }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);

  async function decide(decision) {
    setBusy(true); setError(null); setFieldErr({});
    try {
      onDone(await reviewTicket(ticketId, decision, note));
    } catch (err) {
      setFieldErr(err.details || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card review">
      <h2>Xét duyệt bảo hành</h2>
      <p className="muted">Phiếu thiếu ngày mua. Chấp nhận → bảo hành miễn phí; Từ chối → sửa chữa tính phí. Ghi chú là bắt buộc.</p>
      <Field label="Ghi chú xét duyệt" error={fieldErr.note}>
        <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Khách xuất trình hóa đơn ngày 02/05/2026" />
      </Field>
      {error && !fieldErr.note && <div className="alert alert-error">{error}</div>}
      <div className="actions">
        <button className="btn btn-primary" disabled={busy} onClick={() => decide('CHAP_NHAN')}>Chấp nhận bảo hành</button>
        <button className="btn btn-danger" disabled={busy} onClick={() => decide('TU_CHOI')}>Từ chối</button>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [override, setOverride] = useState(null);
  const { loading, error, data, reload } = useAsync(() => getTicket(id), [id]);
  const t = override || data;

  return (
    <section>
      <div className="page-head">
        <div>
          <Link to="/tickets" className="muted">‹ Danh sách phiếu</Link>
          <h1>{t ? `Phiếu ${t.ticketCode}` : 'Chi tiết phiếu'}</h1>
        </div>
      </div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {t && (
          <div className="grid-detail">
            <div className="card">
              <div className="badges">
                <StatusBadge value={t.status} /> <PriorityBadge value={t.priority} /> <SlaBadge value={t.slaState} />
                <span className={`badge ${t.isWarranty ? 'w-CON_BAO_HANH' : 'w-HET_BAO_HANH'}`}>{t.isWarranty ? 'Bảo hành' : 'Sửa tính phí'}</span>
              </div>
              <dl className="kv kv-wide">
                <dt>Khách hàng</dt><dd>{t.customerName} · {t.customerPhone}</dd>
                <dt>Thiết bị</dt><dd>{t.productName} · {t.serialNo}</dd>
                <dt>Ngày mua</dt><dd>{fmtDate(t.purchaseDate)} ({t.warrantyMonths} tháng BH)</dd>
                <dt>Nhóm sự cố</dt><dd>{t.categoryName}</dd>
                <dt>Mô tả lỗi</dt><dd>{t.issueDesc}</dd>
                <dt>Trung tâm</dt><dd>{t.centerName}</dd>
                <dt>Người tiếp nhận</dt><dd>{t.createdByName}</dd>
                <dt>Tiếp nhận lúc</dt><dd>{fmtDateTime(t.receivedAt)}</dd>
                <dt>Hạn SLA</dt><dd><strong>{fmtDateTime(t.dueDate)}</strong></dd>
              </dl>
            </div>
            <div>
              {t.status === 'CHO_XAC_MINH' && user.role === 'MANAGER' && <ReviewForm ticketId={t.ticketId} onDone={setOverride} />}
              {t.status === 'CHO_XAC_MINH' && user.role !== 'MANAGER' && (
                <div className="alert alert-warn">Phiếu đang chờ Quản lý trung tâm xét duyệt bảo hành.</div>
              )}
              <div className="card">
                <h2>Lịch sử trạng thái</h2>
                <ol className="timeline">
                  {t.logs.map((l, i) => (
                    <li key={i}>
                      <strong>{l.fromStatus ? `${STATUS_LABEL[l.fromStatus]} → ` : ''}{STATUS_LABEL[l.toStatus]}</strong>
                      <span className="muted"> · {fmtDateTime(l.changedAt)} · {l.changedByName}</span>
                      {l.note && <div>{l.note}</div>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </section>
  );
}
