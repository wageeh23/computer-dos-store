import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { useBuild } from '../build.jsx';
import ProductCard from '../components/ProductCard.jsx';
import OrderModal from '../components/OrderModal.jsx';
import { CategorySidebar } from '../components/CategoryMenu.jsx';
import { CategoryArt } from '../../shared/ProductImage.jsx';
import { productInCat, catKey } from '../../lib/catalog.js';
import { ScrambleText } from '../../shared/fx/index.jsx';

export default function Shop() {
  const { t, pick } = usePrefs();
  const { catalog, error, selected, setSlot } = useBuild();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('featured');
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [orderP, setOrderP] = useState(null);
  const cat = sp.get('cat') || '';

  const products = catalog?.products || [];
  const cats = (catalog?.categories || []).filter(c => products.some(p => p.category_slug === c.slug));
  const inBuild = new Set(Object.values(selected).map(p => p.id));

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    const l = products.filter(p =>
      productInCat(p, cat) && (!onlyAvail || p.available) &&
      (!q || p.name.toLowerCase().includes(ql) || (p.code || '').toLowerCase().includes(ql)));
    const sorters = {
      featured: (a, b) => (b.featured - a.featured) || (b.available - a.available) || a.name.localeCompare(b.name),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
    };
    return l.sort(sorters[sort]);
  }, [products, cat, q, sort, onlyAvail]);

  const add = (p) => { setSlot(p.category_slug, p); toast(t(`أُضيف للتجميعة: ${p.name}`, `Added to build: ${p.name}`)); };

  if (error) return <div className="card text-center text-red-500">{t('تعذر تحميل المتجر', 'Could not load the shop')}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black sm:text-4xl">{t('المتجر', 'Shop')} <span className="neon-text font-display" dir="ltr"><ScrambleText text="DOS STORE" /></span></h1>
        <p className="mt-1 text-sm text-muted">{t('كل القطع والإكسسوارات بأسعار وتوفر لحظي', 'All parts & accessories with live prices and stock')}</p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* قائمة الأقسام الجانبية (سطح المكتب) */}
        <div className="hidden lg:block"><CategorySidebar /></div>

        <div className="min-w-0 space-y-5">
          {/* رقائق الفئات (الموبايل) */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar lg:hidden">
            <CatChip active={!cat} onClick={() => setSp({})} label={t('الكل', 'All')} />
            {cats.map(c => { const k = catKey(c); return <CatChip key={k} slug={c.slug} active={cat === k} onClick={() => setSp({ cat: k })} label={pick(c, 'name')} />; })}
          </div>

      <div className="card flex flex-wrap items-center gap-3">
        <input className="input min-w-52 flex-1" placeholder={t('ابحث عن منتج...', 'Search products...')} value={q} onChange={e => setQ(e.target.value)} />
        <select className="input w-auto" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="featured">{t('المميز أولاً', 'Featured')}</option>
          <option value="low">{t('السعر: الأقل', 'Price: low')}</option>
          <option value="high">{t('السعر: الأعلى', 'Price: high')}</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-bold text-muted">
          <input type="checkbox" checked={onlyAvail} onChange={e => setOnlyAvail(e.target.checked)} className="accent-violet-500" />
          {t('المتوفر فقط', 'In stock only')}
        </label>
        <span className="text-xs font-bold text-muted">{list.length} {t('منتج', 'items')}</span>
      </div>

      {!catalog ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface2" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card py-16 text-center text-muted">{t('لا توجد منتجات مطابقة', 'No matching products')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} inBuild={inBuild.has(p.id)} onAdd={add} onOrder={setOrderP} />)}
        </div>
      )}
        </div>
      </div>

      {orderP && <OrderModal items={[{ product: orderP }]} source="product" onClose={() => setOrderP(null)} />}
    </div>
  );
}

function CatChip({ active, onClick, label, slug }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition ${active ? 'border-transparent text-white' : 'border-line bg-surface text-muted hover:text-fg'}`}>
      {active && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600" />}
      {slug && <CategoryArt slug={slug} className="relative h-5 w-5" />}
      <span className="relative">{label}</span>
    </motion.button>
  );
}
