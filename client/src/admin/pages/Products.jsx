import React, { useEffect, useRef, useState } from 'react';
import { api, fileToDataUrl } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import { SPEC_SCHEMAS } from '../../lib/catalog.js';
import { PageHead } from './Dashboard.jsx';

const empty = { code: '', name: '', category_id: '', purchase_price: '', sale_price: '', stock: '', min_stock: '', specs: {}, image: '', featured: 0 };

export default function Products() {
  const { t, money, fmt, pick } = usePrefs();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [low, setLow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [catOpen, setCatOpen] = useState(false);

  const load = () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (cat) p.set('category_id', cat);
    if (low) p.set('low', '1');
    return api(`/products?${p}`).then(setItems).catch(e => toast(e.message, 'error'));
  };
  const loadCats = () => api('/categories').then(setCats).catch(() => {});
  useEffect(() => { loadCats(); }, []);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [q, cat, low]);

  const remove = async (p) => {
    if (!confirm(t(`حذف "${p.name}"؟`, `Delete "${p.name}"?`))) return;
    try { await api(`/products/${p.id}`, { method: 'DELETE' }); load(); toast(t('تم الحذف', 'Deleted')); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <PageHead title={t('المنتجات والمخزون', 'Products & stock')} sub={`${items.length} ${t('منتج', 'products')}`}>
        <button onClick={() => setCatOpen(true)} className="btn-ghost">{t('الفئات', 'Categories')}</button>
        <button onClick={() => setEdit({ ...empty })} className="btn-primary">+ {t('منتج جديد', 'New product')}</button>
      </PageHead>

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1"><label className="label">{t('بحث', 'Search')}</label><input className="input" placeholder={t('اسم أو كود...', 'Name or code...')} value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="w-52"><label className="label">{t('الفئة', 'Category')}</label>
          <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">{t('الكل', 'All')}</option>
            {cats.map(c => <option key={c.id} value={c.id}>{pick(c, 'name')}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm font-bold text-muted"><input type="checkbox" checked={low} onChange={e => setLow(e.target.checked)} className="accent-violet-500" />{t('تحت حد الطلب', 'Low stock')}</label>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr>
            <th></th><th>{t('المنتج', 'Product')}</th><th>{t('الفئة', 'Category')}</th><th>{t('شراء', 'Cost')}</th><th>{t('بيع', 'Price')}</th>
            <th>{t('المخزون', 'Stock')}</th><th></th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted">{t('لا توجد منتجات', 'No products')}</td></tr>}
            {items.map(p => (
              <tr key={p.id}>
                <td className="w-14"><ProductImage src={p.image} slug={p.category_slug} name={p.name} className="h-11 w-11" rounded="rounded-lg" /></td>
                <td>
                  <div className="font-bold">{p.name} {p.featured ? <span className="text-pink-500">★</span> : null}</div>
                  <div className="font-mono text-[11px] text-muted">{p.code || '—'}</div>
                </td>
                <td className="text-muted">{pick({ name: p.category_name, name_en: cats.find(c => c.id === p.category_id)?.name_en }, 'name') || '—'}</td>
                <td className="text-muted">{money(p.purchase_price)}</td>
                <td className="font-bold">{money(p.sale_price)}</td>
                <td><span className={`chip ${p.stock <= p.min_stock ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'}`}>{fmt(p.stock)}</span></td>
                <td><div className="flex gap-1">
                  <button onClick={() => setEdit({ ...p, category_id: p.category_id || '' })} className="btn-ghost btn-sm">{t('تعديل', 'Edit')}</button>
                  <button onClick={() => remove(p)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && <ProductForm product={edit} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {catOpen && <CategoriesModal cats={cats} onClose={() => setCatOpen(false)} onChanged={loadCats} />}
    </div>
  );
}

function SpecField({ field, value, onChange }) {
  const v = Array.isArray(value) ? value.join(', ') : (value ?? '');
  if (field.type === 'select') return (
    <select className="input" value={v} onChange={e => onChange(e.target.value)}>
      <option value="">—</option>{field.options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
  if (field.type === 'csv') return <input className="input" dir="ltr" value={v} placeholder={field.hint} onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />;
  return <input type={field.type === 'number' ? 'number' : 'text'} step="any" dir="ltr" className="input" value={v} placeholder={field.hint}
    onChange={e => onChange(field.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)} />;
}

function ProductForm({ product, cats, onClose, onSaved }) {
  const { t, lang, pick } = usePrefs();
  const toast = useToast();
  const fileRef = useRef(null);
  const [f, setF] = useState(() => ({ ...product, specs: typeof product.specs === 'string' ? JSON.parse(product.specs || '{}') : (product.specs || {}) }));
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState('');
  const isNew = !product.id;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const catSlug = cats.find(c => String(c.id) === String(f.category_id))?.slug;
  const specFields = SPEC_SCHEMAS[catSlug] || [];

  const upload = async (file) => {
    if (!file) return;
    setImgBusy('upload');
    try {
      const { url } = await api('/uploads', { method: 'POST', body: { data: await fileToDataUrl(file) } });
      setF(prev => ({ ...prev, image: url }));
      toast(t('تم رفع الصورة', 'Image uploaded'));
    } catch (e) { toast(e.message, 'error'); } finally { setImgBusy(''); }
  };

  const aiImage = async () => {
    if (!f.name.trim()) return toast(t('اكتب اسم المنتج أولاً', 'Enter the product name first'), 'error');
    setImgBusy('ai');
    try {
      const { url } = await api('/ai/product-image', { method: 'POST', body: { name: f.name } });
      setF(prev => ({ ...prev, image: url }));
      toast(t('تم توليد الصورة بالذكاء الاصطناعي', 'AI image generated'));
    } catch (e) { toast(e.message, 'error'); } finally { setImgBusy(''); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, category_id: f.category_id || null };
      if (isNew) await api('/products', { method: 'POST', body });
      else await api(`/products/${f.id}`, { method: 'PUT', body });
      toast(t('تم الحفظ', 'Saved'));
      onSaved();
    } catch (e2) { toast(e2.message, 'error'); setBusy(false); }
  };

  return (
    <Modal title={isNew ? t('منتج جديد', 'New product') : t('تعديل منتج', 'Edit product')} onClose={onClose} xwide>
      <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
        {/* الصورة */}
        <div className="space-y-2">
          <div className="relative">
            <ProductImage src={f.image} slug={catSlug} name={f.name} className="aspect-square w-full" />
            {imgBusy && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" /></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current.click()} disabled={!!imgBusy} className="btn-ghost w-full">📁 {t('رفع صورة', 'Upload image')}</button>
          <button type="button" onClick={aiImage} disabled={!!imgBusy} className="btn-neon w-full py-2 text-xs">✨ {t('توليد بـ GPT', 'Generate with GPT')}</button>
          {f.image && <button type="button" onClick={() => setF({ ...f, image: '' })} className="w-full text-xs font-bold text-red-500">{t('إزالة الصورة', 'Remove image')}</button>}
          <input className="input text-xs" dir="ltr" placeholder={t('أو رابط صورة', 'or image URL')} value={f.image || ''} onChange={set('image')} />
        </div>

        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">{t('اسم المنتج', 'Product name')} *</label><input className="input" value={f.name} onChange={set('name')} required /></div>
          <div><label className="label">{t('الكود / الباركود', 'Code / barcode')}</label><input className="input" dir="ltr" value={f.code || ''} onChange={set('code')} /></div>
          <div><label className="label">{t('الفئة', 'Category')}</label>
            <select className="input" value={f.category_id || ''} onChange={set('category_id')}>
              <option value="">{t('بدون فئة', 'No category')}</option>
              {cats.map(c => <option key={c.id} value={c.id}>{pick(c, 'name')}</option>)}
            </select>
          </div>
          <div><label className="label">{t('سعر الشراء', 'Cost price')}</label><input type="number" step="any" min="0" className="input" value={f.purchase_price} onChange={set('purchase_price')} /></div>
          <div><label className="label">{t('سعر البيع', 'Sale price')}</label><input type="number" step="any" min="0" className="input" value={f.sale_price} onChange={set('sale_price')} /></div>
          <div><label className="label">{t('الكمية', 'Stock')}</label><input type="number" step="any" className="input" value={f.stock} onChange={set('stock')} /></div>
          <div><label className="label">{t('حد الطلب', 'Reorder level')}</label><input type="number" step="any" min="0" className="input" value={f.min_stock} onChange={set('min_stock')} /></div>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={!!f.featured} onChange={e => setF({ ...f, featured: e.target.checked ? 1 : 0 })} className="accent-violet-500" />★ {t('منتج مميز (يظهر أولاً في المتجر)', 'Featured (shown first in store)')}</label>

          {specFields.length > 0 && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-3 sm:col-span-2">
              <div className="mb-2 text-xs font-black text-violet-500">🧩 {t('مواصفات التوافق — للمُجمّع', 'Compatibility specs — used by the builder')}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {specFields.map(sf => (
                  <div key={sf.key}><label className="label">{sf[lang]}</label><SpecField field={sf} value={f.specs[sf.key]} onChange={v => setF(prev => ({ ...prev, specs: { ...prev.specs, [sf.key]: v } }))} /></div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 sm:col-span-2">
            <button disabled={busy} className="btn-primary flex-1">{busy ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ', 'Save')}</button>
            <button type="button" onClick={onClose} className="btn-ghost">{t('إلغاء', 'Cancel')}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function CategoriesModal({ cats, onClose, onChanged }) {
  const { t, pick } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState({ name: '', name_en: '' });

  const add = async (e) => {
    e.preventDefault();
    try { await api('/categories', { method: 'POST', body: f }); setF({ name: '', name_en: '' }); onChanged(); }
    catch (e2) { toast(e2.message, 'error'); }
  };
  const del = async (c) => {
    if (!confirm(t(`حذف فئة "${c.name}"؟`, `Delete "${pick(c, 'name')}"?`))) return;
    await api(`/categories/${c.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <Modal title={t('إدارة الفئات', 'Manage categories')} onClose={onClose}>
      <form onSubmit={add} className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-2">
        <input className="input" placeholder={t('الاسم بالعربي', 'Arabic name')} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
        <input className="input" dir="ltr" placeholder="English name" value={f.name_en} onChange={e => setF({ ...f, name_en: e.target.value })} />
        <button className="btn-primary">+</button>
      </form>
      <ul className="max-h-[50vh] divide-y divide-line overflow-y-auto">
        {cats.map(c => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span className="font-bold">{c.name} <span className="text-xs font-normal text-muted">{c.name_en} · {c.product_count}</span>
              {c.slug && <span className="chip ms-1 bg-violet-500/10 font-mono text-violet-500">{c.slug}</span>}</span>
            <button onClick={() => del(c)} className="btn-danger btn-sm">{t('حذف', 'Delete')}</button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
