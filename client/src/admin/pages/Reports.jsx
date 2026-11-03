import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { PageHead } from './Dashboard.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date().toISOString().slice(0, 8) + '01';

export default function Reports() {
  const { t, money, fmt } = usePrefs();
  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    const q = `from=${from}&to=${to}`;
    const url = { sales: `/reports/sales?${q}`, purchases: `/reports/purchases?${q}`, top: '/reports/top-products', low: '/reports/low-stock' }[tab];
    api(url).then(setData).catch(() => setData({ rows: [] }));
  }, [tab, from, to]);

  const tabs = [['sales', t('المبيعات والأرباح', 'Sales & profit')], ['purchases', t('المشتريات', 'Purchases')], ['top', t('الأكثر مبيعاً', 'Top sellers')], ['low', t('تحت حد الطلب', 'Low stock')]];
  const Stat = ({ l, v, accent }) => <div className="card"><div className="text-xs font-bold text-muted">{l}</div><div className={`text-xl font-black ${accent ? 'text-emerald-500' : ''}`}>{v}</div></div>;
  const InvLink = ({ r }) => <Link className="font-mono font-bold text-violet-500 hover:underline" to={`/invoices/${r.id}`}>{r.number}</Link>;

  return (
    <div className="space-y-4">
      <PageHead title={t('التقارير', 'Reports')}><button onClick={() => window.print()} className="btn-ghost">🖨 {t('طباعة', 'Print')}</button></PageHead>
      <div className="card flex flex-wrap items-end gap-3 print:hidden">
        <div className="flex flex-wrap rounded-xl border border-line bg-surface2/50 p-1">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`relative rounded-lg px-4 py-1.5 text-xs font-bold ${tab === k ? 'text-white' : 'text-muted'}`}>
              {tab === k && <motion.span layoutId="rtab" className="absolute inset-0 rounded-lg bg-violet-600" />}<span className="relative">{l}</span>
            </button>
          ))}
        </div>
        {(tab === 'sales' || tab === 'purchases') && <>
          <div><label className="label">{t('من', 'From')}</label><input type="date" className="input w-40" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label">{t('إلى', 'To')}</label><input type="date" className="input w-40" value={to} onChange={e => setTo(e.target.value)} /></div>
        </>}
      </div>

      {!data ? <div className="h-48 animate-pulse rounded-2xl bg-surface2" /> : <>
        {tab === 'sales' && <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat l={t('إجمالي المبيعات', 'Total sales')} v={money(data.totals?.total)} />
            <Stat l={t('المحصّل', 'Collected')} v={money(data.totals?.paid)} />
            <Stat l={t('صافي الربح', 'Net profit')} v={money(data.totals?.profit)} accent />
          </div>
          <div className="card overflow-x-auto p-0"><table className="table">
            <thead><tr><th>#</th><th>{t('التاريخ', 'Date')}</th><th>{t('العميل', 'Customer')}</th><th>{t('الإجمالي', 'Total')}</th><th>{t('المدفوع', 'Paid')}</th><th>{t('الربح', 'Profit')}</th></tr></thead>
            <tbody>{data.rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">—</td></tr>}
              {data.rows.map(r => <tr key={r.id}><td><InvLink r={r} /></td><td className="text-xs text-muted">{r.date}</td><td>{r.party_name || t('نقدي', 'Walk-in')}</td><td className="font-bold">{money(r.total)}</td><td>{money(r.paid)}</td><td className="font-bold text-emerald-500">{money(r.profit)}</td></tr>)}</tbody>
          </table></div>
        </>}
        {tab === 'purchases' && <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat l={t('إجمالي المشتريات', 'Total purchases')} v={money(data.total)} />
            <Stat l={t('عدد الفواتير', 'Invoices')} v={data.rows.length} />
          </div>
          <div className="card overflow-x-auto p-0"><table className="table">
            <thead><tr><th>#</th><th>{t('التاريخ', 'Date')}</th><th>{t('المورد', 'Supplier')}</th><th>{t('الإجمالي', 'Total')}</th><th>{t('المدفوع', 'Paid')}</th></tr></thead>
            <tbody>{data.rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">—</td></tr>}
              {data.rows.map(r => <tr key={r.id}><td><InvLink r={r} /></td><td className="text-xs text-muted">{r.date}</td><td>{r.party_name || '—'}</td><td className="font-bold">{money(r.total)}</td><td>{money(r.paid)}</td></tr>)}</tbody>
          </table></div>
        </>}
        {tab === 'top' && <div className="card overflow-x-auto p-0"><table className="table">
          <thead><tr><th>#</th><th>{t('الصنف', 'Item')}</th><th>{t('الكمية', 'Qty')}</th><th>{t('المبيعات', 'Sales')}</th><th>{t('الربح', 'Profit')}</th></tr></thead>
          <tbody>{data.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">—</td></tr>}
            {data.map((r, i) => <tr key={r.product_name}><td className="text-muted">{i + 1}</td><td className="font-bold">{r.product_name}</td><td>{fmt(r.qty)}</td><td>{money(r.total)}</td><td className="font-bold text-emerald-500">{money(r.profit)}</td></tr>)}</tbody>
        </table></div>}
        {tab === 'low' && <div className="card overflow-x-auto p-0"><table className="table">
          <thead><tr><th>{t('الكود', 'Code')}</th><th>{t('الصنف', 'Item')}</th><th>{t('المتبقي', 'Left')}</th><th>{t('حد الطلب', 'Reorder')}</th></tr></thead>
          <tbody>{data.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted">{t('كل المخزون سليم', 'All stock levels are fine')}</td></tr>}
            {data.map(p => <tr key={p.id}><td className="font-mono text-xs">{p.code || '—'}</td><td className="font-bold">{p.name}</td><td className="font-bold text-red-500">{fmt(p.stock)}</td><td className="text-muted">{fmt(p.min_stock)}</td></tr>)}</tbody>
        </table></div>}
      </>}
    </div>
  );
}
