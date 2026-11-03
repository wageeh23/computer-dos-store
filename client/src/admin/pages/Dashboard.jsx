import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { CountUp, Spotlight } from '../../shared/fx/index.jsx';

export function PageHead({ title, sub, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 print:hidden">{children}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { t, money, fmt } = usePrefs();
  const [s, setS] = useState(null);
  const [top, setTop] = useState([]);
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/reports/summary').then(setS).catch(e => setErr(e.message));
    api('/reports/top-products').then(setTop).catch(() => {});
    api('/orders?status=new').then(setOrders).catch(() => {});
  }, []);

  if (err) return <div className="card text-red-500">{err}</div>;
  if (!s) return <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface2" />)}</div>;

  const M = (n) => <CountUp to={n} format={money} />;
  const N = (n) => <CountUp to={n} />;
  const cards = [
    { label: t('مبيعات اليوم', "Today's sales"), value: M(s.today.total), sub: `${s.today.count} ${t('فاتورة', 'invoices')}`, g: 'from-cyan-500 to-blue-600', icon: '💰' },
    { label: t('مبيعات الشهر', 'This month'), value: M(s.month.total), sub: `${s.month.count} ${t('فاتورة', 'invoices')}`, g: 'from-violet-500 to-indigo-600', icon: '📈' },
    { label: t('طلبات جديدة', 'New orders'), value: N(orders.length), sub: t('من المتجر', 'from store'), g: 'from-pink-500 to-rose-600', to: '/orders', icon: '🛒', pulse: orders.length > 0 },
    { label: t('قيمة المخزون', 'Stock value'), value: M(s.stockValue), sub: `${s.products} ${t('منتج', 'products')}`, g: 'from-emerald-500 to-teal-600', icon: '📦' },
    { label: t('تحت حد الطلب', 'Low stock'), value: N(s.lowStock), sub: t('تحتاج شراء', 'need restock'), g: s.lowStock ? 'from-amber-500 to-orange-600' : 'from-slate-500 to-slate-600', to: '/products', icon: '⚠️' },
    { label: t('ديون العملاء', 'Customer debt'), value: M(s.customersDue), sub: t('لنا', 'owed to us'), g: 'from-yellow-500 to-amber-600', icon: '🧾' },
    { label: t('ديون الموردين', 'Supplier debt'), value: M(s.suppliersDue), sub: t('علينا', 'we owe'), g: 'from-red-500 to-pink-600', icon: '🏭' },
  ];

  return (
    <div className="space-y-6">
      <PageHead title={t('لوحة التحكم', 'Dashboard')} sub={t('نظرة عامة على المحل', 'Store overview')}>
        <Link to="/sale/new" className="btn-success">+ {t('فاتورة بيع', 'New sale')}</Link>
        <Link to="/purchase/new" className="btn-primary">+ {t('فاتورة شراء', 'New purchase')}</Link>
      </PageHead>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => {
          const body = (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 220, damping: 20 }} whileHover={{ y: -4 }} className="h-full">
             <Spotlight className={`card relative h-full overflow-hidden ${c.pulse ? 'ring-pulse' : ''}`}>
              <div className={`absolute -end-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${c.g} opacity-25 blur-xl`} />
              <div className="mb-3 flex items-center justify-between">
                <div className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${c.g}`} />
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.g} text-base shadow-lg`}>{c.icon}</span>
              </div>
              <div className="text-xs font-bold text-muted">{c.label}</div>
              <div className="mt-1 text-2xl font-black">{c.value}</div>
              <div className="text-xs text-muted">{c.sub}</div>
             </Spotlight>
            </motion.div>
          );
          return c.to ? <Link key={c.label} to={c.to}>{body}</Link> : <div key={c.label}>{body}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">{t('أحدث الطلبات', 'Latest orders')}</h2>
            <Link to="/orders" className="text-xs font-bold text-violet-500">{t('الكل', 'All')} →</Link>
          </div>
          {orders.length === 0 ? <p className="py-6 text-center text-sm text-muted">{t('لا توجد طلبات جديدة', 'No new orders')}</p> : (
            <div className="space-y-2">
              {orders.slice(0, 6).map(o => (
                <Link key={o.id} to="/orders" className="flex items-center justify-between rounded-xl bg-surface2/50 px-3 py-2.5 text-sm hover:bg-surface2">
                  <span className="font-bold">#{o.id} · {o.customer_name}</span>
                  <span className="font-black text-violet-500">{money(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-extrabold">{t('الأكثر مبيعاً', 'Top sellers')}</h2>
          {top.length === 0 ? <p className="py-6 text-center text-sm text-muted">{t('لا توجد مبيعات بعد', 'No sales yet')}</p> : (
            <div className="space-y-2.5">
              {top.slice(0, 6).map(p => {
                const max = top[0].qty || 1;
                return (
                  <div key={p.product_name}>
                    <div className="mb-1 flex justify-between text-xs"><span className="truncate font-bold">{p.product_name}</span><span className="text-muted">{fmt(p.qty)} · <span className="font-bold text-emerald-500">{money(p.profit)}</span></span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface2"><motion.div initial={{ width: 0 }} animate={{ width: `${(p.qty / max) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
