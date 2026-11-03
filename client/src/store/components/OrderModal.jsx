import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import { fireConfetti } from '../../shared/fx/index.jsx';

// طلب شراء: يُرسل للمحل ويظهر كإشعار في لوحة الأدمن
// props: items [{product, qty, slug}] أو bundle
export default function OrderModal({ items = [], bundle, source = 'build', onClose, onDone }) {
  const { t, money, pick } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState({ customer_name: '', phone: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');

  const lines = bundle
    ? bundle.items.map(i => ({ name: i.name, price: i.price, qty: i.qty, image: i.image, slug: i.category_slug }))
    : items.map(i => ({ name: i.product.name, price: i.product.price, qty: i.qty || 1, image: i.product.image, slug: i.slug || i.product.category_slug }));
  const total = bundle ? bundle.price : lines.reduce((s, l) => s + l.price * l.qty, 0);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const body = bundle
        ? { ...f, bundle_id: bundle.id }
        : { ...f, source, items: items.map(i => ({ product_id: i.product.id, qty: i.qty || 1 })) };
      const res = await fetch('/api/public/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(data);
      fireConfetti({ count: 180 });
      toast(t('تم إرسال طلبك — سنتواصل معك قريباً', 'Order sent — we will contact you soon'), 'order', { title: t(`طلب #${data.id}`, `Order #${data.id}`) });
      onDone?.();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={bundle ? `${t('طلب', 'Order')}: ${pick(bundle, 'name')}` : t('إرسال طلب شراء', 'Send purchase request')} onClose={onClose} wide>
      {done ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
          <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-4xl text-white shadow-glow-cyan">✔</motion.div>
          <h3 className="text-xl font-black">{t('تم استلام طلبك!', 'Order received!')}</h3>
          <p className="mt-1 text-sm text-muted">{t(`رقم الطلب #${done.id} — الإجمالي ${money(done.total)}`, `Order #${done.id} — total ${money(done.total)}`)}</p>
          <p className="mt-1 text-sm text-muted">{t('سيتواصل معك فريق المحل لتأكيد الطلب', 'Our team will call you to confirm')}</p>
          <button onClick={onClose} className="btn-primary mt-6">{t('تم', 'Done')}</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface2/40 p-2">
                <ProductImage src={l.image} slug={l.slug} name={l.name} className="h-11 w-11 shrink-0" rounded="rounded-lg" />
                <div className="min-w-0 flex-1 truncate text-sm font-bold">{l.qty > 1 && `${l.qty}× `}{l.name}</div>
                <div className="shrink-0 text-xs font-black text-violet-500">{money(l.price * l.qty)}</div>
              </div>
            ))}
            <div className="flex justify-between rounded-xl bg-surface2/60 px-3 py-2.5 font-black">
              <span>{t('الإجمالي', 'Total')}</span><span className="neon-text" dir="ltr">{money(total)}</span>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            {err && <div className="rounded-xl bg-red-500/10 p-2.5 text-sm font-bold text-red-500">{err}</div>}
            <div><label className="label">{t('الاسم', 'Name')} *</label><input className="input" value={f.customer_name} onChange={e => setF({ ...f, customer_name: e.target.value })} required /></div>
            <div><label className="label">{t('رقم الهاتف', 'Phone')} *</label><input className="input" dir="ltr" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} required /></div>
            <div><label className="label">{t('ملاحظات', 'Notes')}</label><textarea rows={3} className="input" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
            <button disabled={busy} className="btn-neon w-full">{busy ? t('جارٍ الإرسال...', 'Sending...') : t('أرسل الطلب', 'Send order')}</button>
            <p className="text-center text-[11px] text-muted">{t('لا يتم الدفع أونلاين — المحل يتواصل معك للتأكيد', 'No online payment — the shop will contact you to confirm')}</p>
          </form>
        </div>
      )}
    </Modal>
  );
}
