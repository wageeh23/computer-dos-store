import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { useBuild } from '../build.jsx';
import BundleCard from '../components/BundleCard.jsx';
import ProductCard from '../components/ProductCard.jsx';
import OrderModal from '../components/OrderModal.jsx';
import { SETUP_SLOTS } from '../../lib/catalog.js';

export default function Streamer() {
  const { t } = usePrefs();
  const { catalog, selected, setSlot } = useBuild();
  const toast = useToast();
  const [bundles, setBundles] = useState(null);
  const [orderP, setOrderP] = useState(null);

  useEffect(() => { fetch('/api/public/bundles?type=streamer').then(r => r.json()).then(setBundles).catch(() => setBundles([])); }, []);

  const gear = (catalog?.products || []).filter(p => SETUP_SLOTS.some(s => s.slug === p.category_slug));
  const inBuild = new Set(Object.values(selected).map(p => p.id));
  const add = (p) => { setSlot(p.category_slug, p); toast(t(`أُضيف للسيتب: ${p.name}`, `Added to setup: ${p.name}`)); };

  return (
    <div className="space-y-14">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rgb-border">
        <div className="rgb-inner scanline relative overflow-hidden p-8 text-center sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/15 via-transparent to-cyan-500/15" />
          <div className="relative">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
              <span className="h-2 w-2 rounded-full bg-white" /> LIVE
            </motion.div>
            <h1 className="neon-text font-display text-3xl font-black sm:text-5xl">{t('سيتب الستريمر', 'STREAMER SETUP')}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              {t('PC قوي للبث والألعاب + ميك احترافي + كاميرا + كرت التقاط + إضاءة RGB — ابدأ البث من يومك الأول',
                 'A powerful streaming PC + pro mic + webcam + capture card + RGB lighting — go live from day one')}
            </p>
            <Link to="/builder" className="btn-neon mt-6">{t('كوّن سيتبك بنفسك', 'Build your own setup')}</Link>
          </div>
        </div>
      </motion.section>

      <section>
        <h2 className="mb-6 text-2xl font-black">{t('باندلز الستريمر', 'Streamer bundles')}</h2>
        {!bundles ? <div className="h-64 animate-pulse rounded-2xl bg-surface2" />
          : bundles.length === 0 ? <div className="card py-12 text-center text-muted">{t('لا توجد باندلز ستريمر حالياً', 'No streamer bundles yet')}</div>
          : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{bundles.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}</div>}
      </section>

      {gear.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-black">{t('معدات الستريم', 'Streaming gear')}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {gear.map((p, i) => <ProductCard key={p.id} product={p} index={i} inBuild={inBuild.has(p.id)} onAdd={add} onOrder={setOrderP} />)}
          </div>
        </section>
      )}

      {orderP && <OrderModal items={[{ product: orderP }]} source="product" onClose={() => setOrderP(null)} />}
    </div>
  );
}
