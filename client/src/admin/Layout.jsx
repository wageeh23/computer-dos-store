import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api, clearAuth, getUser } from './api.js';
import { usePrefs, PrefToggles } from '../shared/prefs.jsx';
import { useToast } from '../shared/toast.jsx';
import Modal from '../shared/Modal.jsx';
import { ScrollProgress } from '../shared/fx/index.jsx';

const I = {
  dash: 'M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 3v8h8V3z',
  orders: 'M6 2l-2 4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4zM4 6h16M16 10a4 4 0 0 1-8 0',
  build: 'M4 4h16v16H4zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3',
  sale: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  purchase: 'M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6M9 21h.01M20 21h.01',
  invoices: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8',
  products: 'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7zM3.3 7L12 12l8.7-5M12 22V12',
  bundles: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
  parties: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  reports: 'M18 20V10M12 20V4M6 20v-6',
  users: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM20 21a8 8 0 0 0-16 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};
const Ico = ({ d, className = 'h-[18px] w-[18px]' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function Layout() {
  const { t, isRTL } = usePrefs();
  const nav = useNavigate();
  const location = useLocation();
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [notif, setNotif] = useState(null);

  const groups = [
    { title: t('الرئيسية', 'Main'), links: [
      { to: '/', end: true, label: t('لوحة التحكم', 'Dashboard'), icon: I.dash },
      { to: '/orders', label: t('طلبات المتجر', 'Store orders'), icon: I.orders, badge: notif?.unseenCount },
      { to: '/builder', label: t('مُجمّع PC', 'PC builder'), icon: I.build },
    ] },
    { title: t('المبيعات', 'Sales'), links: [
      { to: '/sale/new', label: t('فاتورة بيع', 'New sale'), icon: I.sale },
      { to: '/purchase/new', label: t('فاتورة شراء', 'New purchase'), icon: I.purchase },
      { to: '/invoices', label: t('الفواتير', 'Invoices'), icon: I.invoices },
    ] },
    { title: t('البيانات', 'Data'), links: [
      { to: '/products', label: t('المنتجات والمخزون', 'Products & stock'), icon: I.products, badge: notif?.lowCount, badgeColor: 'bg-amber-500' },
      { to: '/bundles', label: t('الباندلز', 'Bundles'), icon: I.bundles },
      { to: '/parties', label: t('العملاء والموردون', 'Customers & suppliers'), icon: I.parties },
      { to: '/reports', label: t('التقارير', 'Reports'), icon: I.reports },
    ] },
    ...(isAdmin ? [{ title: t('الإدارة', 'Admin'), links: [
      { to: '/users', label: t('المستخدمون', 'Users'), icon: I.users },
      { to: '/settings', label: t('الإعدادات و AI', 'Settings & AI'), icon: I.settings },
    ] }] : []),
  ];

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    clearAuth();
    nav('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 border-b border-line p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-600 to-pink-500 font-display text-xs font-black text-white shadow-glow">DOS</span>
        <div className="leading-tight" dir="ltr">
          <div className="neon-text font-display text-sm font-black">COMPUTER DOS</div>
          <div className="text-[10px] font-bold tracking-widest text-muted">ADMIN PANEL</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map(g => (
          <div key={g.title}>
            <div className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-muted/70">{g.title}</div>
            <div className="space-y-0.5">
              {g.links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => `relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'text-white' : 'text-muted hover:bg-surface2 hover:text-fg'}`}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-glow" />}
                      <span className="relative"><Ico d={l.icon} /></span>
                      <span className="relative flex-1">{l.label}</span>
                      {l.badge > 0 && <span className={`relative min-w-5 rounded-full px-1.5 text-center text-[10px] font-black text-white ${l.badgeColor || 'bg-pink-500'}`}>{l.badge}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-surface2/60 p-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-black uppercase text-white">{user?.username?.[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{user?.username}</div>
            <div className="text-[10px] font-bold text-muted">{isAdmin ? t('مدير', 'Administrator') : t('موظف', 'Staff')}</div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => setPwOpen(true)} className="btn-ghost btn-sm">{t('كلمة المرور', 'Password')}</button>
          <button onClick={logout} className="btn btn-sm bg-red-500/15 text-red-500 hover:bg-red-500/25">{t('خروج', 'Logout')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-line bg-surface lg:block print:hidden">{sidebar}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
            <motion.aside initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }} transition={{ type: 'spring', damping: 26 }}
              className="fixed inset-y-0 start-0 z-50 w-64 border-e border-line bg-surface lg:hidden">{sidebar}</motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:ps-64">
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="btn-ghost h-9 w-9 p-0 lg:hidden">☰</button>
            <a href="/" target="_blank" rel="noreferrer" className="hidden text-xs font-bold text-violet-500 hover:underline sm:block">{t('فتح المتجر ↗', 'Open store ↗')}</a>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell onData={setNotif} />
            <PrefToggles />
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </div>
  );
}

// جرس الإشعارات: طلبات جديدة + مخزون منخفض، مع إشعارات المتصفح
function NotificationBell({ onData }) {
  const { t, money } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const lastSeen = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const d = await api('/notifications');
        if (!alive) return;
        if (lastSeen.current != null && d.lastOrderId > lastSeen.current) {
          const o = d.unseen[0];
          const msg = o ? `${o.customer_name} — ${money(o.total)}` : '';
          toast(msg, 'order', { title: t('طلب جديد من المتجر!', 'New store order!'), duration: 6000 });
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(t('طلب جديد — Computer DOS', 'New order — Computer DOS'), { body: msg, icon: '/icon-192.png' });
          }
        }
        lastSeen.current = d.lastOrderId;
        setData(d);
        onData?.(d);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const total = (data?.unseenCount || 0) + (data?.lowCount || 0);
  const canAsk = 'Notification' in window && Notification.permission === 'default';

  return (
    <div ref={boxRef} className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface2/60 transition hover:border-violet-400">
        <motion.svg animate={total ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}
          viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></motion.svg>
        {total > 0 && <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white">{total}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
            className="absolute end-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-extrabold">{t('الإشعارات', 'Notifications')}</span>
              {data?.unseenCount > 0 && (
                <button onClick={async () => { await api('/orders/seen', { method: 'POST' }); setData(d => ({ ...d, unseen: [], unseenCount: 0 })); onData?.({ ...data, unseenCount: 0 }); }}
                  className="text-xs font-bold text-violet-500">{t('تعليم كمقروء', 'Mark read')}</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {canAsk && (
                <button onClick={() => Notification.requestPermission()} className="w-full bg-violet-500/10 px-4 py-2 text-start text-xs font-bold text-violet-500">
                  🔔 {t('فعّل إشعارات سطح المكتب للطلبات الجديدة', 'Enable desktop notifications for new orders')}
                </button>
              )}
              {total === 0 && <p className="py-8 text-center text-sm text-muted">{t('لا توجد إشعارات', 'No notifications')}</p>}
              {data?.unseen.map(o => (
                <button key={o.id} onClick={() => { setOpen(false); nav('/orders'); }} className="flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-start hover:bg-surface2">
                  <span className="mt-0.5 text-lg">🛒</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{t('طلب جديد', 'New order')} #{o.id} — {o.customer_name}</div>
                    <div className="text-xs text-muted">{money(o.total)} · {o.created_at}</div>
                  </div>
                </button>
              ))}
              {data?.low.map(p => (
                <button key={p.id} onClick={() => { setOpen(false); nav('/products'); }} className="flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-start hover:bg-surface2">
                  <span className="mt-0.5 text-lg">⚠️</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-xs text-amber-500">{t(`مخزون منخفض: ${p.stock}`, `Low stock: ${p.stock}`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChangePassword({ onClose }) {
  const { t } = usePrefs();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api('/auth/change-password', { method: 'POST', body: form });
      toast(t('تم تغيير كلمة المرور', 'Password changed'));
      onClose();
    } catch (e2) { setErr(e2.message); }
  };

  return (
    <Modal title={t('تغيير كلمة المرور', 'Change password')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {err && <div className="rounded-xl bg-red-500/10 p-2.5 text-sm font-bold text-red-500">{err}</div>}
        <div><label className="label">{t('الحالية', 'Current')}</label><input type="password" className="input" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} required /></div>
        <div><label className="label">{t('الجديدة', 'New')}</label><input type="password" className="input" minLength={6} value={form.next} onChange={e => setForm({ ...form, next: e.target.value })} required /></div>
        <button className="btn-primary w-full">{t('حفظ', 'Save')}</button>
      </form>
    </Modal>
  );
}
