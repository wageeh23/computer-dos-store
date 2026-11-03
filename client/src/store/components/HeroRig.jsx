import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';

// رسم PC ألعاب متحرك: مراوح تدور، إضاءة RGB متدفقة، إمالة مع المؤشر
export default function HeroRig() {
  const ref = useRef(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 90, damping: 16 });
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 90, damping: 16 });

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX / window.innerWidth - 0.5); my.set(e.clientY / window.innerHeight - 0.5); };
    window.addEventListener('pointermove', move);
    const ctx = gsap.context(() => {
      gsap.to('.rig-float', { y: -14, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.rig-fan', { rotation: 360, transformOrigin: '50% 50%', duration: 1.6, repeat: -1, ease: 'none' });
      gsap.to('.rgb-stop-a', { attr: { 'stop-color': '#f472b6' }, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.rgb-stop-b', { attr: { 'stop-color': '#22d3ee' }, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.fromTo('.rig-pulse', { opacity: 0.35 }, { opacity: 1, duration: 1.2, repeat: -1, yoyo: true, stagger: 0.2 });
    }, ref);
    return () => { window.removeEventListener('pointermove', move); ctx.revert(); };
  }, []);

  const Fan = ({ cx, cy, r }) => (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="url(#rgb)" strokeWidth="3" className="rig-pulse" />
      <circle cx={cx} cy={cy} r={r} fill="#0b0b22" />
      <g className="rig-fan">
        {[0, 60, 120, 180, 240, 300].map(a => (
          <path key={a} d={`M${cx} ${cy} q ${r * 0.55} ${-r * 0.3} ${r * 0.85} ${-r * 0.05} q ${-r * 0.3} ${r * 0.25} ${-r * 0.85} ${r * 0.05}z`}
            fill="url(#rgb)" opacity=".75" transform={`rotate(${a} ${cx} ${cy})`} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.2} fill="#14143a" stroke="url(#rgb)" strokeWidth="2" />
    </g>
  );

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md" style={{ perspective: 1000 }}>
      <div className="absolute inset-x-10 bottom-0 h-10 rounded-[100%] bg-violet-600/40 blur-2xl" />
      <motion.div style={{ rotateY: rotY, rotateX: rotX, transformStyle: 'preserve-3d' }} className="rig-float">
        <svg viewBox="0 0 320 400" className="w-full drop-shadow-[0_30px_60px_rgba(139,92,246,.35)]">
          <defs>
            <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" className="rgb-stop-a" />
              <stop offset=".5" stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#f472b6" className="rgb-stop-b" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".14" />
              <stop offset=".4" stopColor="#ffffff" stopOpacity=".02" />
              <stop offset="1" stopColor="#ffffff" stopOpacity=".08" />
            </linearGradient>
          </defs>
          {/* الهيكل */}
          <rect x="30" y="20" width="260" height="360" rx="22" fill="#0a0a1e" stroke="url(#rgb)" strokeWidth="4" />
          <rect x="44" y="34" width="200" height="332" rx="12" fill="#07071a" stroke="#2a2a55" strokeWidth="2" />
          {/* اللوحة الأم */}
          <rect x="60" y="54" width="150" height="190" rx="6" fill="#10102c" stroke="#26265a" />
          <rect x="95" y="80" width="56" height="56" rx="6" fill="#16163e" stroke="url(#rgb)" strokeWidth="2" />
          <circle cx="123" cy="108" r="20" fill="none" stroke="url(#rgb)" strokeWidth="3" className="rig-pulse" />
          {[168, 178, 188].map(x => <rect key={x} x={x} y="70" width="6" height="80" rx="3" fill="url(#rgb)" opacity=".85" className="rig-pulse" />)}
          {/* كرت الشاشة */}
          <rect x="56" y="176" width="176" height="44" rx="8" fill="#12123a" stroke="url(#rgb)" strokeWidth="2.5" />
          <rect x="66" y="214" width="156" height="4" rx="2" fill="url(#rgb)" className="rig-pulse" />
          <text x="196" y="203" fontFamily="sans-serif" fontWeight="900" fontSize="11" fill="url(#rgb)">RTX</text>
          {/* مزود الطاقة */}
          <rect x="56" y="300" width="176" height="52" rx="8" fill="#0f0f2a" stroke="#2a2a55" />
          <text x="72" y="331" fontFamily="sans-serif" fontWeight="800" fontSize="10" fill="#5b5b92">850W · GOLD</text>
          {/* مراوح أمامية */}
          <Fan cx={268} cy={100} r={16} />
          <Fan cx={268} cy={170} r={16} />
          <Fan cx={268} cy={240} r={16} />
          {/* شريط RGB */}
          <rect x="44" y="254" width="200" height="6" rx="3" fill="url(#rgb)" className="rig-pulse" />
          {/* الزجاج */}
          <rect x="44" y="34" width="200" height="332" rx="12" fill="url(#glass)" />
          <path d="M60 40 L120 40 L60 160 Z" fill="#fff" opacity=".05" />
          {/* زر التشغيل */}
          <circle cx="268" cy="330" r="9" fill="none" stroke="url(#rgb)" strokeWidth="3" className="rig-pulse" />
          <path d="M268 324 v6" stroke="url(#rgb)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  );
}
