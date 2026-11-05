import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUnauthorizedHandler, tokenStore } from '../api/client';
import { login as loginApi } from '../api/auth.api';

const AuthContext = createContext(null);
const USER_KEY = 'smartcrm.user';

function readUser() {
  try {
    return tokenStore.get() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Moi phan hoi 401 tu API: xoa phien va ve trang dang nhap (token het han).
    setUnauthorizedHandler(() => {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      navigate('/login', { replace: true, state: { expired: true } });
    });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      async login(username, password) {
        const { token, user: u } = await loginApi(username, password);
        tokenStore.set(token);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setUser(u);
      },
      logout() {
        tokenStore.clear();
        localStorage.removeItem(USER_KEY);
        setUser(null);
        navigate('/login', { replace: true });
      },
    }),
    [user, navigate]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
