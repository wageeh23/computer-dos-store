import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadCatalog } from '../lib/catalog.js';

// حالة مشتركة للمتجر: الكتالوج + التجميعة الحالية (محفوظة محلياً)
const BuildContext = createContext(null);
const LS_KEY = 'dos_build_v2';

export function BuildProvider({ children }) {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(false);
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
  });

  useEffect(() => { loadCatalog().then(setCatalog).catch(() => setError(true)); }, []);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(ids)); }, [ids]);

  const value = useMemo(() => {
    const byId = new Map((catalog?.products || []).map(p => [p.id, p]));
    const selected = {};
    for (const [slug, id] of Object.entries(ids)) if (byId.has(id)) selected[slug] = byId.get(id);
    return {
      catalog, error, selected,
      count: Object.keys(selected).length,
      total: Object.values(selected).reduce((s, p) => s + p.price, 0),
      setSlot: (slug, product) => setIds(m => ({ ...m, [slug]: product.id })),
      clearSlot: (slug) => setIds(m => { const n = { ...m }; delete n[slug]; return n; }),
      clearAll: () => setIds({}),
      setSelected: (sel) => setIds(Object.fromEntries(Object.entries(sel).filter(([, p]) => p).map(([s, p]) => [s, p.id]))),
      applyIds: (map, merge = false) => setIds(m => ({ ...(merge ? m : {}), ...map })),
    };
  }, [catalog, error, ids]);

  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export const useBuild = () => useContext(BuildContext);
