import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Design-system Dropdown / Select
 * options: [{ value, label }]
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          'w-full flex items-center justify-between gap-2 ' +
          'bg-vx-secondary border border-vx-border rounded-lg px-3.5 py-2.5 ' +
          'text-sm text-left transition-all duration-150 ' +
          'focus:outline-none focus:ring-2 focus:ring-vx-accent/30 focus:border-vx-accent ' +
          (selected ? 'text-vx-text' : 'text-vx-muted') +
          (disabled ? ' opacity-40 cursor-not-allowed' : ' cursor-pointer hover:border-vx-border-s')
        }
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-vx-muted shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-vx-elevated border border-vx-border rounded-xl shadow-card-lg overflow-hidden">
          <ul className="py-1 max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                className={
                  'flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer ' +
                  'transition-colors duration-100 ' +
                  (opt.value === value
                    ? 'text-vx-accent bg-vx-accent-s'
                    : 'text-vx-text hover:bg-vx-secondary')
                }
              >
                {opt.label}
                {opt.value === value && <Check className="w-3.5 h-3.5 text-vx-accent shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

