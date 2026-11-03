import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function Modal({ title, onClose, children, wide, xwide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // بوابة إلى body حتى لا يتأثر المودال بتحويلات العناصر الأب المتحركة
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md print:hidden"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ transformPerspective: 1200 }}
        className={`relative w-full ${xwide ? 'max-w-5xl' : wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-surface p-5 text-fg shadow-[0_30px_80px_-20px_rgba(139,92,246,.45)]`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xl leading-none text-muted hover:bg-surface2 hover:text-fg">×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}
