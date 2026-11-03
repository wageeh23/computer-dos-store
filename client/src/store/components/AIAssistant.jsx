import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { useBuild } from '../build.jsx';
import { askAssistant } from '../../lib/ai.js';
import { recommend } from '../../lib/recommend.js';
import { slotLabel } from '../../lib/catalog.js';
import ProductImage from '../../shared/ProductImage.jsx';

// مساعد GPT العائم — يقترح تجميعات من المخزون الحقيقي ويطبقها على المُجمّع
export default function AIAssistant() {
  const { t, lang, money, shop } = usePrefs();
  const { catalog, applyIds } = useBuild();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const byId = new Map((catalog?.products || []).map(p => [p.id, p]));

  const suggestions = [
    t('جمّعلي PC ألعاب بـ 35000', 'Build me a gaming PC for 35000'),
    t('سيتب ستريمر كامل بميزانية 60000', 'Full streamer setup for 60000'),
    t('إيه أفضل كرت شاشة عندكم؟', 'What is your best graphics card?'),
  ];

  // بديل محلي عند عدم تفعيل GPT: يستخرج الميزانية والاستخدام من الرسالة
  const localAnswer = (text) => {
    const num = parseFloat((text.replace(/[,٬]/g, '').match(/\d{4,7}/) || [])[0]);
    const usage = /ستريم|stream|بث/i.test(text) ? 'streaming' : /مونتاج|edit|تصميم/i.test(text) ? 'editing' : /مكتب|office|دراس/i.test(text) ? 'office' : 'gaming';
    if (!num || !catalog) {
      return { reply: t('اكتب ميزانيتك ونوع الاستخدام (مثلاً: PC ألعاب بـ 30000) وسأجمّع لك تجميعة متوافقة من المخزون.', 'Tell me your budget and use case (e.g. gaming PC for 30000) and I will build a compatible PC from stock.'), build: null };
    }
    const { selected, total } = recommend(catalog.products, num, usage);
    const build = Object.fromEntries(Object.entries(selected).map(([s, p]) => [s, p.id]));
    return {
      reply: t(`جهزت لك تجميعة متوافقة بإجمالي ${money(total)} — تقدر تطبقها على المُجمّع وتعدّل فيها.`, `Here is a compatible build totalling ${money(total)} — apply it to the builder and tweak it.`),
      build,
    };
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      let res;
      try {
        res = await askAssistant(next.map(({ role, content }) => ({ role, content })), lang);
      } catch (e) {
        if (!e.fallback) throw e;
        res = localAnswer(content);
      }
      setMessages(m => [...m, { role: 'assistant', content: res.reply, build: res.build }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: t('عذراً، حدث خطأ: ', 'Sorry, an error occurred: ') + e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const apply = (build) => {
    applyIds(build);
    toast(t('تم تطبيق التجميعة على المُجمّع', 'Build applied to the PC builder'), 'success');
    nav('/builder');
    setOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-20 end-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-600 to-pink-500 text-white shadow-glow md:bottom-6 print:hidden"
        title={t('مساعد الذكاء الاصطناعي', 'AI assistant')}
      >
        <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-500/30" style={{ animationDuration: '2.5s' }} />
        <span className="relative font-display text-sm font-black">{open ? '×' : 'AI'}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-36 end-4 z-50 flex h-[min(70vh,560px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl md:bottom-24"
          >
            <div className="relative overflow-hidden border-b border-line px-4 py-3">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-pink-500/15" />
              <div className="relative flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 font-display text-xs font-black text-white">GPT</span>
                <div>
                  <div className="text-sm font-extrabold">{t('مساعد DOS الذكي', 'DOS AI Assistant')}</div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${shop.ai_enabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {shop.ai_enabled ? t('مدعوم بـ GPT', 'Powered by GPT') : t('وضع التوصية المحلي', 'Local recommendation mode')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3 pt-2 text-center">
                  <div className="text-4xl">🤖</div>
                  <p className="text-sm font-semibold text-muted">{t('اسألني عن أي قطعة أو اطلب تجميعة بميزانيتك', 'Ask me about any part or request a build for your budget')}</p>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-line bg-surface2/50 px-3 py-2 text-start text-xs font-bold transition hover:border-violet-400">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-cyan-600 text-white'
                      : m.error ? 'bg-red-500/10 text-red-500' : 'border border-line bg-surface2/60'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.build && (
                      <div className="mt-2.5 space-y-1.5">
                        {Object.entries(m.build).map(([slug, id]) => {
                          const p = byId.get(id);
                          return p && (
                            <div key={slug} className="flex items-center gap-2 rounded-xl bg-surface/80 p-1.5">
                              <ProductImage src={p.image} slug={slug} name={p.name} className="h-9 w-9 shrink-0" rounded="rounded-lg" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold text-muted">{slotLabel(slug, lang)}</div>
                                <div className="truncate text-xs font-bold">{p.name}</div>
                              </div>
                              <div className="shrink-0 text-[11px] font-black text-violet-500">{money(p.price)}</div>
                            </div>
                          );
                        })}
                        <button onClick={() => apply(m.build)} className="btn-neon mt-1 w-full py-2 text-xs">
                          {t('طبّق على المُجمّع', 'Apply to builder')}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-end">
                  <div className="flex gap-1 rounded-2xl border border-line bg-surface2/60 px-4 py-3">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="h-2 w-2 rounded-full bg-violet-500"
                        animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('اكتب سؤالك...', 'Type your question...')} className="input" />
              <button disabled={busy || !input.trim()} className="btn-primary px-4">{t('إرسال', 'Send')}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
