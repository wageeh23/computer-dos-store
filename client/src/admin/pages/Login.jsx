import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, saveAuth, getToken } from '../api.js';
import { usePrefs, PrefToggles } from '../../shared/prefs.jsx';
import { ParticleField, ScrambleText } from '../../shared/fx/index.jsx';

export default function Login() {
  const { t } = usePrefs();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (getToken()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: form });
      saveAuth(data.token, data.user);
      nav('/', { replace: true });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <ParticleField className="absolute inset-0" />
      <div className="aurora" />
      <div className="cyber-grid pointer-events-none absolute inset-0" />
      <div className="orb h-96 w-96 bg-violet-600" style={{ top: '-10%', insetInlineStart: '-10%' }} />
      <div className="orb h-96 w-96 bg-cyan-500" style={{ bottom: '-10%', insetInlineEnd: '-10%' }} />
      <PrefToggles className="absolute end-4 top-4" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="rgb-border relative w-full max-w-sm">
        <div className="rgb-inner p-8">
          <div className="mb-7 text-center">
            <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ repeat: Infinity, duration: 5 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-600 to-pink-500 font-display text-lg font-black text-white shadow-glow">DOS</motion.div>
            <h1 className="neon-text font-display text-xl font-black" dir="ltr"><ScrambleText text="COMPUTER DOS" /></h1>
            <p className="mt-1 text-xs font-bold tracking-widest text-muted">{t('لوحة تحكم الإدارة', 'ADMIN CONTROL PANEL')}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {err && <motion.div initial={{ x: -10 }} animate={{ x: [10, -8, 6, 0] }} className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-500">{err}</motion.div>}
            <div><label className="label">{t('اسم المستخدم', 'Username')}</label><input className="input" autoFocus value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
            <div><label className="label">{t('كلمة المرور', 'Password')}</label><input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
            <button disabled={busy} className="btn-neon w-full">{busy ? t('جارٍ الدخول...', 'Signing in...') : t('تسجيل الدخول', 'Sign in')}</button>
          </form>
          <a href="/" className="mt-5 block text-center text-xs font-bold text-muted hover:text-fg">← {t('العودة للمتجر', 'Back to store')}</a>
        </div>
      </motion.div>
    </div>
  );
}
