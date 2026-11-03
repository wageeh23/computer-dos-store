import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { useBuild } from '../build.jsx';
import BuildBoard from '../components/BuildBoard.jsx';
import Visualizer from '../components/Visualizer.jsx';
import OrderModal from '../components/OrderModal.jsx';
import { recommend, USAGE_TYPES } from '../../lib/recommend.js';
import { checkBuild, isComplete } from '../../lib/compat.js';
import { BUILDER_SLOTS } from '../../lib/catalog.js';
import { fireConfetti, ScrambleText } from '../../shared/fx/index.jsx';

export default function Builder() {
  const { t, lang, money } = usePrefs();
  const toast = useToast();
  const { catalog, error, selected, setSlot, clearSlot, clearAll, setSelected } = useBuild();
  const [visOpen, setVisOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [budget, setBudget] = useState('');
  const [usage, setUsage] = useState('gaming');

  // احتفال عند اكتمال تجميعة PC متوافقة بالكامل
  const perfect = isComplete(selected, BUILDER_SLOTS) && !checkBuild(selected).some(i => i.level === 'error');
  const wasPerfect = React.useRef(perfect);
  React.useEffect(() => {
    if (perfect && !wasPerfect.current) {
      fireConfetti();
      toast(t('تجميعة كاملة ومتوافقة 100% — جاهزة!', 'Complete & 100% compatible build — ready!'), 'success', { title: '🏆 ' + t('ممتاز', 'Perfect build') });
    }
    wasPerfect.current = perfect;
  }, [perfect]);

  if (error) return <div className="card text-center text-red-500">{t('تعذر تحميل الكتالوج', 'Could not load catalog')}</div>;
  if (!catalog) return <div className="py-24 text-center text-muted">{t('جارٍ التحميل...', 'Loading...')}</div>;

  const doRecommend = () => {
    const b = parseFloat(budget);
    if (!b || b <= 0) return toast(t('أدخل ميزانية صحيحة', 'Enter a valid budget'), 'error');
    const { selected: rec, total } = recommend(catalog.products, b, usage);
    if (!Object.keys(rec).length) return toast(t('لا توجد قطع متاحة', 'No parts available'), 'error');
    setSelected(rec);
    toast(total <= b
      ? t(`تجميعة متوافقة بـ ${money(total)}`, `Compatible build for ${money(total)}`)
      : t(`أقرب تجميعة: ${money(total)}`, `Closest build: ${money(total)}`), total <= b ? 'success' : 'info', { title: '🪄 ' + t('التوصية الذكية', 'Smart recommend') });
  };

  const items = Object.entries(selected).map(([slug, product]) => ({ slug, product }));
  const empty = items.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">{t('مُجمّع الـ', 'The')} <span className="neon-text font-display" dir="ltr"><ScrambleText text="PC BUILDER" /></span></h1>
          <p className="mt-1 text-sm text-muted">{t('اختر كل قطعة والنظام يفحص التوافق والطاقة لحظياً', 'Pick each part — compatibility and power are checked live')}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/10 to-pink-500/5" />
        <div className="relative flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="label">🪄 {t('التوصية الذكية — ميزانيتك', 'Smart recommend — your budget')}</label>
            <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)} placeholder="35000" className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{t('الاستخدام', 'Use case')}</label>
            <div className="flex rounded-xl border border-line bg-surface2/50 p-1">
              {USAGE_TYPES.map(u => (
                <button key={u.key} onClick={() => setUsage(u.key)} className={`relative rounded-lg px-3 py-1.5 text-xs font-bold ${usage === u.key ? 'text-white' : 'text-muted'}`}>
                  {usage === u.key && <motion.span layoutId="usage" className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600" />}
                  <span className="relative">{u[lang]}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={doRecommend} className="btn-neon py-2.5">{t('جمّعلي', 'Build it')}</button>
        </div>
        <p className="relative mt-2 text-[11px] text-muted">{t('أو افتح مساعد GPT (زر AI بالأسفل) واطلب أي تجميعة بالكلام', 'Or open the GPT assistant (AI button) and ask for any build in plain words')}</p>
      </motion.div>

      <BuildBoard products={catalog.products} selected={selected} onPick={setSlot} onClear={clearSlot} onClearAll={clearAll} showSetup>
        {({ errors }) => (
          <div className="mt-4 space-y-2">
            <button onClick={() => setOrderOpen(true)} disabled={empty || errors > 0} className="btn-neon w-full">{t('اطلب هذه التجميعة', 'Order this build')}</button>
            <button onClick={() => setVisOpen(true)} disabled={empty} className="btn-ghost w-full">✨ {t('تصور السيتب بالـ AI', 'Visualize with AI')}</button>
            {errors > 0 && <p className="text-center text-[11px] text-red-500">{t('حل مشاكل التوافق قبل الطلب', 'Fix compatibility issues before ordering')}</p>}
          </div>
        )}
      </BuildBoard>

      {visOpen && <Visualizer items={Object.values(selected)} usage={usage} title={t('تصور سيتبك', 'Your setup')} onClose={() => setVisOpen(false)} />}
      {orderOpen && <OrderModal items={items} source="build" onClose={() => setOrderOpen(false)} />}
    </div>
  );
}
