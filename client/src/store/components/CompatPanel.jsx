import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { powerNeed } from '../../lib/compat.js';

const STYLES = {
  error: 'border-red-500/30 bg-red-500/10 text-red-500',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
};
const ICONS = { error: '✖', warn: '⚠', ok: '✔' };

export default function CompatPanel({ issues, selected }) {
  const { t } = usePrefs();
  const need = powerNeed(selected);
  const watts = selected.psu?.specs?.watts || 0;
  const pct = watts ? Math.min(100, Math.round((need / watts) * 100)) : 0;
  const bar = pct > 90 ? 'from-red-500 to-pink-500' : pct > 70 ? 'from-amber-500 to-yellow-400' : 'from-emerald-400 to-cyan-400';
  const errors = issues.filter(i => i.level === 'error').length;
  const warns = issues.filter(i => i.level === 'warn').length;
  const showPower = selected.cpu || selected.gpu || selected.psu;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-extrabold">{t('فحص التوافق', 'Compatibility')}</h3>
        <div className="flex gap-1.5">
          {errors > 0 && <span className="chip bg-red-500/15 text-red-500">{errors} {t('مشكلة', 'issues')}</span>}
          {warns > 0 && <span className="chip bg-amber-500/15 text-amber-500">{warns} {t('تنبيه', 'warnings')}</span>}
          {!errors && !warns && issues.length > 0 && <span className="chip bg-emerald-500/15 text-emerald-500">{t('سليم', 'All good')} ✔</span>}
        </div>
      </div>

      {showPower && (
        <div className="mb-3 rounded-xl border border-line bg-surface2/50 p-3">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-semibold text-muted">⚡ {t('الاستهلاك التقديري', 'Estimated draw')} ~{need}W</span>
            <span className="font-bold">{watts ? `${watts}W` : t('بدون مزود', 'No PSU')}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line/60">
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${bar}`} animate={{ width: `${Math.max(4, watts ? pct : 0)}%` }} transition={{ type: 'spring', stiffness: 80 }} />
          </div>
        </div>
      )}

      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {issues.length === 0 && <p className="py-4 text-center text-xs text-muted">{t('اختر قطعاً لبدء الفحص', 'Pick parts to start checking')}</p>}
        <AnimatePresence initial={false}>
          {issues.map((i, idx) => (
            <motion.div key={i.msg + idx} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${STYLES[i.level]}`}>
              <span>{ICONS[i.level]}</span><span>{i.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
