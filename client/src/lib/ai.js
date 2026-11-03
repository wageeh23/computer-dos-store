// عميل الذكاء الاصطناعي — GPT عبر السيرفر، مع بديل مجاني عند عدم توفر المفتاح

export async function askAssistant(messages, lang) {
  const res = await fetch('/api/public/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, lang }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'AI error'), { fallback: !!data.fallback, status: res.status });
  return data; // { reply, build: {slug: id} | null }
}

// صورة السيتب: GPT Image من السيرفر — أو pollinations كبديل مجاني
export async function generateSetupImage({ items, usage }) {
  const names = items.filter(Boolean).map(p => (typeof p === 'string' ? p : p.name));
  const res = await fetch('/api/public/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: names, usage }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.url) return { url: data.url, engine: 'gpt' };
  if (data.fallback) return { url: fallbackImageUrl(names, usage), engine: 'free' };
  throw new Error(data.error || 'Image generation failed');
}

function fallbackImageUrl(names, usage) {
  const styles = {
    gaming: 'RGB neon gaming setup, glowing tempered glass PC, dark futuristic room, purple and cyan lighting',
    streaming: 'professional streamer battlestation, microphone boom arm, webcam, ring light, RGB wall panels',
    editing: 'clean creative workstation, color accurate monitor, minimal desk, soft lighting',
    office: 'clean modern office desk setup, minimal, warm light',
  };
  const prompt = `${styles[usage] || styles.gaming}, featuring ${names.slice(0, 10).join(', ')}, cinematic product photography, ultra detailed`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=800&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;
}
