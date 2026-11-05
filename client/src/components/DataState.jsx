// Boc moi man hinh lay du lieu: hien dung 1 trong 3 trang thai (dang tai / loi / rong)
// truoc khi hien noi dung that. Yeu cau bat buoc cua BT2 (TP3).
export default function DataState({ loading, error, empty, emptyText, emptyHint, onRetry, children }) {
  if (loading) {
    return (
      <div className="state state-loading" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Đang tải dữ liệu…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state state-error" role="alert">
        <strong>Không tải được dữ liệu</strong>
        <p>{error.message}</p>
        {error.code && <code className="muted">Mã lỗi: {error.code}</code>}
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="state state-empty">
        <strong>{emptyText || 'Không có dữ liệu'}</strong>
        {emptyHint && <p>{emptyHint}</p>}
      </div>
    );
  }
  return children;
}
