// Tinh nang phu (TD-13): quan ly ho so khach hang - dung lai API CRUD /customers.
import { useState } from 'react';
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../api/customers.api';
import DataState from '../components/DataState';
import Field from '../components/Field';
import { useAsync } from '../utils/useAsync';
import { useAuth } from '../auth/AuthContext';

const BLANK = { fullName: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | { id?, ...form }
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const { loading, error, data, reload } = useAsync(() => listCustomers({ q: query }), [query]);

  async function save(e) {
    e.preventDefault();
    setErrors({}); setMsg(null);
    const { id, ...form } = editing;
    try {
      if (id) await updateCustomer(id, form);
      else await createCustomer(form);
      setEditing(null);
      setMsg({ type: 'ok', text: id ? 'Đã cập nhật khách hàng.' : 'Đã thêm khách hàng.' });
      reload();
    } catch (err) {
      setErrors(err.details || {});
      setMsg({ type: 'error', text: err.message });
    }
  }

  async function remove(c) {
    if (!window.confirm(`Xóa khách hàng ${c.fullName}?`)) return;
    try {
      await deleteCustomer(c.customerId);
      setMsg({ type: 'ok', text: 'Đã xóa khách hàng.' });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Khách hàng</h1><p className="muted">{user.role === 'MANAGER' ? 'Tra cứu, thêm, sửa, xóa hồ sơ khách hàng' : 'Tra cứu và thêm hồ sơ khách hàng (SĐT được che theo NFR4)'}</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(BLANK); setErrors({}); }}>+ Thêm khách hàng</button>
      </div>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      {editing && (
        <form className="card grid-4" onSubmit={save}>
          <Field label="Họ tên" error={errors.fullName}><input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></Field>
          <Field label="Số điện thoại" error={errors.phone}><input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
          <Field label="Email" error={errors.email}><input value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
          <Field label="Địa chỉ"><input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></Field>
          <div className="actions">
            <button className="btn btn-primary">Lưu</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Hủy</button>
          </div>
        </form>
      )}
      <form className="card filters" onSubmit={(e) => { e.preventDefault(); setQuery(q); }}>
        <input placeholder="Tìm theo họ tên hoặc SĐT" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary">Tìm</button>
      </form>
      <div className="card">
        <DataState loading={loading} error={error} onRetry={reload} empty={data && data.data.length === 0}
          emptyText="Không tìm thấy khách hàng" emptyHint="Kiểm tra lại họ tên hoặc số điện thoại.">
          <table className="table">
            <thead><tr><th>Họ tên</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th><th /></tr></thead>
            <tbody>
              {data?.data.map((c) => (
                <tr key={c.customerId}>
                  <td><strong>{c.fullName}</strong></td><td>{c.phone}</td><td>{c.email || '—'}</td><td>{c.address || '—'}</td>
                  <td className="right">
                    {user.role === 'MANAGER' && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing({ id: c.customerId, ...c }); setErrors({}); }}>Sửa</button>
                        <button className="btn btn-ghost btn-sm danger" onClick={() => remove(c)}>Xóa</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataState>
      </div>
    </section>
  );
}
