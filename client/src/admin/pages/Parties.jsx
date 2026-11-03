import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import { PageHead } from './Dashboard.jsx';

export default function Parties() {
  const { t, money } = usePrefs();
  const toast = useToast();
  const [type, setType] = useState('customer');
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [stmtFor, setStmtFor] = useState(null);
  const isCust = type === 'customer';

  const load = () => api(`/parties?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ''}`).then(setRows).catch(e => toast(e.message, 'error'));
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [type, q]);

  const del = async (p) => {
    if (!confirm(t(`حذف "${p.name}"؟`, `Delete "${p.name}"?`))) return;
    await api(`/parties/${p.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <PageHead title={t('العملاء والموردون', 'Customers & suppliers')}>
        <button onClick={() => setEdit({ name: '', phone: '', address: '', balance: 0 })} className="btn-primary">+ {isCust ? t('عميل', 'Customer') : t('مورد', 'Supplier')}</button>
      </PageHead>
      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-line bg-surface2/50 p-1">
          {[['customer', t('العملاء', 'Customers')], ['supplier', t('الموردون', 'Suppliers')]].map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} className={`relative rounded-lg px-5 py-1.5 text-sm font-bold ${type === k ? 'text-white' : 'text-muted'}`}>
              {type === k && <motion.span layoutId="ptab" className="absolute inset-0 rounded-lg bg-violet-600" />}<span className="relative">{l}</span>
            </button>
          ))}
        </div>
        <input className="input max-w-72" placeholder={t('بحث بالاسم أو الهاتف...', 'Search name or phone...')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>{t('الاسم', 'Name')}</th><th>{t('الهاتف', 'Phone')}</th><th>{t('العنوان', 'Address')}</th><th>{isCust ? t('مدين لنا', 'Owes us') : t('مدينون له', 'We owe')}</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted">{t('لا توجد سجلات', 'No records')}</td></tr>}
            {rows.map(p => (
              <tr key={p.id}>
                <td className="font-bold">{p.name}</td>
                <td className="font-mono text-xs" dir="ltr">{p.phone || '—'}</td>
                <td className="text-xs text-muted">{p.address || '—'}</td>
                <td className={p.balance > 0 ? 'font-bold text-red-500' : p.balance < 0 ? 'font-bold text-emerald-500' : 'text-muted'}>{money(Math.abs(p.balance))}</td>
                <td><div className="flex flex-wrap gap-1">
                  <button onClick={() => setPayFor(p)} className="btn-success btn-sm">{t('تسديد', 'Payment')}</button>
                  <button onClick={() => setStmtFor(p)} className="btn-ghost btn-sm">{t('كشف حساب', 'Statement')}</button>
                  <button onClick={() => setEdit({ ...p })} className="btn-ghost btn-sm">{t('تعديل', 'Edit')}</button>
                  <button onClick={() => del(p)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <PartyForm type={type} party={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {payFor && <PaymentModal party={payFor} onClose={() => setPayFor(null)} onSaved={() => { setPayFor(null); load(); }} />}
      {stmtFor && <StatementModal party={stmtFor} onClose={() => setStmtFor(null)} />}
    </div>
  );
}

function PartyForm({ type, party, onClose, onSaved }) {
  const { t } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState(party);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (f.id) await api(`/parties/${f.id}`, { method: 'PUT', body: f }); else await api('/parties', { method: 'POST', body: { type, ...f } });
      onSaved();
    } catch (e2) { toast(e2.message, 'error'); }
  };
  return (
    <Modal title={f.id ? t('تعديل', 'Edit') : type === 'customer' ? t('عميل جديد', 'New customer') : t('مورد جديد', 'New supplier')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">{t('الاسم', 'Name')} *</label><input className="input" value={f.name} onChange={set('name')} required /></div>
        <div><label className="label">{t('الهاتف', 'Phone')}</label><input className="input" dir="ltr" value={f.phone || ''} onChange={set('phone')} /></div>
        <div><label className="label">{t('العنوان', 'Address')}</label><input className="input" value={f.address || ''} onChange={set('address')} /></div>
        <div><label className="label">{t('الرصيد الحالي', 'Current balance')}</label><input type="number" step="any" className="input" value={f.balance} onChange={set('balance')} /></div>
        <button className="btn-primary w-full">{t('حفظ', 'Save')}</button>
      </form>
    </Modal>
  );
}

function PaymentModal({ party, onClose, onSaved }) {
  const { t, money } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState({ amount: '', note: '' });
  const submit = async (e) => {
    e.preventDefault();
    try { await api(`/parties/${party.id}/payments`, { method: 'POST', body: f }); toast(t('تم تسجيل الدفعة', 'Payment recorded')); onSaved(); }
    catch (e2) { toast(e2.message, 'error'); }
  };
  return (
    <Modal title={`${t('دفعة', 'Payment')} — ${party.name}`} onClose={onClose}>
      <div className="mb-3 rounded-xl bg-surface2 p-3 text-sm">{t('الرصيد الحالي', 'Current balance')}: <b className="text-red-500">{money(party.balance)}</b></div>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">{t('المبلغ', 'Amount')} *</label><input type="number" step="any" min="0.01" className="input" autoFocus value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} required /></div>
        <div><label className="label">{t('ملاحظة', 'Note')}</label><input className="input" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></div>
        <button className="btn-success w-full">{t('تسجيل', 'Record')}</button>
      </form>
    </Modal>
  );
}

function StatementModal({ party, onClose }) {
  const { t, money } = usePrefs();
  const [d, setD] = useState(null);
  useEffect(() => { api(`/parties/${party.id}/statement`).then(setD).catch(() => setD({ party, invoices: [], payments: [] })); }, [party.id]);
  return (
    <Modal title={`${t('كشف حساب', 'Statement')} — ${party.name}`} onClose={onClose} wide>
      {!d ? <div className="h-40 animate-pulse rounded-xl bg-surface2" /> : (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface2 p-3 text-sm">{t('الرصيد', 'Balance')}: <b className="text-red-500">{money(d.party.balance)}</b></div>
          <table className="table">
            <thead><tr><th>#</th><th>{t('التاريخ', 'Date')}</th><th>{t('الإجمالي', 'Total')}</th><th>{t('المدفوع', 'Paid')}</th><th>{t('المتبقي', 'Due')}</th></tr></thead>
            <tbody>
              {d.invoices.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted">—</td></tr>}
              {d.invoices.map(i => <tr key={i.id}><td className="font-mono">{i.number}</td><td className="text-xs text-muted">{i.date}</td><td>{money(i.total)}</td><td>{money(i.paid)}</td><td className={i.due > 0 ? 'font-bold text-red-500' : ''}>{money(i.due)}</td></tr>)}
            </tbody>
          </table>
          <h4 className="text-sm font-bold">{t('الدفعات', 'Payments')}</h4>
          <table className="table">
            <thead><tr><th>{t('التاريخ', 'Date')}</th><th>{t('المبلغ', 'Amount')}</th><th>{t('ملاحظة', 'Note')}</th></tr></thead>
            <tbody>
              {d.payments.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted">—</td></tr>}
              {d.payments.map(p => <tr key={p.id}><td className="text-xs text-muted">{p.date}</td><td className="font-bold text-emerald-500">{money(p.amount)}</td><td className="text-xs">{p.note || '—'}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
