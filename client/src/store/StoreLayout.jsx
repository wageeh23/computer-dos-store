import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useMotionValueEvent } from 'framer-motion';
import gsap from 'gsap';
import { usePrefs, PrefToggles } from '../shared/prefs.jsx';
import { useBuild } from './build.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import { CategoryMegaMenu, CategorySheet } from './components/CategoryMenu.jsx';
import { ScrollProgress, ParticleField, CursorRing, BootScreen } from '../shared/fx/index.jsx';

const Icon = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  shop: <path d="M4 7h16l-1.5 11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM8 7V5a4 4 0 0 1 8 0v2" />,
  build: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></>,
  bundle: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  stream: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3" /></>,
};

export default function StoreLayout() {
  const { t, shop } = usePrefs();
  const { count } = useBuild();
  const location = useLocation();
  const rootRef = useRef(null);

  const nav = [
    { to: '/', label: t('الرئيسية', 'Home'), icon: Icon.home, end: true },
    { to: '/shop', label: t('المتجر', 'Shop'), icon: Icon.shop },
    { to: '/builder', label: t('جمّع PC', 'PC Builder'), icon: Icon.build },
    { to: '/bundles', label: t('الباندلز', 'Bundles'), icon: Icon.bundle },
    { to: '/streamer', label: t('ستريمر', 'Streamer'), icon: Icon.stream },
  ];

  // كرات توهج متحركة بالخلفية
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.orb').forEach((orb, i) => {
        gsap.to(orb, { x: 'random(-140, 140)', y: 'random(-100, 100)', duration: 'random(8, 14)', repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.5 });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // توهج يتبع المؤشر
  const mx = useMotionValue(-500), my = useMotionValue(-500);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 }), sy = useSpring(my, { stiffness: 120, damping: 20 });
  useEffect(() => {
    const move = (e) => { mx.set(e.clientX - 200); my.set(e.clientY - 200); };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  // الشريط العلوي يصغر ويختفي عند التمرير لأسفل ويعود عند الصعود
  const { scrollY } = useScroll();
  const [compact, setCompact] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [catOpen, setCatOpen] = React.useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setCompact(v > 40);
    setHidden(v > 400 && v > prev + 4 ? true : v < prev - 4 ? false : hidden);
  });

  return (
    <div ref={rootRef} className="grain relative min-h-screen overflow-x-hidden pb-20 md:pb-0">
      <BootScreen lines={[
        'Initializing RGB controller...', 'Detecting CPU socket & chipset...', 'Loading GPU drivers...',
        'Scanning memory DDR4 / DDR5...', 'Syncing live inventory...', 'Connecting GPT assistant...',
      ]} />
      <ScrollProgress />
      <CursorRing />
      {/* الخلفية */}
      <ParticleField />
      <div className="cyber-grid pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb h-[28rem] w-[28rem] bg-cyan-500" style={{ top: '-12%', insetInlineEnd: '-6%' }} />
        <div className="orb h-96 w-96 bg-violet-600" style={{ top: '38%', insetInlineStart: '-10%' }} />
        <div className="orb h-80 w-80 bg-pink-500" style={{ bottom: '-12%', insetInlineEnd: '22%' }} />
      </div>
      <motion.div
        className="pointer-events-none fixed z-0 hidden h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl md:block"
        style={{ x: sx, y: sy, left: 0, top: 0 }}
      />

      {/* الشريط العلوي */}
      <motion.header
        animate={{ y: hidden ? -90 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`glass sticky top-0 z-40 border-x-0 border-t-0 transition-shadow ${compact ? 'shadow-[0_10px_40px_-10px_rgba(139,92,246,.35)]' : ''}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-all duration-300 ${compact ? 'py-1.5' : 'py-3'}`}>
          <Link to="/" className="group flex items-center gap-2.5">
            <motion.span
              whileHover={{ rotate: 8, scale: 1.06 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-600 to-pink-500 font-display text-sm font-black text-white shadow-glow"
            >DOS</motion.span>
            <div className="leading-tight" dir="ltr">
              <div className="neon-text font-display text-base font-black tracking-wide">{shop.shop_name || 'Computer DOS Store'}</div>
              <div className="text-[10px] font-semibold text-muted">PC PARTS · BUILDS · SETUPS</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <CategoryMegaMenu />
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `relative rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/15 via-violet-500/20 to-pink-500/15 ring-1 ring-violet-400/40" />}
                    <span className="relative">{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link to="/builder" data-build-counter className="relative flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface2/60 px-2.5 text-xs font-black text-fg transition hover:border-violet-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">{Icon.build}</svg>
              <AnimatePresence mode="popLayout">
                <motion.span key={count} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>{count}</motion.span>
              </AnimatePresence>
            </Link>
            <PrefToggles />
            <a href="/admin" className="hidden h-9 items-center rounded-xl border border-line px-3 text-xs font-bold text-muted transition hover:border-violet-400 hover:text-fg sm:flex">
              {t('دخول الأدمن', 'Admin login')}
            </a>
          </div>
        </div>
        <div className="beam" />
      </motion.header>

      <main className="relative z-10 mx-auto min-h-[70vh] max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="beam relative z-10" />
      <footer className="relative z-10 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted">
          <div>
            <span className="neon-text font-display font-black" dir="ltr">{shop.shop_name}</span>
            <span className="mx-2">·</span>
            {t('كل ما يحتاجه الـ PC والسيتب في مكان واحد', 'Everything your PC & setup needs, in one place')}
          </div>
          <div className="flex items-center gap-4">
            {shop.shop_phone && <span dir="ltr">📞 {shop.shop_phone}</span>}
            {shop.shop_address && <span>📍 {shop.shop_address}</span>}
            <a href="/admin" className="font-bold hover:text-fg">{t('دخول الأدمن', 'Admin login')}</a>
          </div>
        </div>
      </footer>

      {/* شريط تنقل سفلي للموبايل/أندرويد */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex justify-around border-x-0 border-b-0 px-1 py-1.5 md:hidden">
        {nav.slice(0, 2).map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-bold ${isActive ? 'text-violet-500' : 'text-muted'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
            {n.label}
          </NavLink>
        ))}
        <button onClick={() => setCatOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-bold text-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          {t('الأقسام', 'Categories')}
        </button>
        {nav.slice(2).map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-bold ${isActive ? 'text-violet-500' : 'text-muted'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <CategorySheet open={catOpen} onClose={() => setCatOpen(false)} />

      <AIAssistant />
    </div>
  );
}
