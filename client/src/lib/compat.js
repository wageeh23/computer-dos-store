// محرك فحص التوافق — level: 'error' | 'warn' | 'ok'
// t(ar, en) لاختيار لغة الرسائل (افتراضي عربي)

const W_BASE = 120; // استهلاك تقديري لباقي العتاد

const arr = (v) => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
const defaultT = (ar) => ar;

export const powerNeed = (selected) =>
  (selected.cpu?.specs?.tdp || 0) + (selected.gpu?.specs?.tdp || 0) + W_BASE;

export function checkBuild(selected, t = defaultT) {
  const out = [];
  const ok = (ar, en) => out.push({ level: 'ok', msg: t(ar, en) });
  const warn = (ar, en) => out.push({ level: 'warn', msg: t(ar, en) });
  const err = (ar, en) => out.push({ level: 'error', msg: t(ar, en) });
  const get = (s) => selected[s]?.specs || {};
  const has = (s) => !!selected[s];

  const cpu = get('cpu'), mobo = get('motherboard'), ram = get('ram'), gpu = get('gpu'),
        psu = get('psu'), kase = get('case'), cooler = get('cpu_cooler'), storage = get('storage');

  if (has('cpu') && has('motherboard')) {
    if (cpu.socket && mobo.socket) {
      cpu.socket === mobo.socket
        ? ok(`المقبس متطابق: ${cpu.socket}`, `Socket match: ${cpu.socket}`)
        : err(`المعالج ${cpu.socket} لا يركب على لوحة ${mobo.socket}`, `${cpu.socket} CPU won't fit a ${mobo.socket} board`);
    } else warn('مقبس المعالج/اللوحة غير موثّق', 'CPU/board socket not specified');
  }

  if (has('ram') && has('motherboard')) {
    if (ram.ram_type && mobo.ram_type) {
      ram.ram_type === mobo.ram_type
        ? ok(`الرام ${ram.ram_type} متوافقة مع اللوحة`, `${ram.ram_type} memory matches the board`)
        : err(`رام ${ram.ram_type} لا تعمل على لوحة ${mobo.ram_type}`, `${ram.ram_type} memory won't work on a ${mobo.ram_type} board`);
    } else warn('نوع الرام غير موثّق', 'Memory type not specified');
  }

  if (has('motherboard') && has('case')) {
    const ff = mobo.form_factor, supported = arr(kase.form_factors);
    if (ff && supported.length) {
      supported.includes(ff)
        ? ok(`الصندوق يستوعب لوحة ${ff}`, `Case fits ${ff} boards`)
        : err(`لوحة ${ff} أكبر من دعم الصندوق (${supported.join(', ')})`, `${ff} board doesn't fit this case (${supported.join(', ')})`);
    } else warn('حجم اللوحة/الصندوق غير موثّق', 'Board/case size not specified');
  }

  if (has('gpu') && has('case') && gpu.length_mm && kase.gpu_max_mm) {
    gpu.length_mm <= kase.gpu_max_mm
      ? ok(`طول الكرت ${gpu.length_mm}مم يناسب الصندوق`, `${gpu.length_mm}mm GPU fits the case`)
      : err(`كرت الشاشة ${gpu.length_mm}مم أطول من مساحة الصندوق ${kase.gpu_max_mm}مم`, `${gpu.length_mm}mm GPU exceeds case clearance ${kase.gpu_max_mm}mm`);
  }

  const need = powerNeed(selected);
  if (has('psu') && (cpu.tdp || gpu.tdp)) {
    const rec = Math.ceil(need * 1.25);
    if (!psu.watts) warn(`قدرة المزود غير موثّقة — تحتاج ~${rec}W`, `PSU wattage not specified — needs ~${rec}W`);
    else if (psu.watts < need) err(`مزود ${psu.watts}W أقل من الاستهلاك ${need}W — خطر!`, `${psu.watts}W PSU is below the ${need}W draw — unsafe!`);
    else if (psu.watts < rec) warn(`مزود ${psu.watts}W بدون هامش — يُفضّل ${rec}W+`, `${psu.watts}W PSU has no headroom — ${rec}W+ recommended`);
    else ok(`مزود ${psu.watts}W ممتاز (الحاجة ~${need}W)`, `${psu.watts}W PSU is great (~${need}W needed)`);
  }

  if (has('cpu_cooler') && has('cpu')) {
    const socks = arr(cooler.sockets);
    if (socks.length && cpu.socket) {
      socks.includes(cpu.socket)
        ? ok(`المبرد يدعم ${cpu.socket}`, `Cooler supports ${cpu.socket}`)
        : err(`المبرد لا يدعم ${cpu.socket}`, `Cooler doesn't support ${cpu.socket}`);
    }
  }
  if (has('cpu_cooler') && has('case') && cooler.height_mm && kase.cooler_max_mm && cooler.height_mm > kase.cooler_max_mm) {
    err(`ارتفاع المبرد ${cooler.height_mm}مم لا يدخل الصندوق (${kase.cooler_max_mm}مم)`, `${cooler.height_mm}mm cooler is too tall for the case (${kase.cooler_max_mm}mm)`);
  }

  if (has('storage') && has('motherboard') && storage.type === 'NVMe' && mobo.m2_slots === 0) {
    err('اللوحة بلا خانات M.2', 'Board has no M.2 slots for NVMe');
  }

  for (const slug in selected) {
    const p = selected[slug];
    if (p && !p.available) warn(`"${p.name}" غير متوفر حالياً`, `"${p.name}" is out of stock`);
  }

  if (Object.keys(selected).length && out.every(i => i.level === 'ok')) {
    ok('التجميعة متوافقة بالكامل — جاهزة للبناء!', 'Fully compatible build — ready to assemble!');
  }
  return out;
}

export function isCompatible(selected, slug, product) {
  return !checkBuild({ ...selected, [slug]: product }).some(i => i.level === 'error');
}

export const isComplete = (selected, slots) => slots.every(s => selected[s.slug]);
export { arr as specArr };
