import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TicketListPage from './pages/TicketListPage';
import TicketCreatePage from './pages/TicketCreatePage';
import TicketDetailPage from './pages/TicketDetailPage';
import CustomersPage from './pages/CustomersPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<TicketCreatePage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/customers" element={<CustomersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  );
}
