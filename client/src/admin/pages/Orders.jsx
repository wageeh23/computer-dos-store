import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { PageHead } from './Dashboard.jsx';
import { fireConfetti } from '../../shared/fx/index.jsx';

const STATUS = {
  new: { ar: 'جديد', en: 'New', c: 'bg-pink-500/15 text-pink-500' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed', c: 'bg-cyan-500/15 text-cyan-500' },
  done: { ar: 'مكتمل', en: 'Completed', c: 'bg-emerald-500/15 text-emerald-500' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', c: 'bg-slate-500/15 text-muted' },
};

export default function Orders() {
  const { t, lang, money } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);

  const load = () => api(`/orders${filter ? `?status=${filter}` : ''}`).then(setRows).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (o, status) => {
    try { await api(`/orders/${o.id}`, { method: 'PUT', body: { status } }); load(); toast(t('تم تحديث الحالة', 'Status updated')); }
    catch (e) { toast(e.message, 'error'); }
  };
  const toInvoice = async (o) => {
    if (!confirm(t('تحويل الطلب لفاتورة بيع؟ سيتم خصم المخزون.', 'Convert to a sale invoice? Stock will be deducted.'))) return;
    try {
      const inv = await api(`/orders/${o.id}/invoice`, { method: 'POST', body: {} });
      fireConfetti();
      toast(t(`تم إنشاء الفاتورة ${inv.number}`, `Invoice ${inv.number} created`));
      nav(`/invoices/${inv.id}`);
    } catch (e) { toast(e.message, 'error'); }
  };
  const del = async (o) => {
    if (!confirm(t('حذف الطلب؟', 'Delete order?'))) return;
    await api(`/orders/${o.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <PageHead title={t('طلبات المتجر', 'Store orders')} sub={t('الطلبات المرسلة من المتجر الإلكتروني', 'Requests sent from the online store')}>
        <div className="flex rounded-xl border border-line bg-surface p-1">
          {['', 'new', 'confirmed', 'done', 'cancelled'].map(k => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === k ? 'bg-violet-600 text-white' : 'text-muted'}`}>
              {k ? STATUS[k][lang] : t('الكل', 'All')}
            </button>
          ))}
        </div>
      </PageHead>

      {!rows ? <div className="h-40 animate-pulse rounded-2xl bg-surface2" /> : rows.length === 0 ? (
        <div className="card py-16 text-center text-muted">{t('لا توجد طلبات', 'No orders')}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={`card p-0 ${!o.seen ? 'ring-2 ring-pink-500/40' : ''}`}>
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-start">
                <span className="font-mono text-sm font-black">#{o.id}</span>
                <span className={`chip ${STATUS[o.status].c}`}>{STATUS[o.status][lang]}</span>
                {!o.seen && <span className="chip bg-pink-500 text-white">{t('جديد', 'NEW')}</span>}
                <span className="flex-1 font-bold">{o.customer_name} <span className="font-mono text-xs text-muted" dir="ltr">{o.phone}</span></span>
                <span className="text-xs text-muted">{o.created_at}</span>
                <span className="font-black text-violet-500">{money(o.total)}</span>
              </button>
              <AnimatePresence>
                {open === o.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-line p-4">
                      <table className="table">
                        <thead><tr><th>{t('الصنف', 'Item')}</th><th>{t('الكمية', 'Qty')}</th><th>{t('السعر', 'Price')}</th></tr></thead>
                        <tbody>{o.items.map((it, k) => <tr key={k}><td className="font-semibold">{it.name}</td><td>{it.qty}</td><td>{money(it.price * it.qty)}</td></tr>)}</tbody>
                      </table>
                      {o.notes && <p className="mt-3 rounded-xl bg-surface2/60 p-3 text-sm"><b>{t('ملاحظات:', 'Notes:')}</b> {o.notes}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={`tel:${o.phone}`} className="btn-ghost btn-sm">📞 {t('اتصال', 'Call')}</a>
                        <a href={`https://wa.me/${o.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">WhatsApp</a>
                        {o.status === 'new' && <button onClick={() => setStatus(o, 'confirmed')} className="btn-primary btn-sm">{t('تأكيد', 'Confirm')}</button>}
                        {!o.invoice_id && o.status !== 'cancelled' && <button onClick={() => toInvoice(o)} className="btn-success btn-sm">🧾 {t('تحويل لفاتورة', 'Convert to invoice')}</button>}
                        {o.invoice_id && <button onClick={() => nav(`/invoices/${o.invoice_id}`)} className="btn-ghost btn-sm">{t('عرض الفاتورة', 'View invoice')}</button>}
                        {o.status !== 'cancelled' && o.status !== 'done' && <button onClick={() => setStatus(o, 'cancelled')} className="btn-ghost btn-sm">{t('إلغاء', 'Cancel')}</button>}
                        <button onClick={() => del(o)} className="btn-danger btn-sm ms-auto">{t('حذف', 'Delete')}</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
