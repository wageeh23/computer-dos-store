import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import BundleCard from '../components/BundleCard.jsx';
import { ScrambleText } from '../../shared/fx/index.jsx';

export default function Bundles() {
  const { t } = usePrefs();
  const [bundles, setBundles] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetch('/api/public/bundles').then(r => r.json()).then(setBundles).catch(() => setBundles([])); }, []);

  const list = (bundles || []).filter(b => !filter || b.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">{t('الباندلز', 'Bundles')} <span className="neon-text font-display" dir="ltr"><ScrambleText text="READY PACKS" /></span></h1>
          <p className="mt-1 text-sm text-muted">{t('تجميعات مدروسة — متوافقة بالكامل وبسعر الحزمة', 'Curated builds — fully compatible at bundle prices')}</p>
        </div>
        <div className="flex rounded-xl border border-line bg-surface2/50 p-1">
          {[['', t('الكل', 'All')], ['pc', 'PC'], ['streamer', t('ستريمر', 'Streamer')]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`relative rounded-lg px-4 py-1.5 text-xs font-bold ${filter === k ? 'text-white' : 'text-muted'}`}>
              {filter === k && <motion.span layoutId="bf" className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      </div>
      {!bundles ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-96 animate-pulse rounded-2xl bg-surface2" />)}</div>
      ) : list.length === 0 ? (
        <div className="card py-16 text-center text-muted">{t('لا توجد باندلز حالياً', 'No bundles yet')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}
        </div>
      )}
    </div>
  );
}
