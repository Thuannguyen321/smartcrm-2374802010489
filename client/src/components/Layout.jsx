import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ROLE_LABEL = { RECEPTIONIST: 'Nhân viên tiếp nhận', MANAGER: 'Quản lý trung tâm' };

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>Smart CRM</strong>
            <small>Mekong Mobile · Tiếp nhận bảo hành</small>
          </div>
        </div>
        <nav>
          <NavLink to="/tickets" end>Danh sách phiếu</NavLink>
          {user.role === 'RECEPTIONIST' && <NavLink to="/tickets/new">Tiếp nhận mới</NavLink>}
          <NavLink to="/customers">Khách hàng</NavLink>
        </nav>
        <div className="user">
          <div>
            <strong>{user.fullName}</strong>
            <small>{ROLE_LABEL[user.role]} · {user.centerName}</small>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>Đăng xuất</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
