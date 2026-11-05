// Diem DUY NHAT goi fetch() trong frontend. Cac trang (pages/) chi goi ham trong *.api.js.
// - Gan token JWT vao header Authorization.
// - Nhan 401 -> xoa token, quay ve trang dang nhap.
// - Chuan hoa moi loi thanh ApiError { code, message, details } de giao dien hien thong bao.
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'smartcrm.token';
const MSG_KHONG_KET_NOI = 'Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa rồi bấm "Thử lại".';

export class ApiError extends Error {
  constructor(code, message, details, status) {
    super(message);
    this.code = code;
    this.details = details || {};
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function request(method, path, { body, query } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}${toQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('KHONG_KET_NOI', MSG_KHONG_KET_NOI);
  }

  if (res.status === 204) return null;
  const payload = await res.json().catch(() => null);

  if (res.status === 401 && path !== '/auth/login') {
    tokenStore.clear();
    onUnauthorized();
  }
  if (!res.ok) {
    if (!payload) {
      // Backend tat nhung van con proxy (Vite/Nginx) phia truoc -> proxy tra 500/502 KHONG co JSON.
      // Coi nhu mat ket noi thay vi hien "HTTP 500" kho hieu (BUG-02).
      throw new ApiError('KHONG_KET_NOI', MSG_KHONG_KET_NOI, {}, res.status);
    }
    throw new ApiError(payload.error, payload.message, payload.details, res.status);
  }
  return payload;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
};
