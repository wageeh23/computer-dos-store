import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import Modal from '../../shared/Modal.jsx';
import { generateSetupImage } from '../../lib/ai.js';

// تصور السيتب — GPT Image (أو بديل مجاني عند عدم وجود مفتاح)
export default function Visualizer({ items, usage = 'gaming', title, onClose }) {
  const { t } = usePrefs();
  const [state, setState] = useState({ loading: true, url: null, engine: null, error: null });
  const [round, setRound] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setState({ loading: true, url: null, engine: null, error: null });
    setImgLoaded(false);
    generateSetupImage({ items, usage })
      .then(r => alive && setState({ loading: false, url: r.url, engine: r.engine, error: null }))
      .catch(e => alive && setState({ loading: false, url: null, engine: null, error: e.message }));
    return () => { alive = false; };
  }, [round]);

  const busy = state.loading || (state.url && !imgLoaded);

  return (
    <Modal title={`✨ ${title || t('تصور السيتب', 'Setup preview')}`} onClose={onClose} xwide>
      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-surface2">
        {busy && !state.error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface2/90">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-400 border-r-violet-500" />
              <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-pink-500" style={{ animationDirection: 'reverse' }} />
            </div>
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-sm font-bold text-violet-500">
              {t('الذكاء الاصطناعي يرسم سيتبك...', 'AI is rendering your setup...')}
            </motion.p>
          </div>
        )}
        {state.error ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-5xl">🛰️</div>
            <p className="font-bold">{t('تعذر توليد الصورة', 'Could not generate the image')}</p>
            <p className="mt-1 text-xs text-muted">{state.error}</p>
            <button onClick={() => setRound(r => r + 1)} className="btn-ghost mt-4">{t('إعادة المحاولة', 'Retry')}</button>
          </div>
        ) : state.url && (
          <motion.img
            src={state.url} alt="setup"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: imgLoaded ? 1 : 0, scale: imgLoaded ? 1 : 1.04 }}
            transition={{ duration: 0.6 }}
            className="w-full object-cover"
            onLoad={() => setImgLoaded(true)}
            onError={() => setState(s => ({ ...s, error: t('فشل تحميل الصورة', 'Image failed to load') }))}
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {state.engine === 'gpt' ? t('مولّدة بواسطة GPT Image', 'Generated with GPT Image') : t('تصور تقريبي بالذكاء الاصطناعي', 'Approximate AI visualization')}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setRound(r => r + 1)} disabled={busy} className="btn-ghost">🎲 {t('تصور آخر', 'Another take')}</button>
          {state.url && imgLoaded && <a href={state.url} target="_blank" rel="noreferrer" download className="btn-primary">{t('فتح / تحميل', 'Open / download')}</a>}
        </div>
      </div>
    </Modal>
  );
}
