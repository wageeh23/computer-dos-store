import React, { useId, useState } from 'react';

// صورة المنتج: الصورة المرفوعة إن وجدت، وإلا رسم فني للفئة بإضاءة RGB
export default function ProductImage({ src, slug, name, className = '', rounded = 'rounded-xl' }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <div className={`relative overflow-hidden bg-surface2 ${rounded} ${className}`}>
        <img src={src} alt={name || ''} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${rounded} ${className} bg-gradient-to-br from-surface2 to-surface`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,.25),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(34,211,238,.2),transparent_55%)]" />
      <CategoryArt slug={slug} className="relative h-full w-full p-[14%]" />
    </div>
  );
}

export function CategoryArt({ slug, className = '' }) {
  const id = useId().replace(/:/g, '');
  const g = `url(#g${id})`;
  const defs = (
    <defs>
      <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset=".55" stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#f472b6" />
      </linearGradient>
    </defs>
  );
  const S = { fill: 'none', stroke: g, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const dim = 'rgb(var(--muted) / .35)';

  const fan = (cx, cy, r) => (
    <g>
      <circle cx={cx} cy={cy} r={r} {...S} />
      <g className="spin-slow">
        {[0, 72, 144, 216, 288].map(a => (
          <path key={a} d={`M${cx} ${cy} q ${r * 0.5} ${-r * 0.25} ${r * 0.75} ${-r * 0.05}`} {...S} strokeWidth={2.2}
            transform={`rotate(${a} ${cx} ${cy})`} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.18} fill={g} />
    </g>
  );

  const arts = {
    cpu: (
      <>
        {[22, 34, 46, 58, 70, 78].map(p => (
          <g key={p} stroke={dim} strokeWidth="2.5">
            <line x1={p} y1="8" x2={p} y2="18" /><line x1={p} y1="82" x2={p} y2="92" />
            <line x1="8" y1={p} x2="18" y2={p} /><line x1="82" y1={p} x2="92" y2={p} />
          </g>
        ))}
        <rect x="18" y="18" width="64" height="64" rx="8" {...S} />
        <rect x="32" y="32" width="36" height="36" rx="4" fill={g} opacity=".9" />
        <text x="50" y="55" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">CPU</text>
      </>
    ),
    gpu: (
      <>
        <rect x="6" y="26" width="88" height="44" rx="7" {...S} />
        {fan(30, 48, 14)}{fan(66, 48, 14)}
        <path d="M14 70 v8 h30 v-8" stroke={dim} strokeWidth="3" fill="none" />
        <line x1="10" y1="31" x2="90" y2="31" stroke={g} strokeWidth="2" opacity=".5" />
      </>
    ),
    ram: (
      <>
        <rect x="8" y="30" width="84" height="32" rx="4" {...S} />
        {[16, 30, 44, 58, 72].map(x => <rect key={x} x={x} y="37" width="10" height="16" rx="2" fill={g} opacity=".85" />)}
        <path d="M8 62 v8 h40 v-4 h4 v4 h40 v-8" stroke={dim} strokeWidth="2.5" fill="none" />
        <rect x="8" y="22" width="84" height="6" rx="3" fill={g} opacity=".6" />
      </>
    ),
    motherboard: (
      <>
        <rect x="10" y="10" width="80" height="80" rx="6" {...S} />
        <rect x="22" y="22" width="24" height="24" rx="3" fill={g} opacity=".85" />
        {[56, 64, 72].map(x => <rect key={x} x={x} y="18" width="4" height="34" rx="2" stroke={g} strokeWidth="2" fill="none" />)}
        <rect x="18" y="58" width="60" height="5" rx="2" fill={g} opacity=".6" />
        <rect x="18" y="70" width="60" height="5" rx="2" stroke={dim} strokeWidth="2" fill="none" />
        <circle cx="84" cy="84" r="2" fill={dim} />
      </>
    ),
    storage: (
      <>
        <rect x="8" y="36" width="84" height="26" rx="4" {...S} />
        <rect x="18" y="42" width="22" height="14" rx="2" fill={g} opacity=".85" />
        <rect x="46" y="42" width="14" height="14" rx="2" fill={g} opacity=".55" />
        <rect x="64" y="42" width="14" height="14" rx="2" fill={g} opacity=".55" />
        <circle cx="86" cy="49" r="3" stroke={dim} strokeWidth="2" fill="none" />
        <text x="50" y="76" textAnchor="middle" fontSize="9" fontWeight="800" fill={dim} fontFamily="sans-serif">NVMe M.2</text>
      </>
    ),
    psu: (
      <>
        <rect x="10" y="20" width="80" height="60" rx="6" {...S} />
        {fan(42, 50, 20)}
        <rect x="70" y="30" width="12" height="10" rx="2" stroke={dim} strokeWidth="2" fill="none" />
        <path d="M76 52 l-4 8 h6 l-4 8" stroke={g} strokeWidth="2.5" fill="none" />
      </>
    ),
    case: (
      <>
        <rect x="24" y="6" width="52" height="88" rx="6" {...S} />
        <rect x="30" y="12" width="40" height="70" rx="3" stroke={g} strokeWidth="1.5" fill={g} fillOpacity=".08" />
        {fan(50, 28, 9)}{fan(50, 52, 9)}
        <circle cx="50" cy="88" r="2" fill={g} />
      </>
    ),
    cpu_cooler: (
      <>
        {[18, 26, 34, 42, 50, 58, 66, 74].map(y => <line key={y} x1="22" y1={y} x2="78" y2={y} stroke={dim} strokeWidth="2.5" />)}
        <rect x="18" y="12" width="64" height="66" rx="4" {...S} />
        {fan(50, 45, 18)}
        <rect x="34" y="80" width="32" height="10" rx="2" fill={g} opacity=".8" />
      </>
    ),
    monitor: (
      <>
        <rect x="6" y="14" width="88" height="54" rx="5" {...S} />
        <rect x="12" y="20" width="76" height="42" rx="2" fill={g} opacity=".18" />
        <path d="M18 52 l14 -14 l10 10 l12 -16 l16 20" stroke={g} strokeWidth="2.5" fill="none" />
        <path d="M42 68 l-4 14 h24 l-4 -14" stroke={dim} strokeWidth="3" fill="none" />
      </>
    ),
    keyboard: (
      <>
        <rect x="4" y="28" width="92" height="44" rx="6" {...S} />
        {[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5, 6, 7, 8].map(c => (
          <rect key={`${r}${c}`} x={10 + c * 9.2} y={34 + r * 10} width="7" height="7" rx="1.5" fill={g} opacity={0.35 + ((r + c) % 3) * 0.25} />
        )))}
        <rect x="26" y="62" width="48" height="5" rx="1.5" fill={g} opacity=".7" />
      </>
    ),
    mouse: (
      <>
        <rect x="30" y="10" width="40" height="78" rx="20" {...S} />
        <line x1="50" y1="12" x2="50" y2="38" stroke={g} strokeWidth="2.5" />
        <rect x="47" y="20" width="6" height="11" rx="3" fill={g} />
        <path d="M34 64 q16 10 32 0" stroke={g} strokeWidth="2" fill="none" opacity=".6" />
      </>
    ),
    headset: (
      <>
        <path d="M18 58 v-10 a32 32 0 0 1 64 0 v10" {...S} />
        <rect x="10" y="54" width="18" height="28" rx="6" fill={g} opacity=".85" />
        <rect x="72" y="54" width="18" height="28" rx="6" fill={g} opacity=".85" />
        <path d="M20 82 q4 10 18 10 h6" stroke={dim} strokeWidth="2.5" fill="none" />
      </>
    ),
    mic: (
      <>
        <rect x="34" y="8" width="32" height="50" rx="16" {...S} />
        {[18, 26, 34, 42, 50].map(y => <line key={y} x1="38" y1={y} x2="62" y2={y} stroke={g} strokeWidth="1.5" opacity=".6" />)}
        <path d="M26 44 a24 24 0 0 0 48 0" stroke={dim} strokeWidth="3" fill="none" />
        <line x1="50" y1="68" x2="50" y2="86" stroke={dim} strokeWidth="3" />
        <line x1="36" y1="88" x2="64" y2="88" stroke={g} strokeWidth="3.5" strokeLinecap="round" />
      </>
    ),
    webcam: (
      <>
        <rect x="16" y="20" width="68" height="40" rx="20" {...S} />
        <circle cx="50" cy="40" r="13" stroke={g} strokeWidth="3" fill="none" />
        <circle cx="50" cy="40" r="6" fill={g} />
        <circle cx="72" cy="32" r="2.5" fill="#22c55e" />
        <path d="M40 60 l-6 16 h32 l-6 -16" stroke={dim} strokeWidth="3" fill="none" />
      </>
    ),
    capture_card: (
      <>
        <rect x="10" y="30" width="80" height="40" rx="10" {...S} />
        <path d="M38 50 h24 M52 42 l10 8 l-10 8" stroke={g} strokeWidth="3" fill="none" />
        <rect x="4" y="44" width="8" height="12" rx="2" fill={dim} />
        <rect x="88" y="44" width="8" height="12" rx="2" fill={dim} />
        <circle cx="24" cy="50" r="4" fill="#ef4444" />
      </>
    ),
    lights: (
      <>
        <path d="M8 70 C 28 30, 48 90, 68 50 S 92 30, 94 40" stroke={g} strokeWidth="6" fill="none" strokeLinecap="round" />
        {[14, 30, 46, 62, 78].map((x, i) => <circle key={x} cx={x} cy={[62, 50, 66, 56, 42][i]} r="3" fill="#fff" opacity=".9" />)}
        <path d="M50 8 v10 M30 14 l5 8 M70 14 l-5 8" stroke={g} strokeWidth="3" />
      </>
    ),
  };

  const fallback = (
    <>
      <rect x="14" y="14" width="72" height="72" rx="14" {...S} />
      <path d="M34 50 h32 M50 34 v32" stroke={g} strokeWidth="4" strokeLinecap="round" />
    </>
  );

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {defs}
      {arts[slug] || fallback}
    </svg>
  );
}
