import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePrefs } from '../../shared/prefs.jsx';
import { useBuild } from '../build.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import HeroRig from './HeroRig.jsx';
import { Magnetic, ScrambleText } from '../../shared/fx/index.jsx';

const AUTOPLAY_MS = 6500;

// كاروسيل الصفحة الرئيسية: سلايدات متحركة (تلقائي + سحب + أسهم + لوحة مفاتيح)
export default function HeroCarousel({ bundles = [] }) {
  const { t, isRTL, money, pick } = usePrefs();
  const { catalog } = useBuild();
  const reduce = useReducedMotion();
  const products = catalog?.products || [];

  const bySlug = (slugs, n = 4) => products.filter(p => slugs.includes(p.category_slug) && p.available)
    .sort((a, b) => (b.featured - a.featured) || (b.price - a.price)).slice(0, n);

  const slides = useMemo(() => {
    const gpus = bySlug(['gpu'], 3);
    const minGpu = gpus.length ? Math.min(...products.filter(p => p.category_slug === 'gpu').map(p => p.price)) : 0;
    const list = [
      {
        key: 'brand', theme: 'from-cyan-500/25 via-violet-600/20 to-transparent', accent: 'from-cyan-400 via-violet-500 to-pink-500',
        kicker: t('مرحباً بك في', 'Welcome to'),
        title: <span dir="ltr" className="glitch neon-text font-display" data-text="COMPUTER DOS"><ScrambleText text="COMPUTER DOS" /></span>,
        sub: t('ابنِ سيتب أحلامك', 'Build your dream setup'),
        body: t('قطع أصلية، مُجمّع ذكي يفحص التوافق لحظياً، وباندلز جاهزة للجيمرز والستريمرز.', 'Genuine parts, a smart builder with live compatibility checks, and ready bundles for gamers & streamers.'),
        cta: { to: '/builder', label: t('ابدأ التجميع', 'Start building') }, cta2: { to: '/shop', label: t('تصفح المتجر', 'Browse shop') },
        visual: <div className="mx-auto w-[78%] max-w-sm"><HeroRig /></div>,
      },
      {
        key: 'ai', theme: 'from-violet-600/30 via-fuchsia-500/15 to-transparent', accent: 'from-violet-400 to-fuchsia-500',
        kicker: 'GPT · AI',
        title: <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">{t('الذكاء الاصطناعي يجمّعلك', 'Let AI build it')}</span>,
        sub: t('قول ميزانيتك… والباقي علينا', 'Tell it your budget… done'),
        body: t('مساعد GPT يختار أفضل تجميعة متوافقة من المخزون الحقيقي، ويولّد صورة لشكل السيتب قبل الشراء.', 'The GPT assistant picks the best compatible build from live stock and renders your setup before you buy.'),
        cta: { to: '/builder', label: t('جرّب التوصية الذكية', 'Try smart recommend') },
        visual: <AIVisual />,
      },
      {
        key: 'streamer', theme: 'from-pink-600/30 via-rose-500/15 to-transparent', accent: 'from-pink-400 to-rose-500',
        kicker: <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />LIVE</span>,
        title: <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">{t('سيتب الستريمر', 'Streamer setup')}</span>,
        sub: t('ابدأ البث من النهارده', 'Go live today'),
        body: t('ميكروفون احترافي، كاميرا، كرت التقاط وإضاءة RGB — كل اللي تحتاجه في مكان واحد.', 'Pro mic, webcam, capture card and RGB lighting — everything you need in one place.'),
        cta: { to: '/streamer', label: t('اكتشف السيتب', 'Explore setup') },
        visual: <Collage items={bySlug(['mic', 'webcam', 'capture_card', 'lights', 'headset'], 4)} />,
      },
    ];

    bundles.slice(0, 2).forEach((b, i) => {
      const save = Math.max(0, b.computed_price - b.price);
      list.push({
        key: `bundle-${b.id}`, theme: i % 2 ? 'from-emerald-500/25 via-teal-500/15 to-transparent' : 'from-blue-500/25 via-cyan-500/15 to-transparent',
        accent: i % 2 ? 'from-emerald-400 to-teal-500' : 'from-blue-400 to-cyan-400',
        kicker: b.type === 'streamer' ? t('باندل ستريمر', 'Streamer bundle') : t('باندل PC', 'PC bundle'),
        title: <span className={`bg-gradient-to-r ${i % 2 ? 'from-emerald-400 to-teal-400' : 'from-blue-400 to-cyan-300'} bg-clip-text text-transparent`}>{pick(b, 'name')}</span>,
        sub: <span className="font-display" dir="ltr">{money(b.price)}</span>,
        body: pick(b, 'description'),
        badge: save > 0 ? `${t('وفّر', 'Save')} ${money(save)}` : null,
        cta: { to: '/bundles', label: t('اطلب الباندل', 'Get the bundle') },
        visual: <Collage items={b.items.map(it => ({ id: it.product_id, name: it.name, image: it.image, category_slug: it.category_slug, price: it.price }))} />,
      });
    });

    if (gpus.length) {
      list.push({
        key: 'gpu', theme: 'from-amber-500/25 via-orange-500/10 to-transparent', accent: 'from-amber-400 to-orange-500',
        kicker: t('عرض الأسبوع', 'Weekly spotlight'),
        title: <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">{t('كروت الشاشة', 'Graphics cards')}</span>,
        sub: <>{t('تبدأ من', 'From')} <span className="font-display" dir="ltr">{money(minGpu)}</span></>,
        body: t('RTX و Radeon لكل الميزانيات — أداء خرافي في الألعاب والمونتاج.', 'RTX & Radeon for every budget — insane gaming and editing performance.'),
        cta: { to: '/shop?cat=gpu', label: t('تسوق الكروت', 'Shop GPUs') },
        visual: <Collage items={gpus} />,
      });
    }
    return list;
  }, [products, bundles, t, money, pick]);

  const [[index, dir], setState] = useState([0, 1]);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const count = slides.length;
  const i = ((index % count) + count) % count;

  const go = useCallback((d) => { setState(([idx]) => [idx + d, d]); setProgressKey(k => k + 1); }, []);
  const jump = (n) => { setState(([idx]) => [n, n > ((idx % count) + count) % count ? 1 : -1]); setProgressKey(k => k + 1); };

  // التشغيل التلقائي يعتمد على انتهاء أنيميشن شريط التقدم (CSS) — يتوقف عند المرور أو إخفاء التبويب
  const autoplay = !reduce && count > 1;
  useEffect(() => {
    const vis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  const rootRef = useRef(null);
  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(isRTL ? -1 : 1);
    if (e.key === 'ArrowLeft') go(isRTL ? 1 : -1);
  };

  const s = slides[i];
  // اتجاه الدخول يراعي RTL
  const sign = isRTL ? -1 : 1;
  const variants = {
    enter: (d) => ({ x: `${d * sign * 18}%`, opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d) => ({ x: `${-d * sign * 18}%`, opacity: 0, scale: 0.98 }),
  };

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      className="relative -mx-4 overflow-hidden outline-none sm:mx-0 sm:rounded-[2rem] sm:border sm:border-line"
    >
      <div className="relative min-h-[620px] bg-surface/40 sm:min-h-[560px] lg:h-[580px]">
        {/* خلفية متغيرة لكل سلايد */}
        <AnimatePresence initial={false}>
          <motion.div key={`bg-${s.key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
            className={`absolute inset-0 bg-gradient-to-br ${s.theme}`} />
        </AnimatePresence>
        <div className="cyber-grid absolute inset-0 opacity-70" />
        <motion.div key={`glow-${s.key}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 0.55 }} transition={{ duration: 1.2 }}
          className={`pointer-events-none absolute -bottom-40 end-[-10%] h-[520px] w-[520px] rounded-full bg-gradient-to-br ${s.accent} blur-[120px]`} />

        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={s.key}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              const swipe = info.offset.x + info.velocity.x * 0.2;
              if (swipe < -80) go(isRTL ? -1 : 1);
              else if (swipe > 80) go(isRTL ? 1 : -1);
            }}
            className="absolute inset-0 grid cursor-grab items-center gap-6 px-6 pb-20 pt-10 active:cursor-grabbing sm:px-12 lg:grid-cols-2 lg:pb-16"
          >
            {/* النص */}
            <div className="relative z-10 text-center lg:text-start">
              <Stagger i={0}><span className={`chip bg-gradient-to-r ${s.accent} px-3 py-1 text-xs text-white shadow-glow`}>{s.kicker}</span></Stagger>
              <Stagger i={1}><h2 className="mt-4 text-4xl font-black leading-[1.08] sm:text-6xl">{s.title}</h2></Stagger>
              <Stagger i={2}><p className="mt-2 text-2xl font-black text-fg sm:text-3xl">{s.sub}</p></Stagger>
              {s.body && <Stagger i={3}><p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted lg:mx-0">{s.body}</p></Stagger>}
              {s.badge && <Stagger i={3.5}><span className="chip mt-4 bg-emerald-500 px-3 py-1 text-white">🔥 {s.badge}</span></Stagger>}
              <Stagger i={4}>
                <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start" onPointerDownCapture={(e) => e.stopPropagation()}>
                  <Magnetic><Link to={s.cta.to} className="btn-neon shimmer px-7 py-3.5 text-base">{s.cta.label} →</Link></Magnetic>
                  {s.cta2 && <Magnetic strength={0.25}><Link to={s.cta2.to} className="btn-ghost px-7 py-3.5 text-base">{s.cta2.label}</Link></Magnetic>}
                </div>
              </Stagger>
            </div>

            {/* العنصر البصري */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: isRTL ? 4 : -4, y: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 140, damping: 18 }}
              className="pointer-events-none relative hidden select-none lg:block"
            >
              {s.visual}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* الأسهم */}
        {count > 1 && (
          <>
            <ArrowBtn side="start" onClick={() => go(-1)} label={t('السابق', 'Previous')} />
            <ArrowBtn side="end" onClick={() => go(1)} label={t('التالي', 'Next')} />
          </>
        )}

        {/* أشرطة التقدم */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-5 sm:px-12">
          <div className="flex items-center gap-2">
            {slides.map((sl, n) => (
              <button key={sl.key} onClick={() => jump(n)} aria-label={`${n + 1}`}
                className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-line/70 transition hover:h-2.5">
                {n < i && <span className={`absolute inset-0 bg-gradient-to-r ${sl.accent}`} />}
                {n === i && (
                  <span
                    key={`p-${progressKey}-${n}`}
                    className={`absolute inset-y-0 start-0 bg-gradient-to-r ${sl.accent} shadow-[0_0_10px_rgba(139,92,246,.8)]`}
                    style={autoplay
                      ? { animation: `carousel-progress ${AUTOPLAY_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }
                      : { width: '100%' }}
                    onAnimationEnd={() => go(1)}
                  />
                )}
              </button>
            ))}
            <span className="ms-2 font-display text-xs font-black text-muted" dir="ltr">{String(i + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stagger({ i, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.1 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function ArrowBtn({ side, onClick, label }) {
  const { isRTL } = usePrefs();
  // السهم يشير للخارج حسب الاتجاه
  const pointsLeft = (side === 'start') !== isRTL;
  return (
    <motion.button
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      onClick={onClick} aria-label={label}
      className={`glass absolute top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl text-fg shadow-glow transition hover:border-violet-400 md:flex ${side === 'start' ? 'start-4' : 'end-4'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={pointsLeft ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </motion.button>
  );
}

// مجموعة صور منتجات عائمة
function Collage({ items = [] }) {
  const { money } = usePrefs();
  const list = items.slice(0, 4);
  const pos = [
    'start-[8%] top-[6%] w-[46%] rotate-[-6deg]',
    'end-[6%] top-[2%] w-[40%] rotate-[5deg]',
    'start-[18%] bottom-[2%] w-[38%] rotate-[4deg]',
    'end-[12%] bottom-[8%] w-[42%] rotate-[-4deg]',
  ];
  return (
    <div className="relative mx-auto aspect-square max-w-md">
      <div className="absolute inset-[12%] rounded-full border border-dashed border-violet-400/30" style={{ animation: 'spin 40s linear infinite' }} />
      {list.map((p, n) => (
        <motion.div key={p.id ?? n}
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{ opacity: { delay: 0.25 + n * 0.1 }, scale: { delay: 0.25 + n * 0.1, type: 'spring', stiffness: 180, damping: 14 }, y: { delay: 1 + n * 0.3, duration: 3 + n * 0.4, repeat: Infinity, ease: 'easeInOut' } }}
          className={`absolute ${pos[n]}`}
        >
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_20px_50px_-15px_rgba(139,92,246,.55)]">
            <ProductImage src={p.image} slug={p.category_slug} name={p.name} className="aspect-square w-full" rounded="rounded-none" />
            <div className="px-3 py-2">
              <div className="truncate text-xs font-bold">{p.name}</div>
              {p.price ? <div className="text-xs font-black text-violet-500">{money(p.price)}</div> : null}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// رسم بصري لسلايد الذكاء الاصطناعي
function AIVisual() {
  const { t } = usePrefs();
  const chips = [t('السوكت متطابق ✔', 'Socket match ✔'), t('DDR5 متوافقة ✔', 'DDR5 compatible ✔'), t('الباور كافي ⚡', 'PSU OK ⚡'), t('ضمن الميزانية 💰', 'In budget 💰')];
  return (
    <div className="relative mx-auto aspect-square max-w-md">
      {[0, 1, 2].map(r => (
        <motion.div key={r} className="absolute inset-0 m-auto rounded-full border border-violet-400/40"
          style={{ width: `${45 + r * 22}%`, height: `${45 + r * 22}%` }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.25, 0.6] }} transition={{ duration: 3, repeat: Infinity, delay: r * 0.5 }} />
      ))}
      <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 6, repeat: Infinity }}
        className="absolute inset-0 m-auto flex h-40 w-40 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-cyan-400 via-violet-600 to-pink-500 font-display text-4xl font-black text-white shadow-[0_0_80px_rgba(139,92,246,.7)]">
        GPT
      </motion.div>
      {chips.map((c, n) => {
        const a = (n / chips.length) * Math.PI * 2 - Math.PI / 4;
        return (
          <div key={c} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + Math.cos(a) * 40}%`, top: `${50 + Math.sin(a) * 40}%` }}>
            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ opacity: { delay: 0.4 + n * 0.15 }, scale: { delay: 0.4 + n * 0.15 }, y: { duration: 2.6, repeat: Infinity, delay: n * 0.4 } }}
              className="glass block whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-bold text-fg shadow-glow">
              {c}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
