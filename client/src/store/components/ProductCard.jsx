import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import { specText, ALL_SLOTS } from '../../lib/catalog.js';

// نقطة مضيئة تطير من الزر إلى عداد التجميعة في الشريط العلوي
function flyToBuild(fromEl) {
  const target = document.querySelector('[data-build-counter]');
  if (!target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const dot = document.createElement('div');
  dot.style.cssText = `position:fixed;z-index:9999;left:${a.left + a.width / 2 - 8}px;top:${a.top + a.height / 2 - 8}px;width:16px;height:16px;border-radius:9999px;pointer-events:none;background:linear-gradient(135deg,#22d3ee,#8b5cf6,#f472b6);box-shadow:0 0 18px #8b5cf6`;
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy - 120}px) scale(1.4)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0.2 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
    dot.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 350 });
  };
}

// بطاقة منتج بإمالة ثلاثية الأبعاد تتبع المؤشر
export default function ProductCard({ product: p, onAdd, onOrder, inBuild, index = 0 }) {
  const { t, lang, money, pick } = usePrefs();
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 18 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const [added, setAdded] = React.useState(false);
  const handleAdd = (e) => {
    onAdd(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
    flyToBuild(e.currentTarget);
  };
  const reset = () => { x.set(0); y.set(0); };
  const buildable = ALL_SLOTS.some(s => s.slug === p.category_slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      style={{ perspective: 900 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="spotlight group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow duration-300 hover:shadow-glow"
      >
        <div className="relative overflow-hidden">
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.08]">
            <ProductImage src={p.image} slug={p.category_slug} name={p.name} className="aspect-[4/3] w-full" rounded="rounded-none" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent" />
          <div className="absolute start-3 top-3 flex gap-1.5">
            {p.featured && <span className="chip bg-gradient-to-r from-pink-500 to-violet-600 text-white">★ {t('مميز', 'Featured')}</span>}
            {!p.available && <span className="chip bg-black/60 text-white">{t('نفد', 'Sold out')}</span>}
            {inBuild && <span className="chip bg-emerald-500 text-white">✔ {t('في التجميعة', 'In build')}</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4" style={{ transform: 'translateZ(30px)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-violet-500">{pick({ name: p.category, name_en: p.category_en }, 'name')}</div>
          <h3 className="mt-0.5 line-clamp-2 font-extrabold leading-snug">{p.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {specText(p.specs).map((s, i) => <span key={i} className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{s}</span>)}
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <span className="font-display text-lg font-black">{money(p.price)}</span>
            <div className="flex gap-1.5">
              {buildable && onAdd && (
                <motion.button whileTap={{ scale: 0.85 }} disabled={!p.available} onClick={handleAdd} title={t('أضف للتجميعة', 'Add to build')}
                  className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border text-lg font-bold transition disabled:opacity-40 ${added ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-line bg-surface2 hover:border-violet-400 hover:text-violet-500'}`}>
                  <motion.span key={added ? 'ok' : 'plus'} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{added ? '✓' : '+'}</motion.span>
                </motion.button>
              )}
              <button disabled={!p.available} onClick={() => onOrder(p)} className="btn-primary h-9 px-3 text-xs">{t('اطلب', 'Order')}</button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
