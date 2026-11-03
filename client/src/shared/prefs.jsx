import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// إعدادات الواجهة المشتركة: اللغة (عربي/إنجليزي) + الوضع (ليلي/نهاري) + بيانات المحل
const PrefsContext = createContext(null);

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };

export function PrefsProvider({ children }) {
  const [lang, setLang] = useState(() => read('dos_lang', 'ar'));
  const [theme, setTheme] = useState(() => read('dos_theme', 'dark'));
  const [shop, setShop] = useState({ shop_name: 'Computer DOS Store', currency: 'EGP', ai_enabled: false });

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('dos_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#06061a' : '#f4f5fb');
    localStorage.setItem('dos_theme', theme);
  }, [theme]);

  const refreshShop = useCallback(() =>
    fetch('/api/public/settings').then(r => r.json()).then(s => setShop(prev => ({ ...prev, ...s }))).catch(() => {}), []);
  useEffect(() => { refreshShop(); }, [refreshShop]);

  const value = useMemo(() => {
    const t = (ar, en) => (lang === 'en' ? en : ar);
    const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
    return {
      lang, setLang, toggleLang: () => setLang(l => (l === 'ar' ? 'en' : 'ar')),
      theme, setTheme, toggleTheme: () => setTheme(m => (m === 'dark' ? 'light' : 'dark')),
      isRTL: lang === 'ar',
      t, fmt,
      money: (n) => `${fmt(n)} ${shop.currency || 'EGP'}`,
      shop, refreshShop,
      // اختيار الحقل حسب اللغة: pick(obj, 'name') → name_en أو name
      pick: (o, key) => (lang === 'en' && o?.[`${key}_en`]) || o?.[key] || '',
    };
  }, [lang, theme, shop, refreshShop]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);

// أزرار تبديل اللغة والوضع
export function PrefToggles({ className = '' }) {
  const { lang, toggleLang, theme, toggleTheme, t } = usePrefs();
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={toggleLang}
        title={t('English', 'العربية')}
        className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-line bg-surface2/60 px-2 text-xs font-black text-fg transition hover:border-violet-400"
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? t('الوضع النهاري', 'Light mode') : t('الوضع الليلي', 'Dark mode')}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface2/60 text-fg transition hover:border-violet-400"
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-amber-300" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-violet-600" fill="currentColor">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
