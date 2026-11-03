// محرك التوصية الذكية — يبني تجميعة متوافقة ضمن الميزانية حسب الاستخدام

import { BUILDER_SLOTS, groupBySlug } from './catalog.js';
import { checkBuild } from './compat.js';

const WEIGHTS = {
  gaming:    { gpu: .36, cpu: .20, motherboard: .10, ram: .08, storage: .07, psu: .07, case: .06, cpu_cooler: .06 },
  streaming: { gpu: .30, cpu: .24, ram: .12, motherboard: .10, storage: .07, psu: .07, case: .05, cpu_cooler: .05 },
  editing:   { cpu: .30, gpu: .24, ram: .15, storage: .10, motherboard: .08, psu: .06, case: .04, cpu_cooler: .03 },
  office:    { cpu: .28, motherboard: .14, ram: .13, storage: .13, case: .12, psu: .10, cpu_cooler: .06, gpu: .04 },
};

export const USAGE_TYPES = [
  { key: 'gaming', ar: 'ألعاب', en: 'Gaming' },
  { key: 'streaming', ar: 'ستريمنج', en: 'Streaming' },
  { key: 'editing', ar: 'مونتاج', en: 'Editing' },
  { key: 'office', ar: 'مكتبي', en: 'Office' },
];

export function recommend(products, budget, usage = 'gaming') {
  const bySlug = groupBySlug(products.filter(p => p.available));
  const weights = WEIGHTS[usage] || WEIGHTS.gaming;
  const selected = {};

  // 1) اختيار مبدئي: أفضل منتج لا يتجاوز حصته من الميزانية، وإلا الأرخص المتاح
  for (const slot of BUILDER_SLOTS) {
    const list = bySlug[slot.slug] || [];
    if (!list.length) continue;
    const share = budget * (weights[slot.slug] || 0.1);
    const affordable = list.filter(p => p.price <= share);
    selected[slot.slug] = affordable.length
      ? affordable[affordable.length - 1]      // الأغلى ضمن الحصة = أفضل قيمة
      : list[0];                                // وإلا الأرخص المتاح
  }

  // 2) إصلاح التوافق: اجعل اللوحة ثم الرام متوافقين مع المعالج
  fixCompat(selected, bySlug);

  // 3) تقليص الميزانية: خفّض الفئات الأقل أهمية أولاً
  const priority = [...BUILDER_SLOTS].sort(
    (a, b) => (weights[a.slug] || 0.1) - (weights[b.slug] || 0.1)
  );
  let guard = 60;
  while (totalPrice(selected) > budget && guard-- > 0) {
    let changed = false;
    for (const slot of priority) {
      const list = bySlug[slot.slug] || [];
      const cur = selected[slot.slug];
      if (!cur || !list.length) continue;
      const cheaper = list.filter(p => p.price < cur.price);
      if (!cheaper.length) continue;
      const next = cheaper[cheaper.length - 1];
      const trial = { ...selected, [slot.slug]: next };
      if (!checkBuild(trial).some(i => i.level === 'error')) {
        selected[slot.slug] = next;
        changed = true;
        if (totalPrice(selected) <= budget) break;
      }
    }
    if (!changed) break;
  }
  fixCompat(selected, bySlug);

  return { selected, total: totalPrice(selected), issues: checkBuild(selected) };
}

function fixCompat(selected, bySlug) {
  const cpu = selected.cpu, mobo = selected.motherboard, ram = selected.ram;
  // اللوحة يجب أن تطابق مقبس المعالج ونوع الرام
  if (cpu?.specs?.socket && mobo && mobo.specs?.socket !== cpu.specs.socket) {
    const candidates = (bySlug.motherboard || []).filter(m =>
      m.specs?.socket === cpu.specs.socket && (!ram?.specs?.ram_type || m.specs?.ram_type === ram.specs.ram_type));
    if (candidates.length) selected.motherboard = nearestPrice(candidates, mobo.price);
  }
  const m2 = selected.motherboard;
  if (ram && m2?.specs?.ram_type && ram.specs?.ram_type !== m2.specs.ram_type) {
    const candidates = (bySlug.ram || []).filter(r => r.specs?.ram_type === m2.specs.ram_type);
    if (candidates.length) selected.ram = nearestPrice(candidates, ram.price);
  }
  // مزود كافٍ
  const need = ((selected.cpu?.specs?.tdp || 0) + (selected.gpu?.specs?.tdp || 0) + 120) * 1.25;
  if (selected.psu && selected.psu.specs?.watts && selected.psu.specs.watts < need) {
    const candidates = (bySlug.psu || []).filter(p => (p.specs?.watts || 0) >= need);
    if (candidates.length) selected.psu = candidates[0];
  }
  // صندوق يستوعب اللوحة وكرت الشاشة
  if (selected.case && selected.motherboard?.specs?.form_factor) {
    const ff = selected.motherboard.specs.form_factor;
    const glen = selected.gpu?.specs?.length_mm || 0;
    const okCase = c => {
      const ffs = Array.isArray(c.specs?.form_factors) ? c.specs.form_factors : [];
      return ffs.includes(ff) && (!glen || !c.specs?.gpu_max_mm || c.specs.gpu_max_mm >= glen);
    };
    if (!okCase(selected.case)) {
      const candidates = (bySlug.case || []).filter(okCase);
      if (candidates.length) selected.case = nearestPrice(candidates, selected.case.price);
    }
  }
}

const nearestPrice = (list, target) =>
  list.reduce((best, p) => Math.abs(p.price - target) < Math.abs(best.price - target) ? p : best, list[0]);

export const totalPrice = (selected) =>
  Object.values(selected).reduce((s, p) => s + (p?.price || 0), 0);
