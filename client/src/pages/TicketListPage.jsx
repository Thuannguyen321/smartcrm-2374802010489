// M1 - Danh sach phieu bao hanh cua trung tam (FR8 / US7).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTickets } from '../api/tickets.api';
import DataState from '../components/DataState';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { useAsync } from '../utils/useAsync';
import { fmtDateTime } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

const EMPTY_FILTERS = { q: '', status: '', priority: '', slaState: '', from: '', to: '' };

export default function TicketListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const { loading, error, data, reload } = useAsync(() => listTickets({ ...filters, page }), [filters, page]);

  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(draft);
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };
  const hasFilter = Object.values(filters).some(Boolean);
  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.pageSize)) : 1;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Danh sách phiếu bảo hành</h1>
          <p className="muted">{user.centerName}{data && ` · ${data.meta.total} phiếu`}</p>
        </div>
        {user.role === 'RECEPTIONIST' && <Link to="/tickets/new" className="btn btn-primary">+ Tiếp nhận mới</Link>}
      </div>

      <form className="card filters" onSubmit={apply}>
        <input placeholder="Mã phiếu hoặc SĐT" value={draft.q} onChange={set('q')} />
        <select value={draft.status} onChange={set('status')} aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          <option value="MOI">Mới</option>
          <option value="CHO_XAC_MINH">Chờ xác minh BH</option>
        </select>
        <select value={draft.priority} onChange={set('priority')} aria-label="Mức ưu tiên">
          <option value="">Mọi mức ưu tiên</option>
          <option value="CAO">Cao</option>
          <option value="TRUNG_BINH">Trung bình</option>
          <option value="THAP">Thấp</option>
        </select>
        <select value={draft.slaState} onChange={set('slaState')} aria-label="Tình trạng SLA">
          <option value="">Mọi tình trạng SLA</option>
          <option value="TRONG_HAN">Trong hạn</option>
          <option value="SAP_TRE">Sắp trễ (≤ 4 giờ)</option>
          <option value="TRE_HAN">Trễ hạn</option>
        </select>
        <input type="date" value={draft.from} onChange={set('from')} aria-label="Từ ngày" />
        <input type="date" value={draft.to} onChange={set('to')} aria-label="Đến ngày" />
        <button className="btn btn-primary">Lọc</button>
        <button type="button" className="btn btn-ghost" onClick={reset}>Xóa lọc</button>
      </form>

      <div className="card">
        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={data && data.data.length === 0}
          emptyText={hasFilter ? 'Không có phiếu nào khớp bộ lọc' : 'Trung tâm chưa có phiếu bảo hành nào'}
          emptyHint={hasFilter ? 'Thử bỏ bớt điều kiện lọc hoặc bấm "Xóa lọc".' : 'Bấm "Tiếp nhận mới" để tạo phiếu đầu tiên.'}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Mã phiếu</th><th>Khách hàng</th><th>Thiết bị</th><th>Nhóm sự cố</th>
                <th>Ưu tiên</th><th>Trạng thái</th><th>Tiếp nhận</th><th>Hạn SLA</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((t) => (
                <tr key={t.ticketId} className="row-link" onClick={() => navigate(`/tickets/${t.ticketId}`)}>
                  <td><strong>{t.ticketCode}</strong></td>
                  <td>{t.customerName}<br /><small className="muted">{t.customerPhone}</small></td>
                  <td>{t.productName}<br /><small className="muted">{t.serialNo}</small></td>
                  <td>{t.categoryName}</td>
                  <td><PriorityBadge value={t.priority} /></td>
                  <td><StatusBadge value={t.status} /></td>
                  <td>{fmtDateTime(t.receivedAt)}</td>
                  <td>{fmtDateTime(t.dueDate)}<br /><SlaBadge value={t.slaState} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pager">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</button>
            <span>Trang {page} / {totalPages}</span>
            <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau ›</button>
          </div>
        </DataState>
      </div>
    </section>
  );
}
