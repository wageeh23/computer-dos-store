import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useReducedMotion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

// ===================================================================
// مجموعة المؤثرات البصرية — راجع .devin/skills/dos-design/SKILL.md
// ===================================================================

const isDark = () => document.documentElement.classList.contains('dark');

/* ---------- شريط تقدم التمرير RGB ---------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'var(--origin, 0%)' }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 shadow-[0_0_12px_rgba(139,92,246,.8)] [--origin:100%] ltr:[--origin:0%] print:hidden"
    />
  );
}

/* ---------- خلفية جزيئات متصلة (Canvas) ---------- */
export function ParticleField({ density = 0.00009, className = 'fixed inset-0 z-0' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, pts = [], raf, running = true;
    const mouse = { x: -9999, y: -9999 };
    const COLORS = ['34,211,238', '139,92,246', '244,114,182'];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.floor(w * h * density));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6, c: COLORS[(Math.random() * 3) | 0],
      }));
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const alpha = isDark() ? 1 : 0.55;
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { p.x += dx * 0.015; p.y += dy * 0.015; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${0.8 * alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / 120) * 0.22 * alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onVis = () => { running = !document.hidden; if (running) tick(); else cancelAnimationFrame(raf); };
    resize(); tick();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce, density]);

  return <canvas ref={ref} className={`pointer-events-none h-full w-full ${className}`} aria-hidden="true" />;
}

/* ---------- نص بتأثير فك التشفير (DOS / Hacker) ---------- */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFXYZ';
export function ScrambleText({ text, className = '', delay = 0, duration = 1.2, as: Tag = 'span' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = text; return; }
    const state = { p: 0 };
    const tw = gsap.to(state, {
      p: 1, duration, delay, ease: 'power2.out',
      onUpdate: () => {
        const n = Math.floor(state.p * text.length);
        let out = text.slice(0, n);
        for (let i = n; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.textContent = out;
      },
      onComplete: () => { el.textContent = text; },
    });
    return () => tw.kill();
  }, [text, reduce]);
  return <Tag ref={ref} className={className} aria-label={text}>{text}</Tag>;
}

/* ---------- غلاف مغناطيسي للأزرار ---------- */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15 }), sy = useSpring(y, { stiffness: 220, damping: 15 });
  const onMove = (e) => {
    if (reduce) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }} style={{ x: sx, y: sy }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

/* ---------- بطاقة بإضاءة تتبع المؤشر ---------- */
export function Spotlight({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Tag ref={ref} onMouseMove={onMove} className={`spotlight group/spot relative ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- عدّاد رقمي عند الظهور ---------- */
export function CountUp({ to = 0, duration = 1.6, format = (n) => Math.round(n).toLocaleString('en-US'), className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = format(to); return; }
    const obj = { v: 0 };
    let tw;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      tw = gsap.to(obj, { v: to, duration, ease: 'power3.out', onUpdate: () => { el.textContent = format(obj.v); } });
      io.disconnect();
    });
    io.observe(el);
    return () => { io.disconnect(); tw?.kill(); };
  }, [to]);
  return <span ref={ref} className={className}>{format(0)}</span>;
}

/* ---------- ظهور عند التمرير ---------- */
export function Reveal({ children, delay = 0, y = 40, className = '', once = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- شاشة إقلاع DOS (مرة واحدة لكل جلسة) ---------- */
export function BootScreen({ lines, brand = 'COMPUTER DOS' }) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem('dos_booted'); } catch { return false; }
  });
  const [shown, setShown] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!show) return;
    if (reduce) { finish(); return; }
    const timers = lines.map((_, i) => setTimeout(() => setShown(i + 1), 160 + i * 190));
    const obj = { v: 0 };
    const tw = gsap.to(obj, { v: 100, duration: 0.25 + lines.length * 0.19, ease: 'power1.inOut', onUpdate: () => setPct(Math.round(obj.v)) });
    const end = setTimeout(finish, 650 + lines.length * 190);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); tw.kill(); };
  }, [show]);

  function finish() {
    try { sessionStorage.setItem('dos_booted', '1'); } catch {}
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.55 }}
          onClick={finish}
          className="scanline fixed inset-0 z-[200] flex items-center justify-center bg-[#04040f] p-6 font-mono text-cyan-300"
        >
          <div className="w-full max-w-xl" dir="ltr">
            <div className="neon-text mb-6 font-display text-3xl font-black tracking-widest sm:text-4xl">{brand}</div>
            <div className="min-h-[11rem] space-y-1 text-[13px]">
              {lines.slice(0, shown).map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between gap-4">
                  <span><span className="text-violet-400">C:\&gt;</span> {l}</span>
                  <span className="text-emerald-400">[ OK ]</span>
                </motion.div>
              ))}
              <span className="inline-block h-4 w-2 animate-pulse bg-cyan-300 align-middle" />
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 transition-[width] duration-100" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>BOOT {pct}%</span><span>CLICK TO SKIP</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- انفجار احتفالي (Confetti) ---------- */
export function fireConfetti({ count = 140, origin } = {}) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const ox = origin?.x ?? innerWidth / 2, oy = origin?.y ?? innerHeight * 0.4;
  const colors = ['#22d3ee', '#8b5cf6', '#f472b6', '#facc15', '#34d399'];
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, s = Math.random() * 9 + 4;
    return { x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, w: Math.random() * 8 + 4, h: Math.random() * 5 + 3,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0], life: 1 };
  });
  let raf;
  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.009;
      if (p.life > 0 && p.y < innerHeight + 20) alive = true;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick); else canvas.remove();
  };
  tick();
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 5000);
}

/* ---------- مؤشر دائري مخصص (سطح المكتب) ---------- */
export function CursorRing() {
  const reduce = useReducedMotion();
  const [enabled] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 35 }), sy = useSpring(y, { stiffness: 500, damping: 35 });
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (!enabled || reduce) return;
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      setHover(!!e.target.closest?.('a,button,[role="button"],input,select,textarea,label'));
    };
    const d = () => setDown(true), u = () => setDown(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', d);
    window.addEventListener('pointerup', u);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', d); window.removeEventListener('pointerup', u); };
  }, [enabled, reduce]);

  if (!enabled || reduce) return null;
  return (
    <>
      <motion.div style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-[150] print:hidden">
        <motion.div
          animate={{ scale: down ? 0.7 : hover ? 1.8 : 1, opacity: hover ? 0.9 : 0.6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="-ml-4 -mt-4 h-8 w-8 rounded-full border-2 border-violet-400 mix-blend-difference shadow-[0_0_14px_rgba(139,92,246,.7)]"
        />
      </motion.div>
      <motion.div style={{ x, y }} className="pointer-events-none fixed left-0 top-0 z-[151] print:hidden">
        <div className="-ml-1 -mt-1 h-2 w-2 rounded-full bg-cyan-300" />
      </motion.div>
    </>
  );
}

/* ---------- عنوان مقسّم لحروف متحركة ---------- */
export function SplitWords({ text, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%', rotate: 6 }}
            whileInView={{ y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}
