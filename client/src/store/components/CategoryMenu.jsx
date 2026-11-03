import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useBuild } from '../build.jsx';
import { CategoryArt } from '../../shared/ProductImage.jsx';
import { groupedCategories } from '../../lib/catalog.js';

const GROUP_GRADIENT = {
  parts: 'from-cyan-400 to-blue-600',
  peripherals: 'from-violet-400 to-indigo-600',
  streaming: 'from-pink-400 to-rose-600',
  more: 'from-emerald-400 to-teal-600',
};

export function useCategoryGroups() {
  const { catalog } = useBuild();
  return groupedCategories(catalog?.categories, catalog?.products);
}

/* ===================== قائمة منسدلة كبيرة في الشريط العلوي ===================== */
export function CategoryMegaMenu() {
  const { t, pick, lang } = usePrefs();
  const groups = useCategoryGroups();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const location = useLocation();
  const timer = useRef(null);

  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { if (open && !active && groups[0]) setActive(groups[0].key); }, [open, groups]);

  const enter = () => { clearTimeout(timer.current); setOpen(true); };
  const leave = () => { timer.current = setTimeout(() => setOpen(false), 160); };
  const current = groups.find(g => g.key === active) || groups[0];

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${open ? 'bg-violet-500/15 text-violet-500' : 'text-muted hover:text-fg'}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        {t('الأقسام', 'Categories')}
        <motion.svg animate={{ rotate: open ? 180 : 0 }} viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></motion.svg>
      </button>

      <AnimatePresence>
        {open && groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="absolute start-1/2 top-full z-50 mt-3 w-[min(92vw,780px)] -translate-x-1/2 rtl:translate-x-1/2"
          >
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgba(139,92,246,.45)]">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
              <div className="grid grid-cols-[210px_1fr]">
                {/* المجموعات */}
                <div className="space-y-1 border-e border-line bg-surface2/50 p-3">
                  {groups.map(g => (
                    <button key={g.key} onMouseEnter={() => setActive(g.key)} onFocus={() => setActive(g.key)}
                      className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm font-bold transition ${active === g.key ? 'text-white' : 'text-muted hover:text-fg'}`}>
                      {active === g.key && <motion.span layoutId="mega-group" className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${GROUP_GRADIENT[g.key]} shadow-glow`} />}
                      <CategoryArt slug={g.icon} className="relative h-7 w-7" />
                      <span className="relative flex-1">{g[lang]}</span>
                      <span className="relative text-[10px] opacity-80">{g.items.length}</span>
                    </button>
                  ))}
                  <Link to="/shop" className="mt-2 block rounded-2xl border border-dashed border-line px-3 py-2.5 text-center text-xs font-bold text-violet-500 hover:border-violet-400">
                    {t('كل المنتجات', 'All products')} →
                  </Link>
                </div>

                {/* الفئات داخل المجموعة */}
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {current && (
                      <motion.div key={current.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                        <h4 className={`mb-3 bg-gradient-to-r ${GROUP_GRADIENT[current.key]} bg-clip-text text-lg font-black text-transparent`}>{current[lang]}</h4>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {current.items.map((c, i) => (
                            <motion.div key={c.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                              <Link to={`/shop?cat=${c.key}`}
                                className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface2/40 p-3 text-center transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-glow">
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${GROUP_GRADIENT[current.key]} opacity-0 blur-md transition group-hover:opacity-40`} />
                                  <CategoryArt slug={c.slug} className="relative h-10 w-10 transition duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                </div>
                                <span className="text-xs font-bold leading-tight">{pick(c, 'name')}</span>
                                <span className="chip bg-violet-500/10 text-violet-500">{c.count}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===================== لوحة الأقسام للموبايل (Bottom Sheet) ===================== */
export function CategorySheet({ open, onClose }) {
  const { t, pick, lang } = usePrefs();
  const groups = useCategoryGroups();
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const go = (to) => { onClose(); nav(to); };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
            className="fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] overflow-hidden rounded-t-[2rem] border-t border-line bg-surface text-fg"
          >
            <div className="flex justify-center pb-1 pt-3"><span className="h-1.5 w-12 rounded-full bg-line" /></div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-lg font-black">{t('الأقسام', 'Categories')}</h3>
              <button onClick={() => go('/shop')} className="text-xs font-bold text-violet-500">{t('كل المنتجات', 'All products')} →</button>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 pb-8">
              {groups.map((g, gi) => (
                <div key={g.key}>
                  <div className={`mb-2 bg-gradient-to-r ${GROUP_GRADIENT[g.key]} bg-clip-text text-sm font-black text-transparent`}>{g[lang]}</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {g.items.map((c, i) => (
                      <motion.button key={c.key} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: gi * 0.06 + i * 0.03 }}
                        onClick={() => go(`/shop?cat=${c.key}`)}
                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface2/50 p-3 active:scale-95">
                        <CategoryArt slug={c.slug} className="h-10 w-10" />
                        <span className="text-[11px] font-bold leading-tight">{pick(c, 'name')}</span>
                        <span className="text-[10px] font-bold text-muted">{c.count}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ===================== قائمة جانبية للأقسام في صفحة المتجر ===================== */
export function CategorySidebar() {
  const { t, pick, lang } = usePrefs();
  const { catalog } = useBuild();
  const groups = useCategoryGroups();
  const [sp, setSp] = useSearchParams();
  const cat = sp.get('cat') || '';
  const [collapsed, setCollapsed] = useState({});
  const total = catalog?.products.length || 0;

  const select = (key) => {
    const n = new URLSearchParams(sp);
    key ? n.set('cat', key) : n.delete('cat');
    setSp(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="sticky top-24 space-y-1 self-start rounded-3xl border border-line bg-surface p-3">
      <div className="mb-2 px-2 pt-1 text-xs font-black uppercase tracking-widest text-muted">{t('الأقسام', 'Categories')}</div>
      <SideItem active={!cat} onClick={() => select('')} label={t('كل المنتجات', 'All products')} count={total} icon={
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
      } />
      {groups.map(g => {
        const isCollapsed = collapsed[g.key];
        return (
          <div key={g.key} className="pt-2">
            <button onClick={() => setCollapsed(c => ({ ...c, [g.key]: !c[g.key] }))}
              className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-start">
              <span className={`bg-gradient-to-r ${GROUP_GRADIENT[g.key]} bg-clip-text text-xs font-black text-transparent`}>{g[lang]}</span>
              <motion.svg animate={{ rotate: isCollapsed ? -90 : 0 }} viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {g.items.map(c => (
                    <SideItem key={c.key} active={cat === c.key} onClick={() => select(c.key)} label={pick(c, 'name')} count={c.count}
                      icon={<CategoryArt slug={c.slug} className="h-6 w-6" />} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </aside>
  );
}

function SideItem({ active, onClick, label, count, icon }) {
  return (
    <button onClick={onClick} className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-sm font-bold transition ${active ? 'text-white' : 'text-muted hover:bg-surface2 hover:text-fg'}`}>
      {active && <motion.span layoutId="side-cat" className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-glow" />}
      <span className="relative transition group-hover:scale-110">{icon}</span>
      <span className="relative flex-1 truncate">{label}</span>
      <span className={`relative rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-surface2'}`}>{count}</span>
    </button>
  );
}
