// تعريف خانات التجميع وسكيمات المواصفات لكل فئة (ثنائية اللغة)

export const BUILDER_SLOTS = [
  { slug: 'cpu', ar: 'المعالج', en: 'Processor' },
  { slug: 'motherboard', ar: 'اللوحة الأم', en: 'Motherboard' },
  { slug: 'ram', ar: 'الرامات', en: 'Memory' },
  { slug: 'gpu', ar: 'كرت الشاشة', en: 'Graphics Card' },
  { slug: 'storage', ar: 'التخزين', en: 'Storage' },
  { slug: 'cpu_cooler', ar: 'مبرد المعالج', en: 'CPU Cooler' },
  { slug: 'psu', ar: 'مزود الطاقة', en: 'Power Supply' },
  { slug: 'case', ar: 'الصندوق', en: 'Case' },
];

export const SETUP_SLOTS = [
  { slug: 'monitor', ar: 'الشاشة', en: 'Monitor' },
  { slug: 'keyboard', ar: 'الكيبورد', en: 'Keyboard' },
  { slug: 'mouse', ar: 'الماوس', en: 'Mouse' },
  { slug: 'headset', ar: 'السماعة', en: 'Headset' },
  { slug: 'mic', ar: 'الميكروفون', en: 'Microphone' },
  { slug: 'webcam', ar: 'الكاميرا', en: 'Webcam' },
  { slug: 'capture_card', ar: 'كرت التقاط', en: 'Capture Card' },
  { slug: 'lights', ar: 'إضاءة RGB', en: 'RGB Lighting' },
];

export const ALL_SLOTS = [...BUILDER_SLOTS, ...SETUP_SLOTS];

export const slotLabel = (slug, lang = 'ar') => {
  const s = ALL_SLOTS.find(x => x.slug === slug);
  return s ? s[lang] || s.ar : slug;
};

// field: { key, ar, en, type: 'number'|'text'|'select'|'csv', options?, hint? }
export const SPEC_SCHEMAS = {
  cpu: [
    { key: 'socket', ar: 'المقبس (Socket)', en: 'Socket', type: 'text', hint: 'LGA1700 / AM4 / AM5' },
    { key: 'tdp', ar: 'استهلاك الطاقة TDP (وات)', en: 'TDP (W)', type: 'number' },
  ],
  motherboard: [
    { key: 'socket', ar: 'المقبس (Socket)', en: 'Socket', type: 'text' },
    { key: 'ram_type', ar: 'نوع الرام', en: 'RAM type', type: 'select', options: ['DDR3', 'DDR4', 'DDR5'] },
    { key: 'form_factor', ar: 'الحجم', en: 'Form factor', type: 'select', options: ['ATX', 'mATX', 'ITX', 'E-ATX'] },
    { key: 'm2_slots', ar: 'خانات M.2', en: 'M.2 slots', type: 'number' },
    { key: 'ram_slots', ar: 'خانات الرام', en: 'RAM slots', type: 'number' },
  ],
  ram: [
    { key: 'ram_type', ar: 'النوع', en: 'Type', type: 'select', options: ['DDR3', 'DDR4', 'DDR5'] },
    { key: 'size_gb', ar: 'الحجم (GB)', en: 'Size (GB)', type: 'number' },
    { key: 'modules', ar: 'عدد القطع', en: 'Modules', type: 'number' },
  ],
  gpu: [
    { key: 'tdp', ar: 'استهلاك الطاقة TDP (وات)', en: 'TDP (W)', type: 'number' },
    { key: 'length_mm', ar: 'الطول (مم)', en: 'Length (mm)', type: 'number' },
  ],
  psu: [{ key: 'watts', ar: 'القدرة (وات)', en: 'Wattage (W)', type: 'number' }],
  case: [
    { key: 'form_factors', ar: 'أحجام اللوحات المدعومة', en: 'Supported boards', type: 'csv', hint: 'ATX, mATX, ITX' },
    { key: 'gpu_max_mm', ar: 'أقصى طول لكرت الشاشة (مم)', en: 'Max GPU length (mm)', type: 'number' },
    { key: 'cooler_max_mm', ar: 'أقصى ارتفاع للمبرد (مم)', en: 'Max cooler height (mm)', type: 'number' },
  ],
  cpu_cooler: [
    { key: 'sockets', ar: 'المقابس المدعومة', en: 'Supported sockets', type: 'csv', hint: 'LGA1700, AM4, AM5' },
    { key: 'height_mm', ar: 'الارتفاع (مم)', en: 'Height (mm)', type: 'number' },
  ],
  storage: [
    { key: 'type', ar: 'النوع', en: 'Type', type: 'select', options: ['NVMe', 'SATA', 'HDD'] },
    { key: 'capacity_gb', ar: 'السعة (GB)', en: 'Capacity (GB)', type: 'number' },
  ],
  monitor: [
    { key: 'size', ar: 'المقاس (بوصة)', en: 'Size (in)', type: 'number' },
    { key: 'hz', ar: 'معدل التحديث (Hz)', en: 'Refresh rate (Hz)', type: 'number' },
  ],
};

// مجموعات قائمة الأقسام في المتجر
export const CATEGORY_GROUPS = [
  { key: 'parts', ar: 'قطع الكمبيوتر', en: 'PC Components', icon: 'cpu', slugs: ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'cpu_cooler', 'psu', 'case'] },
  { key: 'peripherals', ar: 'الملحقات', en: 'Peripherals', icon: 'keyboard', slugs: ['monitor', 'keyboard', 'mouse', 'headset'] },
  { key: 'streaming', ar: 'الستريم', en: 'Streaming', icon: 'mic', slugs: ['mic', 'webcam', 'capture_card', 'lights'] },
  { key: 'more', ar: 'المزيد', en: 'More', icon: 'accessories', slugs: null }, // كل ما تبقى + الفئات المخصصة
];

// مفتاح الفئة في الرابط: slug إن وجد، وإلا id (للفئات المخصصة من الأدمن)
export const catKey = (c) => c.slug || String(c.id);
export const productInCat = (p, key) => !key || p.category_slug === key || String(p.category_id) === key;

// الفئات مع عدد المنتجات، مقسمة لمجموعات (الفئات الفارغة تُخفى)
export function groupedCategories(categories = [], products = []) {
  const counts = {};
  for (const p of products) {
    if (p.category_slug) counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
    if (p.category_id) counts[`#${p.category_id}`] = (counts[`#${p.category_id}`] || 0) + 1;
  }
  const withCount = categories
    .map(c => ({ ...c, key: catKey(c), count: c.slug ? counts[c.slug] || 0 : counts[`#${c.id}`] || 0 }))
    .filter(c => c.count > 0);
  const used = new Set();
  const groups = CATEGORY_GROUPS.map(g => {
    const items = g.slugs
      ? g.slugs.map(s => withCount.find(c => c.slug === s)).filter(Boolean)
      : withCount.filter(c => !used.has(c.key));
    items.forEach(c => used.add(c.key));
    return { ...g, items };
  });
  return groups.filter(g => g.items.length);
}

export function groupBySlug(products) {
  const map = {};
  for (const p of products) {
    if (!p.category_slug) continue;
    (map[p.category_slug] ||= []).push(p);
  }
  for (const k in map) map[k].sort((a, b) => a.price - b.price);
  return map;
}

export const specText = (specs = {}) =>
  Object.values(specs).filter(v => v !== '' && v != null).slice(0, 4)
    .map(v => (Array.isArray(v) ? v.join('/') : String(v)));

export async function loadCatalog() {
  const res = await fetch('/api/public/catalog');
  if (!res.ok) throw new Error('catalog');
  return res.json();
}
