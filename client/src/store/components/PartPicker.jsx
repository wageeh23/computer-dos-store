import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { isCompatible, specArr } from '../../lib/compat.js';
import { slotLabel, specText } from '../../lib/catalog.js';
import { usePrefs } from '../../shared/prefs.jsx';
import Modal from '../../shared/Modal.jsx';
import ProductImage from '../../shared/ProductImage.jsx';

export default function PartPicker({ slug, products, selected, onPick, onClose }) {
  const { t, lang, money, fmt } = usePrefs();
  const [q, setQ] = useState('');
  const [compatOnly, setCompatOnly] = useState(true);
  const [sort, setSort] = useState('price');

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    return products
      .map(p => ({ p, ok: isCompatible(selected, slug, p) }))
      .filter(({ p, ok }) => (!compatOnly || ok) && (!q || p.name.toLowerCase().includes(ql) || (p.code || '').toLowerCase().includes(ql)))
      .sort((a, b) => sort === 'price' ? a.p.price - b.p.price : b.p.price - a.p.price);
  }, [products, q, compatOnly, selected, slug, sort]);

  return (
    <Modal title={`${t('اختر', 'Choose')}: ${slotLabel(slug, lang)}`} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ابحث بالاسم أو الكود...', 'Search by name or code...')} className="input min-w-48 flex-1" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto">
          <option value="price">{t('الأرخص أولاً', 'Price: low → high')}</option>
          <option value="-price">{t('الأغلى أولاً', 'Price: high → low')}</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-muted">
          <input type="checkbox" checked={compatOnly} onChange={(e) => setCompatOnly(e.target.checked)} className="accent-violet-500" />
          {t('المتوافق فقط', 'Compatible only')}
        </label>
      </div>

      <div className="grid max-h-[60vh] grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2">
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">{t('لا توجد منتجات مطابقة', 'No matching products')}</p>}
        {list.map(({ p, ok }, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            disabled={!p.available}
            onClick={() => { onPick(p); onClose(); }}
            className={`group flex items-center gap-3 rounded-2xl border border-line bg-surface2/40 p-2.5 text-start transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40 ${ok ? '' : 'opacity-60'}`}
          >
            <ProductImage src={p.image} slug={slug} name={p.name} className="h-16 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-bold leading-snug">{p.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {specText(p.specs).map((s, k) => <span key={k} className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">{s}</span>)}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-black text-violet-500">{money(p.price)}</span>
                {!ok && <span className="chip bg-red-500/15 text-red-500">{t('غير متوافق', 'Incompatible')}</span>}
                {!p.available && <span className="chip bg-amber-500/15 text-amber-500">{t('نفد', 'Sold out')}</span>}
                {p.available && p.stock <= 3 && <span className="chip bg-orange-500/15 text-orange-500">{t(`باقي ${fmt(p.stock)}`, `${fmt(p.stock)} left`)}</span>}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </Modal>
  );
}
