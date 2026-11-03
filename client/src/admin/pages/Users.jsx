import React, { useEffect, useState } from 'react';
import { api, getUser } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import { PageHead } from './Dashboard.jsx';

export default function Users() {
  const { t } = usePrefs();
  const toast = useToast();
  const me = getUser();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [reset, setReset] = useState(null);

  const load = () => api('/users').then(setRows).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try { await api('/users', { method: 'POST', body: form }); setForm(null); load(); toast(t('تمت إضافة المستخدم', 'User added')); }
    catch (e2) { toast(e2.message, 'error'); }
  };
  const doReset = async (e) => {
    e.preventDefault();
    try { await api(`/users/${reset.id}`, { method: 'PUT', body: { password: reset.password } }); setReset(null); toast(t('تم تغيير كلمة المرور', 'Password updated')); }
    catch (e2) { toast(e2.message, 'error'); }
  };
  const setRole = async (u, role) => { await api(`/users/${u.id}`, { method: 'PUT', body: { role } }); load(); };
  const del = async (u) => {
    if (!confirm(t(`حذف ${u.username}؟`, `Delete ${u.username}?`))) return;
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <PageHead title={t('المستخدمون', 'Users')} sub={t('حسابات الدخول للوحة التحكم', 'Admin panel accounts')}>
        <button onClick={() => setForm({ username: '', password: '', role: 'staff' })} className="btn-primary">+ {t('مستخدم', 'User')}</button>
      </PageHead>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>{t('المستخدم', 'Username')}</th><th>{t('الصلاحية', 'Role')}</th><th>{t('أُنشئ', 'Created')}</th><th></th></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.username} {u.id === me?.id && <span className="chip bg-violet-500/15 text-violet-500">{t('أنت', 'You')}</span>}</td>
                <td>
                  <select className="input w-36 py-1" value={u.role} disabled={u.id === me?.id} onChange={e => setRole(u, e.target.value)}>
                    <option value="admin">{t('مدير (كل الصلاحيات)', 'Admin (full)')}</option>
                    <option value="staff">{t('موظف', 'Staff')}</option>
                  </select>
                </td>
                <td className="text-xs text-muted">{u.created_at}</td>
                <td><div className="flex gap-1">
                  <button onClick={() => setReset({ id: u.id, username: u.username, password: '' })} className="btn-ghost btn-sm">{t('كلمة المرور', 'Password')}</button>
                  {u.id !== me?.id && <button onClick={() => del(u)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{t('الموظف يدير المبيعات والمخزون — المدير فقط يدير المستخدمين والإعدادات والنسخ الاحتياطي.', 'Staff manage sales & stock — only admins manage users, settings and backups.')}</p>

      {form && (
        <Modal title={t('مستخدم جديد', 'New user')} onClose={() => setForm(null)}>
          <form onSubmit={add} className="space-y-3">
            <div><label className="label">{t('اسم المستخدم', 'Username')}</label><input className="input" dir="ltr" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
            <div><label className="label">{t('كلمة المرور', 'Password')}</label><input type="password" minLength={6} className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
            <div><label className="label">{t('الصلاحية', 'Role')}</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="staff">{t('موظف', 'Staff')}</option><option value="admin">{t('مدير', 'Admin')}</option></select>
            </div>
            <button className="btn-primary w-full">{t('إضافة', 'Add')}</button>
          </form>
        </Modal>
      )}
      {reset && (
        <Modal title={`${t('كلمة مرور جديدة', 'New password')} — ${reset.username}`} onClose={() => setReset(null)}>
          <form onSubmit={doReset} className="space-y-3">
            <input type="password" minLength={6} className="input" autoFocus value={reset.password} onChange={e => setReset({ ...reset, password: e.target.value })} required />
            <button className="btn-primary w-full">{t('حفظ', 'Save')}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
