import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { useBuild } from '../build.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ProductCard from '../components/ProductCard.jsx';
import BundleCard from '../components/BundleCard.jsx';
import OrderModal from '../components/OrderModal.jsx';
import { CategoryArt } from '../../shared/ProductImage.jsx';
import { groupedCategories } from '../../lib/catalog.js';
import { Magnetic, CountUp, Reveal, SplitWords, Spotlight } from '../../shared/fx/index.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const { t, pick } = usePrefs();
  const { catalog, selected, setSlot } = useBuild();
  const toast = useToast();
  const [bundles, setBundles] = useState([]);
  const [orderP, setOrderP] = useState(null);

  useEffect(() => { fetch('/api/public/bundles').then(r => r.json()).then(setBundles).catch(() => {}); }, []);

  const products = catalog?.products || [];
  const featured = [...products].filter(p => p.available).sort((a, b) => (b.featured - a.featured) || (b.price - a.price)).slice(0, 8);
  const cats = (catalog?.categories || []).filter(c => products.some(p => p.category_slug === c.slug));
  const inBuild = new Set(Object.values(selected).map(p => p.id));
  const add = (p) => { setSlot(p.category_slug, p); toast(t(`أُضيف للتجميعة: ${p.name}`, `Added to build: ${p.name}`)); };

  // إعادة حساب مواضع ScrollTrigger بعد تحميل البيانات (تغيّر ارتفاع الصفحة)
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [products.length, bundles.length]);

  return (
    <div className="space-y-28">
      {/* ===================== CAROUSEL ===================== */}
      <HeroCarousel bundles={bundles} />

      {/* إحصائيات سريعة */}
      <Reveal className="grid grid-cols-3 gap-3">
        {[
          { n: products.length, l: t('منتج', 'Products'), c: 'from-cyan-400 to-blue-500' },
          { n: bundles.length, l: t('باندل', 'Bundles'), c: 'from-violet-400 to-fuchsia-500' },
          { n: cats.length, l: t('فئة', 'Categories'), c: 'from-pink-400 to-rose-500' },
        ].map(s => (
          <Spotlight key={s.l} className="glass rounded-2xl py-5 text-center">
            <div className={`bg-gradient-to-r ${s.c} bg-clip-text font-display text-3xl font-black text-transparent`} dir="ltr"><CountUp to={s.n} />+</div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">{s.l}</div>
          </Spotlight>
        ))}
      </Reveal>

      {/* ===================== MARQUEE ===================== */}
      {cats.length > 0 && (
        <section className="-mx-4 space-y-3">
          {[false, true].map(rev => (
            <div key={String(rev)} className="marquee py-1">
              <div className="marquee-track" style={rev ? { animationDirection: 'reverse', animationDuration: '40s' } : undefined}>
                {[...cats, ...cats].map((c, i) => (
                  <Link key={i} to={`/shop?cat=${c.slug}`}
                    className="group flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-line bg-surface/80 px-5 py-2.5 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-glow">
                    <CategoryArt slug={c.slug} className="h-7 w-7 transition group-hover:scale-125 group-hover:rotate-6" />
                    {pick(c, 'name')}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===================== CATEGORIES MENU ===================== */}
      <CategoryShowcase />

      {/* ===================== HOW IT WORKS (pinned) ===================== */}
      <HowItWorks />

      {/* ===================== FEATURED ===================== */}
      {featured.length > 0 && (
        <section>
          <SectionHead kicker={t('مختارات', 'Hand-picked')} title={t('الأكثر طلباً', 'Trending gear')} sub={t('قطع مختارة من مخزوننا الحقيقي', 'Hand-picked from our live stock')} to="/shop" more={t('كل المنتجات', 'All products')} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} inBuild={inBuild.has(p.id)} onAdd={add} onOrder={setOrderP} />)}
          </div>
        </section>
      )}

      {/* ===================== AI ===================== */}
      <AISection />

      {/* ===================== BUNDLES ===================== */}
      {bundles.length > 0 && (
        <section>
          <SectionHead kicker={t('وفّر أكثر', 'Save more')} title={t('باندلز جاهزة', 'Ready-made bundles')} sub={t('متوافقة 100% وبسعر الحزمة', '100% compatible at bundle prices')} to="/bundles" more={t('كل الباندلز', 'All bundles')} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {bundles.slice(0, 3).map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}
          </div>
        </section>
      )}

      {/* ===================== FINAL CTA ===================== */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-16 text-center sm:py-20">
          <div className="aurora" />
          <div className="cyber-grid absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              <span className="neon-text">{t('جاهز تبني', 'READY TO BUILD')}</span>{' '}
              <span className="text-fg">{t('وحشك؟', 'YOUR BEAST?')}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t('ابدأ من الصفر أو خلّي الذكاء الاصطناعي يجمّعلك — في أقل من دقيقة.', 'Start from scratch or let AI build it for you — in under a minute.')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Magnetic><Link to="/builder" className="btn-neon shimmer px-8 py-4 text-base">{t('افتح المُجمّع', 'Open the builder')} →</Link></Magnetic>
              <Magnetic strength={0.25}><Link to="/streamer" className="btn-ghost px-8 py-4 text-base">🎥 {t('سيتب الستريمر', 'Streamer setup')}</Link></Magnetic>
            </div>
          </div>
        </section>
      </Reveal>

      {orderP && <OrderModal items={[{ product: orderP }]} source="product" onClose={() => setOrderP(null)} />}
    </div>
  );
}

/* ---------- قائمة الأقسام مجمعة في شبكة ---------- */
function CategoryShowcase() {
  const { t, pick, lang } = usePrefs();
  const { catalog } = useBuild();
  const groups = groupedCategories(catalog?.categories, catalog?.products);
  const GRAD = { parts: 'from-cyan-400 to-blue-600', peripherals: 'from-violet-400 to-indigo-600', streaming: 'from-pink-400 to-rose-600', more: 'from-emerald-400 to-teal-600' };
  if (!groups.length) return null;
  return (
    <section>
      <Reveal className="mb-8 text-center">
        <span className="chip bg-cyan-500/15 text-cyan-500">{t('تسوق حسب القسم', 'Shop by category')}</span>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl"><SplitWords text={t('كل اللي محتاجه في مكان واحد', 'Everything you need, organized')} /></h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g, gi) => (
          <Reveal key={g.key} delay={gi * 0.06} className="h-full">
            <Spotlight className="h-full rounded-3xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2.5 px-1">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${GRAD[g.key]} text-white shadow-glow`}>
                  <CategoryArt slug={g.icon} className="h-6 w-6" />
                </span>
                <h3 className={`bg-gradient-to-r ${GRAD[g.key]} bg-clip-text font-black text-transparent`}>{g[lang]}</h3>
              </div>
              <div className="space-y-1">
                {g.items.map((c, i) => (
                  <motion.div key={c.key} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                    <Link to={`/shop?cat=${c.key}`}
                      className="group flex items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-surface2">
                      <CategoryArt slug={c.slug} className="h-8 w-8 transition group-hover:scale-110 group-hover:rotate-6" />
                      <span className="flex-1 truncate text-sm font-bold">{pick(c, 'name')}</span>
                      <span className="chip bg-violet-500/10 text-violet-500">{c.count}</span>
                      <span className="text-muted transition group-hover:text-violet-500 rtl:rotate-180">›</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Spotlight>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- قسم "كيف يعمل" مثبت بتمرير أفقي (GSAP ScrollTrigger) ---------- */
function HowItWorks() {
  const { t, isRTL } = usePrefs();
  const wrap = useRef(null);
  const track = useRef(null);

  const steps = [
    { n: '01', icon: '🧩', title: t('اختر قطعك', 'Pick your parts'), body: t('معالج، كرت شاشة، رامات... كل قطعة بصورتها وسعرها ومخزونها الحقيقي.', 'CPU, GPU, RAM... every part with its image, price and live stock.'), c: 'from-cyan-400 to-blue-600' },
    { n: '02', icon: '🛡️', title: t('فحص التوافق', 'Compatibility check'), body: t('السوكت، نوع الرام، مقاس الكيسة، قدرة الباور — بيتفحصوا لحظياً.', 'Socket, RAM type, case size, PSU wattage — all checked live.'), c: 'from-violet-400 to-indigo-600' },
    { n: '03', icon: '✨', title: t('تصور بالـ AI', 'AI preview'), body: t('GPT يقترح أفضل تجميعة لميزانيتك ويولّد صورة واقعية للسيتب.', 'GPT suggests the best build for your budget and renders a realistic setup image.'), c: 'from-fuchsia-400 to-pink-600' },
    { n: '04', icon: '🚀', title: t('اطلب واستلم', 'Order & receive'), body: t('ابعت طلبك بضغطة، والمحل يتواصل معاك ويجهّز التجميعة.', 'Send your order in one tap — the shop calls you and assembles it.'), c: 'from-emerald-400 to-teal-600' },
  ];

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const el = track.current;
      const dist = () => el.scrollWidth - wrap.current.clientWidth;
      const tween = gsap.to(el, {
        x: () => (isRTL ? dist() : -dist()),
        ease: 'none',
        scrollTrigger: { trigger: wrap.current, pin: true, scrub: 0.8, start: 'top 12%', end: () => `+=${dist()}`, invalidateOnRefresh: true },
      });
      gsap.utils.toArray('.step-card', el).forEach(card => {
        gsap.from(card.querySelector('.step-num'), {
          scale: 0.4, opacity: 0, ease: 'back.out(2)',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: isRTL ? 'right 90%' : 'left 90%', toggleActions: 'play none none reverse' },
        });
      });
    });
    return () => mm.revert();
  }, [isRTL]);

  // غلاف ثابت يملكه React: GSAP يضع pin-spacer داخله فلا يتعارض مع إدراج React للعناصر المجاورة
  return (
    <div>
    <section ref={wrap} className="overflow-hidden">
      <div className="mb-8 text-center">
        <span className="chip bg-violet-500/15 text-violet-500">{t('خطوات بسيطة', 'Simple steps')}</span>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl"><SplitWords text={t('إزاي تبني جهازك معانا', 'How you build with us')} /></h2>
      </div>
      <div ref={track} className="flex flex-col gap-5 lg:w-max lg:flex-row lg:gap-6 lg:px-[8vw]">
        {steps.map((s, i) => (
          <Spotlight key={s.n} className="step-card relative overflow-hidden rounded-3xl border border-line bg-surface p-7 lg:h-[340px] lg:w-[420px]">
            <div className={`absolute -end-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${s.c} opacity-25 blur-2xl`} />
            <div className={`step-num bg-gradient-to-br ${s.c} bg-clip-text font-display text-7xl font-black text-transparent`}>{s.n}</div>
            <div className="mt-4 text-4xl">{s.icon}</div>
            <h3 className="mt-3 text-2xl font-black">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            {i < steps.length - 1 && <div className="absolute bottom-7 end-7 hidden font-display text-2xl text-muted/40 lg:block">{isRTL ? '←' : '→'}</div>}
          </Spotlight>
        ))}
      </div>
    </section>
    </div>
  );
}

/* ---------- قسم الذكاء الاصطناعي مع محادثة تجريبية متحركة ---------- */
function AISection() {
  const { t } = usePrefs();
  const script = [
    { role: 'user', text: t('عايز PC ألعاب بـ 35 ألف', 'I want a gaming PC for 35k') },
    { role: 'ai', text: t('تمام! اخترتلك i5-12400F + RTX 4060 + 16GB DDR4 — متوافقة 100% وبإجمالي 32,800 🎮', 'Done! i5-12400F + RTX 4060 + 16GB DDR4 — 100% compatible, total 32,800 🎮') },
    { role: 'user', text: t('وريني شكلها 👀', 'Show me how it looks 👀') },
    { role: 'ai', text: t('جاري توليد صورة السيتب بإضاءة RGB... ✨', 'Rendering your RGB setup image... ✨') },
  ];
  const [n, setN] = useState(0);
  const [typing, setTyping] = useState('');
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setStarted(true), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (n >= script.length) { const id = setTimeout(() => setN(0), 3500); return () => clearTimeout(id); }
    const full = script[n].text;
    let i = 0;
    const speed = script[n].role === 'ai' ? 22 : 38;
    const id = setInterval(() => {
      i++;
      setTyping(full.slice(0, i));
      if (i >= full.length) { clearInterval(id); setTimeout(() => { setN(x => x + 1); setTyping(''); }, 700); }
    }, speed);
    return () => clearInterval(id);
  }, [n, started]);

  return (
    <Reveal>
      <section ref={ref} className="rgb-border">
        <div className="rgb-inner scanline relative grid items-center gap-10 overflow-hidden p-8 md:grid-cols-2 md:p-12">
          <div className="aurora" />
          <div className="relative">
            <span className="chip bg-violet-500/15 font-display text-violet-500">GPT · AI</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">{t('مستشارك الذكي', 'Your AI advisor')}<br /><span className="neon-text">{t('للتجميع', 'for every build')}</span></h2>
            <p className="mt-4 leading-relaxed text-muted">
              {t('قوله ميزانيتك واستخدامك، ويختارلك أفضل تجميعة متوافقة من المخزون — وبعدين ولّد صورة واقعية لشكل السيتب.',
                 'Tell it your budget and use case, it picks the best compatible build from stock — then renders a realistic image of your setup.')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[['🧩', t('فحص توافق', 'Compatibility')], ['💬', t('شات GPT', 'GPT chat')], ['🖼️', t('تصور السيتب', 'Setup render')], ['⚡', t('حساب الطاقة', 'Power calc')]].map(([i, l]) => (
                <motion.div key={l} whileHover={{ scale: 1.05, y: -3 }} className="glass flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold">
                  <span className="text-xl">{i}</span>{l}
                </motion.div>
              ))}
            </div>
            <Magnetic className="mt-7"><Link to="/builder" className="btn-neon">{t('جرّب التوصية الذكية', 'Try smart recommend')}</Link></Magnetic>
          </div>

          {/* نافذة شات تجريبية */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-pink-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center gap-2 border-b border-line bg-surface2/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ms-2 font-display text-xs font-bold text-muted">DOS · GPT ASSISTANT</span>
              </div>
              <div className="flex h-72 flex-col justify-end gap-2.5 p-4">
                <AnimatePresence initial={false}>
                  {script.slice(0, n).map((m, i) => <Bubble key={`${i}-${m.text}`} m={m} />)}
                  {n < script.length && typing && <Bubble key={`typing-${n}`} m={{ ...script[n], text: typing }} cursor />}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function Bubble({ m, cursor }) {
  const ai = m.role === 'ai';
  return (
    <motion.div layout initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
      className={`flex ${ai ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${ai ? 'border border-line bg-surface2/70' : 'bg-gradient-to-br from-violet-600 to-cyan-600 text-white'}`}>
        {ai && <span className="me-1.5 font-display text-[10px] font-black text-violet-500">GPT</span>}
        {m.text}{cursor && <span className="ms-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />}
      </div>
    </motion.div>
  );
}

function SectionHead({ kicker, title, sub, to, more }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <span className="chip bg-violet-500/15 text-violet-500">{kicker}</span>}
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2>
        <p className="mt-1 text-sm text-muted">{sub}</p>
      </div>
      <Link to={to} className="group text-sm font-bold text-violet-500">
        {more} <span className="inline-block transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
      </Link>
    </Reveal>
  );
}
