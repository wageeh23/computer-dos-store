import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUILDER_SLOTS, SETUP_SLOTS, groupBySlug, slotLabel } from '../../lib/catalog.js';
import { checkBuild } from '../../lib/compat.js';
import { usePrefs } from '../../shared/prefs.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import PartPicker from './PartPicker.jsx';
import CompatPanel from './CompatPanel.jsx';

// لوحة التجميع — مشتركة بين المتجر ولوحة التحكم
export default function BuildBoard({ products, selected, onPick, onClear, onClearAll, showSetup = false, children }) {
  const { t, lang, money } = usePrefs();
  const [pickSlug, setPickSlug] = useState(null);
  const [tab, setTab] = useState('pc');
  const bySlug = useMemo(() => groupBySlug(products), [products]);
  const slots = tab === 'pc' ? BUILDER_SLOTS : SETUP_SLOTS;

  const issues = useMemo(() => checkBuild(selected, t), [selected, t]);
  const total = Object.values(selected).reduce((s, p) => s + (p?.price || 0), 0);
  const errors = issues.filter(i => i.level === 'error').length;
  const pcDone = BUILDER_SLOTS.filter(s => selected[s.slug]).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {showSetup ? (
            <div className="flex rounded-xl border border-line bg-surface2/50 p-1">
              {[['pc', t('قطع الـ PC', 'PC Parts')], ['setup', t('إكسسوارات السيتب', 'Setup Gear')]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`relative rounded-lg px-4 py-1.5 text-xs font-bold ${tab === k ? 'text-white' : 'text-muted'}`}>
                  {tab === k && <motion.span layoutId="bb-tab" className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600" />}
                  <span className="relative">{l}</span>
                </button>
              ))}
            </div>
          ) : <h2 className="font-extrabold">{t('اختر قطعك', 'Pick your parts')}</h2>}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line/60">
                <motion.div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" animate={{ width: `${(pcDone / BUILDER_SLOTS.length) * 100}%` }} />
              </div>
              {pcDone}/{BUILDER_SLOTS.length}
            </div>
            {Object.keys(selected).length > 0 && <button onClick={onClearAll} className="text-xs font-bold text-red-500 hover:underline">{t('مسح الكل', 'Clear all')}</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {slots.map((slot, i) => {
              const p = selected[slot.slug];
              const count = (bySlug[slot.slug] || []).length;
              return (
                <motion.div key={slot.slug} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.035 }}>
                  <div
                    role="button"
                    onClick={() => setPickSlug(slot.slug)}
                    className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border bg-surface p-2.5 transition hover:-translate-y-0.5 hover:shadow-glow ${p ? 'border-violet-400/50' : 'border-dashed border-line hover:border-violet-400'}`}
                  >
                    {p && <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-cyan-400 via-violet-500 to-pink-500" />}
                    <ProductImage src={p?.image} slug={slot.slug} name={p?.name} className={`h-16 w-16 shrink-0 transition ${p ? '' : 'opacity-50 grayscale group-hover:opacity-90 group-hover:grayscale-0'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-muted">{slotLabel(slot.slug, lang)} <span className="opacity-60">({count})</span></div>
                      {p ? (
                        <>
                          <div className="line-clamp-2 text-sm font-bold leading-snug">{p.name}</div>
                          <div className="text-sm font-black text-violet-500">{money(p.price)}</div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-muted group-hover:text-violet-500">+ {t('اختر', 'Choose')} {slotLabel(slot.slug, lang)}</div>
                      )}
                    </div>
                    {p && (
                      <button onClick={(e) => { e.stopPropagation(); onClear(slot.slug); }} className="rounded-lg px-2 py-1 text-lg text-muted hover:bg-red-500/10 hover:text-red-500">×</button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <CompatPanel issues={issues} selected={selected} />
        <div className="rgb-border">
          <div className="rgb-inner p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-muted">{t('الإجمالي', 'Total')}</span>
              <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="neon-text font-display text-2xl font-black" dir="ltr">{money(total)}</motion.span>
            </div>
            {errors > 0 && (
              <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500">
                ⚠ {t(`${errors} مشكلة توافق تحتاج حلاً`, `${errors} compatibility issue(s) to fix`)}
              </p>
            )}
            {typeof children === 'function' ? children({ total, issues, errors }) : children}
          </div>
        </div>
      </div>

      {pickSlug && (
        <PartPicker slug={pickSlug} products={bySlug[pickSlug] || []} selected={selected}
          onPick={(p) => onPick(pickSlug, p)} onClose={() => setPickSlug(null)} />
      )}
    </div>
  );
}
