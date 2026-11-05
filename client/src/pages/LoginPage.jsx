import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/tickets" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form.username, form.password);
      navigate(location.state?.from || '/tickets', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="brand brand-lg">
          <span className="brand-mark">M</span>
          <div>
            <strong>Smart CRM</strong>
            <small>Mekong Mobile · Tiếp nhận bảo hành</small>
          </div>
        </div>
        {location.state?.expired && <div className="alert alert-warn">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label className="field">
          <span className="field-label">Tên đăng nhập</span>
          <input autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Mật khẩu</span>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="muted small">Tài khoản demo: letan01 / quanly01 — mật khẩu Mekong@2026</p>
      </form>
    </div>
  );
}
