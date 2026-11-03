import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import Visualizer from './Visualizer.jsx';
import OrderModal from './OrderModal.jsx';

export default function BundleCard({ bundle, index = 0 }) {
  const { t, money, pick } = usePrefs();
  const [open, setOpen] = useState(false);
  const [vis, setVis] = useState(false);
  const [order, setOrder] = useState(false);
  const isStreamer = bundle.type === 'streamer';
  const savings = Math.max(0, bundle.computed_price - bundle.price);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }} className="rgb-border">
      <div className="rgb-inner flex h-full flex-col overflow-hidden">
        {/* معرض صور مصغرة للأصناف */}
        <div className="group/g relative grid grid-cols-4 gap-1 bg-surface2/60 p-2">
          {bundle.items.slice(0, 8).map((it, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
              className="transition-transform duration-300 hover:z-10 hover:scale-110">
              <ProductImage src={it.image} slug={it.category_slug} name={it.name} className="aspect-square" rounded="rounded-lg" />
            </motion.div>
          ))}
          <div className="absolute start-3 top-3 flex gap-1.5">
            <span className={`chip ${isStreamer ? 'bg-pink-500' : 'bg-cyan-500'} text-white shadow`}>{isStreamer ? t('سيتب ستريمر', 'Streamer setup') : t('تجميعة PC', 'PC build')}</span>
            {savings > 0 && <span className="chip bg-emerald-500 text-white shadow">{t('وفّر', 'Save')} {money(savings)}</span>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-extrabold">{pick(bundle, 'name')}</h3>
          {pick(bundle, 'description') && <p className="mt-1.5 text-sm leading-relaxed text-muted">{pick(bundle, 'description')}</p>}

          <button onClick={() => setOpen(!open)} className="mt-3 flex items-center justify-between rounded-xl bg-surface2/60 px-3 py-2 text-xs font-bold transition hover:bg-surface2">
            <span>{t('المحتويات', 'Contents')} ({bundle.items.length})</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }}>▾</motion.span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-2 space-y-1">
                  {bundle.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs">
                      <ProductImage src={it.image} slug={it.category_slug} name={it.name} className="h-8 w-8 shrink-0" rounded="rounded-md" />
                      <span className={`flex-1 truncate font-semibold ${it.available ? '' : 'text-amber-500 line-through'}`}>{it.qty > 1 && `${it.qty}× `}{it.name}</span>
                      <span className="font-mono text-[10px] text-muted">{money(it.price * it.qty)}</span>
                    </li>
                  ))}
                </div>
              </motion.ul>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-4">
            <div className="mb-3 flex items-baseline justify-between">
              {savings > 0 && <span className="text-sm text-muted line-through" dir="ltr">{money(bundle.computed_price)}</span>}
              <span className="neon-text ms-auto font-display text-2xl font-black" dir="ltr">{money(bundle.price)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setVis(true)} className="btn-ghost text-xs">✨ {t('تصور', 'Visualize')}</button>
              <button onClick={() => setOrder(true)} disabled={!bundle.all_available} className="btn-neon shimmer py-2 text-xs">{t('اطلب الآن', 'Order now')}</button>
            </div>
            {!bundle.all_available && <p className="mt-2 text-center text-[11px] font-bold text-amber-500">{t('بعض الأصناف نفدت مؤقتاً', 'Some items are temporarily out of stock')}</p>}
          </div>
        </div>
      </div>
      {vis && <Visualizer items={bundle.items} usage={isStreamer ? 'streaming' : 'gaming'} title={pick(bundle, 'name')} onClose={() => setVis(false)} />}
      {order && <OrderModal bundle={bundle} onClose={() => setOrder(false)} />}
    </motion.div>
  );
}
