import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { PageHead } from './Dashboard.jsx';

export default function Invoices() {
  const { t, money } = usePrefs();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState([]);
  const get = k => sp.get(k) || '';

  const load = () => {
    const p = new URLSearchParams();
    ['type', 'from', 'to', 'q'].forEach(k => get(k) && p.set(k, get(k)));
    api(`/invoices?${p}`).then(setRows).catch(e => toast(e.message, 'error'));
  };
  useEffect(load, [sp]);

  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };
  const del = async (inv) => {
    if (!confirm(t(`حذف ${inv.number}؟ سيتم عكس المخزون والرصيد.`, `Delete ${inv.number}? Stock and balances will be reversed.`))) return;
    try { await api(`/invoices/${inv.id}`, { method: 'DELETE' }); load(); toast(t('تم الحذف', 'Deleted')); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <PageHead title={t('الفواتير', 'Invoices')}>
        <Link to="/sale/new" className="btn-success">+ {t('بيع', 'Sale')}</Link>
        <Link to="/purchase/new" className="btn-primary">+ {t('شراء', 'Purchase')}</Link>
      </PageHead>
      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div><label className="label">{t('النوع', 'Type')}</label>
          <select className="input w-36" value={get('type')} onChange={e => set('type', e.target.value)}>
            <option value="">{t('الكل', 'All')}</option><option value="sale">{t('بيع', 'Sale')}</option><option value="purchase">{t('شراء', 'Purchase')}</option>
          </select>
        </div>
        <div><label className="label">{t('من', 'From')}</label><input type="date" className="input w-40" value={get('from')} onChange={e => set('from', e.target.value)} /></div>
        <div><label className="label">{t('إلى', 'To')}</label><input type="date" className="input w-40" value={get('to')} onChange={e => set('to', e.target.value)} /></div>
        <div className="min-w-44 flex-1"><label className="label">{t('بحث', 'Search')}</label><input className="input" value={get('q')} onChange={e => set('q', e.target.value)} placeholder={t('رقم أو اسم...', 'Number or name...')} /></div>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>#</th><th>{t('النوع', 'Type')}</th><th>{t('التاريخ', 'Date')}</th><th>{t('الطرف', 'Party')}</th><th>{t('الإجمالي', 'Total')}</th><th>{t('المدفوع', 'Paid')}</th><th>{t('المتبقي', 'Due')}</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-muted">{t('لا توجد فواتير', 'No invoices')}</td></tr>}
            {rows.map(inv => (
              <tr key={inv.id}>
                <td className="font-mono font-bold">{inv.number}</td>
                <td><span className={`chip ${inv.type === 'sale' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-violet-500/15 text-violet-500'}`}>{inv.type === 'sale' ? t('بيع', 'Sale') : t('شراء', 'Purchase')}</span></td>
                <td className="text-xs text-muted">{inv.date}</td>
                <td className="font-semibold">{inv.party_name || '—'}</td>
                <td className="font-bold">{money(inv.total)}</td>
                <td>{money(inv.paid)}</td>
                <td className={inv.total - inv.paid > 0 ? 'font-bold text-red-500' : 'text-muted'}>{money(inv.total - inv.paid)}</td>
                <td><div className="flex gap-1">
                  <Link to={`/invoices/${inv.id}`} className="btn-ghost btn-sm">{t('عرض', 'View')}</Link>
                  <button onClick={() => del(inv)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
