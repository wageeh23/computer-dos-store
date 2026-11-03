import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import { PageHead } from './Dashboard.jsx';

export default function Bundles() {
  const { t, money, pick } = usePrefs();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [edit, setEdit] = useState(null);

  const load = () => api('/bundles').then(setRows).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); api('/products').then(setProducts).catch(() => {}); }, []);

  const del = async (b) => {
    if (!confirm(t(`حذف "${b.name}"؟`, `Delete "${pick(b, 'name')}"?`))) return;
    await api(`/bundles/${b.id}`, { method: 'DELETE' });
    load();
  };
  const byId = new Map(products.map(p => [p.id, p]));

  return (
    <div>
      <PageHead title={t('الباندلز', 'Bundles')} sub={t('حزم جاهزة تظهر في المتجر', 'Ready packages shown in the store')}>
        <button onClick={() => setEdit({ name: '', name_en: '', description: '', description_en: '', type: 'pc', price: '', items: [], active: 1 })} className="btn-primary">+ {t('باندل جديد', 'New bundle')}</button>
      </PageHead>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.length === 0 && <div className="card col-span-full py-12 text-center text-muted">{t('لا توجد باندلز', 'No bundles')}</div>}
        {rows.map(b => {
          const items = JSON.parse(b.items || '[]');
          const computed = items.reduce((s, it) => s + (byId.get(it.product_id)?.sale_price || 0) * (it.qty || 1), 0);
          return (
            <div key={b.id} className="card flex flex-col">
              <div className="mb-3 grid grid-cols-6 gap-1">
                {items.slice(0, 6).map((it, i) => { const p = byId.get(it.product_id); return <ProductImage key={i} src={p?.image} slug={p?.category_slug} className="aspect-square" rounded="rounded-md" />; })}
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip ${b.type === 'streamer' ? 'bg-pink-500/15 text-pink-500' : 'bg-cyan-500/15 text-cyan-500'}`}>{b.type === 'streamer' ? t('ستريمر', 'Streamer') : 'PC'}</span>
                {!b.active && <span className="chip bg-surface2 text-muted">{t('مخفي', 'Hidden')}</span>}
              </div>
              <h3 className="mt-2 font-extrabold">{pick(b, 'name')}</h3>
              <p className="text-xs text-muted">{items.length} {t('صنف', 'items')}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="font-black text-violet-500">{money(b.price ?? computed)}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEdit({ ...b, items, price: b.price ?? '' })} className="btn-ghost btn-sm">{t('تعديل', 'Edit')}</button>
                  <button onClick={() => del(b)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {edit && <BundleForm bundle={edit} products={products} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function BundleForm({ bundle, products, onClose, onSaved }) {
  const { t, money } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState(bundle);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const byId = new Map(products.map(p => [p.id, p]));
  const sugg = q ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const computed = f.items.reduce((s, it) => s + (byId.get(it.product_id)?.sale_price || 0) * (it.qty || 1), 0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, price: f.price === '' ? null : f.price };
      if (f.id) await api(`/bundles/${f.id}`, { method: 'PUT', body }); else await api('/bundles', { method: 'POST', body });
      toast(t('تم الحفظ', 'Saved'));
      onSaved();
    } catch (e2) { toast(e2.message, 'error'); setBusy(false); }
  };

  return (
    <Modal title={f.id ? t('تعديل باندل', 'Edit bundle') : t('باندل جديد', 'New bundle')} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label className="label">{t('الاسم (عربي)', 'Name (Arabic)')} *</label><input className="input" value={f.name} onChange={set('name')} required /></div>
          <div><label className="label">Name (English)</label><input className="input" dir="ltr" value={f.name_en || ''} onChange={set('name_en')} /></div>
          <div><label className="label">{t('الوصف (عربي)', 'Description (Arabic)')}</label><textarea rows={2} className="input" value={f.description || ''} onChange={set('description')} /></div>
          <div><label className="label">Description (English)</label><textarea rows={2} dir="ltr" className="input" value={f.description_en || ''} onChange={set('description_en')} /></div>
          <div><label className="label">{t('النوع', 'Type')}</label>
            <select className="input" value={f.type} onChange={set('type')}><option value="pc">{t('تجميعة PC', 'PC build')}</option><option value="streamer">{t('سيتب ستريمر', 'Streamer setup')}</option></select>
          </div>
          <div><label className="label">{t('السعر', 'Price')} <span className="text-muted">({t('فارغ = تلقائي', 'empty = auto')}: {money(computed)})</span></label>
            <input type="number" min="0" step="any" className="input" value={f.price} onChange={set('price')} placeholder={Math.round(computed)} />
          </div>
        </div>
        <div>
          <label className="label">{t('الأصناف', 'Items')}</label>
          <div className="relative">
            <input className="input" placeholder={t('ابحث لإضافة منتج...', 'Search to add a product...')} value={q} onChange={e => setQ(e.target.value)} />
            {sugg.length > 0 && (
              <ul className="absolute inset-x-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface shadow-xl">
                {sugg.map(p => (
                  <li key={p.id}><button type="button" onClick={() => { if (!f.items.some(i => i.product_id === p.id)) setF({ ...f, items: [...f.items, { product_id: p.id, qty: 1, label: p.name }] }); setQ(''); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-surface2">
                    <ProductImage src={p.image} slug={p.category_slug} className="h-8 w-8" rounded="rounded-md" />
                    <span className="flex-1 font-semibold">{p.name}</span><span className="text-xs text-muted">{money(p.sale_price)}</span>
                  </button></li>
                ))}
              </ul>
            )}
          </div>
          <ul className="mt-2 space-y-1.5">
            {f.items.map((it, i) => { const p = byId.get(it.product_id); return (
              <li key={i} className="flex items-center gap-2 rounded-xl bg-surface2/60 p-1.5 text-sm">
                <ProductImage src={p?.image} slug={p?.category_slug} className="h-9 w-9" rounded="rounded-lg" />
                <span className="flex-1 font-semibold">{p?.name || it.label}</span>
                <input type="number" min="1" className="input w-16 py-1 text-center" value={it.qty} onChange={e => setF({ ...f, items: f.items.map((x, k) => k === i ? { ...x, qty: +e.target.value || 1 } : x) })} />
                <button type="button" onClick={() => setF({ ...f, items: f.items.filter((_, k) => k !== i) })} className="btn-danger btn-sm">×</button>
              </li>
            ); })}
          </ul>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!f.active} onChange={e => setF({ ...f, active: e.target.checked ? 1 : 0 })} className="accent-violet-500" />{t('معروض في المتجر', 'Visible in store')}</label>
        <div className="flex gap-2"><button disabled={busy} className="btn-primary flex-1">{t('حفظ', 'Save')}</button><button type="button" onClick={onClose} className="btn-ghost">{t('إلغاء', 'Cancel')}</button></div>
      </form>
    </Modal>
  );
}
