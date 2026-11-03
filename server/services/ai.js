// خدمة GPT — كل الطلبات تمر من السيرفر، والمفتاح لا يُرسل للمتصفح أبداً
const { getSetting } = require('../db');
const { saveBuffer } = require('./uploads');

const apiKey = () => process.env.OPENAI_API_KEY || getSetting('openai_key') || '';
const aiEnabled = () => !!apiKey();

async function openai(path, body) {
  const key = apiKey();
  if (!key) throw Object.assign(new Error('AI_DISABLED'), { status: 503 });
  const res = await fetch(`https://api.openai.com/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status === 401 ? 502 : 502 });
  }
  return data;
}

// مساعد التجميع: يرد بنص + تجميعة مقترحة من الكتالوج فقط
async function buildAssistant({ messages, catalog, lang }) {
  const lines = catalog.map(p =>
    `${p.id}|${p.category_slug}|${p.name}|${p.price}|stock:${p.stock}|${JSON.stringify(p.specs)}`
  ).join('\n');

  const system = `You are the expert PC-building assistant of "Computer DOS Store", a computer parts & accessories shop.
Reply in ${lang === 'en' ? 'English' : 'Egyptian-friendly Modern Arabic'}. Be concise, friendly, and practical.
Only recommend products from the CATALOG below (format: id|category|name|price|stock|specs). Never invent products or prices.
Respect compatibility: CPU socket = motherboard socket, RAM type = motherboard ram_type, motherboard form_factor in case form_factors,
GPU length <= case gpu_max_mm, PSU watts >= (cpu tdp + gpu tdp + 120) * 1.25. Prefer in-stock items and stay within the user's budget.
Respond ONLY with JSON: {"reply": string, "build": {"<category_slug>": <product id>, ...} | null}
Include "build" when the user asks for a build, an upgrade, or a setup; otherwise null.
Valid category slugs: cpu, motherboard, ram, gpu, storage, cpu_cooler, psu, case, monitor, keyboard, mouse, headset, mic, webcam, capture_card, lights.
CATALOG:
${lines}`;

  const data = await openai('/chat/completions', {
    model: getSetting('ai_chat_model') || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    messages: [{ role: 'system', content: system }, ...messages],
  });

  let parsed = {};
  try { parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch {}
  const ids = new Set(catalog.map(p => p.id));
  const build = {};
  if (parsed.build && typeof parsed.build === 'object') {
    for (const [slug, id] of Object.entries(parsed.build)) if (ids.has(+id)) build[slug] = +id;
  }
  return { reply: String(parsed.reply || ''), build: Object.keys(build).length ? build : null };
}

// توليد صورة وحفظها في uploads — يعيد رابطاً محلياً
async function generateImage(prompt, size = '1536x1024') {
  const model = getSetting('ai_image_model') || 'gpt-image-1';
  const body = { model, prompt, n: 1, size };
  if (model.startsWith('dall-e')) {
    body.response_format = 'b64_json';
    body.size = model === 'dall-e-3' ? (size === '1024x1024' ? size : '1792x1024') : '1024x1024';
  }
  const data = await openai('/images/generations', body);
  const item = data.data?.[0] || {};
  if (item.b64_json) return saveBuffer(Buffer.from(item.b64_json, 'base64'), 'png', 'ai');
  if (item.url) {
    const img = await fetch(item.url, { signal: AbortSignal.timeout(60000) });
    return saveBuffer(Buffer.from(await img.arrayBuffer()), 'png', 'ai');
  }
  throw Object.assign(new Error('No image returned'), { status: 502 });
}

function setupPrompt(items, usage) {
  const styles = {
    gaming: 'RGB neon gaming battlestation, tempered-glass PC case with glowing fans, dark futuristic room, purple and cyan lighting',
    streaming: 'professional streamer battlestation, microphone on boom arm, webcam, ring light, RGB wall panels, cozy dark room',
    editing: 'clean creative workstation, color-accurate monitor, minimal desk, soft studio lighting',
    office: 'clean modern office desk setup, minimal aesthetic, warm daylight',
  };
  const names = items.filter(Boolean).slice(0, 14).join(', ');
  return `Photorealistic wide shot of a desk setup: ${styles[usage] || styles.gaming}. Featuring: ${names}. Cinematic product photography, ultra detailed, depth of field, no text, no logos.`;
}

module.exports = { aiEnabled, buildAssistant, generateImage, setupPrompt };
