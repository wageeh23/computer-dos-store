import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// إشعارات منبثقة (Toasts) مشتركة بين المتجر ولوحة التحكم
const ToastContext = createContext(() => {});

const STYLES = {
  success: { bar: 'from-emerald-400 to-cyan-400', icon: '✔' },
  error: { bar: 'from-red-500 to-pink-500', icon: '✖' },
  info: { bar: 'from-cyan-400 to-violet-500', icon: 'ℹ' },
  order: { bar: 'from-violet-500 to-pink-500', icon: '🛒' },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, type = 'success', opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems(list => [...list.slice(-4), { id, message, type, title: opts.title }]);
    setTimeout(() => setItems(list => list.filter(i => i.id !== id)), opts.duration || 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 print:hidden">
        <AnimatePresence>
          {items.map(i => (
            <motion.div
              key={i.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="glass pointer-events-auto relative overflow-hidden rounded-2xl px-4 py-3 shadow-2xl"
              onClick={() => setItems(list => list.filter(x => x.id !== i.id))}
            >
              <div className={`absolute inset-y-0 start-0 w-1 bg-gradient-to-b ${STYLES[i.type]?.bar || STYLES.info.bar}`} />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-sm">{STYLES[i.type]?.icon}</span>
                <div className="min-w-0 flex-1">
                  {i.title && <div className="text-sm font-extrabold text-fg">{i.title}</div>}
                  <div className="text-sm font-semibold text-fg/90">{i.message}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
