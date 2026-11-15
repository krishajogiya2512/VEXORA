import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Toast Context ────────────────────────────────────────────
   Usage:
     import { useToast } from '@/components/ui/Toast';
     const toast = useToast();
     toast.success('Saved!');
     toast.error('Something went wrong');
     toast.info('Report generated');
     toast.warn('Action may be irreversible');
─────────────────────────────────────────────────────────────── */

let _addToast = null;

/** Singleton imperative API — works without wrapping the whole app. */
export function toast(message, type = 'info', duration = 4000) {
  _addToast?.({ message, type, duration, id: Date.now() + Math.random() });
}
toast.success = (m, d) => toast(m, 'success', d);
toast.error   = (m, d) => toast(m, 'error',   d);
toast.warn    = (m, d) => toast(m, 'warn',     d);
toast.info    = (m, d) => toast(m, 'info',     d);

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warn:    AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: 'border-green-500/30  text-green-400',
  error:   'border-vx-danger/30  text-vx-danger',
  warn:    'border-yellow-500/30 text-yellow-400',
  info:    'border-vx-border-s   text-vx-sub',
};

function ToastItem({ id, message, type, onRemove }) {
  useEffect(() => {
    // auto-dismiss handled by ToastProvider
  }, []);

  const Icon = ICONS[type] ?? Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={
        'flex items-start gap-3 min-w-[260px] max-w-sm w-full ' +
        'bg-vx-elevated border rounded-xl px-4 py-3 shadow-card-lg ' +
        STYLES[type]
      }
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-vx-text leading-snug">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 text-vx-muted hover:text-vx-text transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/** Mount <ToastProvider /> once near the top of your app (inside main.jsx or App.jsx). */
export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, t.duration ?? 4000);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end no-drag">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default toast;

