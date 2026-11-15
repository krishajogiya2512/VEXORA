import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Design-system Modal
 * size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const sizes = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-drag">
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={
              `relative z-10 w-full ${sizes[size]} ` +
              'bg-vx-elevated border border-vx-border rounded-2xl shadow-card-lg ' +
              'flex flex-col overflow-hidden ' +
              className
            }
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-vx-border shrink-0">
                <div>
                  {title && <h2 className="text-base font-semibold text-vx-text">{title}</h2>}
                  {subtitle && <p className="text-xs text-vx-muted mt-0.5">{subtitle}</p>}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-1.5 rounded-lg text-vx-muted hover:text-vx-text hover:bg-vx-secondary transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-vx-border flex items-center justify-end gap-2 shrink-0 bg-vx-secondary/30">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

