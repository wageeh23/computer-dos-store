import React, { useEffect, useState } from 'react';
import { api, download } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import { PageHead } from './Dashboard.jsx';

export default function Settings() {
  const { t, refreshShop } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/settings').then(s => { setF(s); setKey(s.openai_key_hint || ''); }).catch(e => toast(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/settings', { method: 'PUT', body: { ...f, openai_key: key } });
      toast(t('تم حفظ الإعدادات', 'Settings saved'));
      refreshShop();
      load();
    } catch (e2) { toast(e2.message, 'error'); } finally { setBusy(false); }
  };

  const backup = async () => {
    try { await download('/backup', `computer-dos-store-${new Date().toISOString().slice(0, 10)}.db`); toast(t('تم تحميل النسخة الاحتياطية', 'Backup downloaded')); }
    catch (e) { toast(e.message, 'error'); }
  };

  if (!f) return <div className="h-64 animate-pulse rounded-2xl bg-surface2" />;
  const set = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHead title={t('الإعدادات', 'Settings')} sub={t('بيانات المحل والذكاء الاصطناعي والنسخ الاحتياطي', 'Shop info, AI and backups')}>
        <button disabled={busy} className="btn-primary">{busy ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ الإعدادات', 'Save settings')}</button>
      </PageHead>

      <section className="card">
        <h2 className="mb-4 font-extrabold">🏪 {t('بيانات المحل', 'Shop details')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label className="label">{t('اسم المحل', 'Shop name')}</label><input className="input" value={f.shop_name} onChange={set('shop_name')} /></div>
          <div><label className="label">{t('العملة', 'Currency')}</label><input className="input" dir="ltr" value={f.currency} onChange={set('currency')} placeholder="EGP" /></div>
          <div><label className="label">{t('الهاتف', 'Phone')}</label><input className="input" dir="ltr" value={f.shop_phone} onChange={set('shop_phone')} /></div>
          <div><label className="label">{t('العنوان', 'Address')}</label><input className="input" value={f.shop_address} onChange={set('shop_address')} /></div>
        </div>
      </section>

      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold">🤖 {t('الذكاء الاصطناعي (OpenAI GPT)', 'Artificial Intelligence (OpenAI GPT)')}</h2>
            <span className={`chip ${f.openai_key_set ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
              {f.openai_key_set ? t('مفعّل', 'Enabled') : t('غير مفعّل', 'Disabled')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="label">OpenAI API Key</label>
              <input className="input font-mono" dir="ltr" type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-..." />
              <p className="mt-1 text-[11px] text-muted">
                {t('يُحفظ على السيرفر فقط ولا يُرسل للمتصفح. اتركه فارغاً واحفظ لإيقاف GPT (سيعمل المتجر بالتوصية المحلية).',
                   'Stored on the server only, never sent to browsers. Clear it and save to disable GPT (the store falls back to local recommendations).')}
              </p>
            </div>
            <div><label className="label">{t('نموذج المحادثة', 'Chat model')}</label><input className="input font-mono" dir="ltr" value={f.ai_chat_model} onChange={set('ai_chat_model')} /></div>
            <div><label className="label">{t('نموذج الصور', 'Image model')}</label><input className="input font-mono" dir="ltr" value={f.ai_image_model} onChange={set('ai_image_model')} /></div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 font-extrabold">💾 {t('النسخ الاحتياطي', 'Backup')}</h2>
        <p className="mb-3 text-sm text-muted">{t('حمّل نسخة كاملة من قاعدة البيانات (المنتجات، الفواتير، العملاء، الطلبات...).', 'Download a full copy of the database (products, invoices, customers, orders...).')}</p>
        <button type="button" onClick={backup} className="btn-ghost">⬇ {t('تحميل نسخة احتياطية', 'Download backup')}</button>
      </section>
    </form>
  );
}
