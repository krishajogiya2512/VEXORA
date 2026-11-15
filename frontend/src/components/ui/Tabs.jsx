import { useState } from 'react';

/**
 * Design-system Tabs
 * tabs: [{ key, label, icon?: IconComponent }]
 * variant: 'underline' | 'pill'
 */
export default function Tabs({
  tabs = [],
  defaultTab,
  onChange,
  variant = 'underline',
  className = '',
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);

  function handleChange(key) {
    setActive(key);
    onChange?.(key);
  }

  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-vx-secondary rounded-lg ${className}`}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleChange(key)}
            className={
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ' +
              'transition-all duration-150 ' +
              (active === key
                ? 'bg-vx-elevated text-vx-text shadow-card'
                : 'text-vx-muted hover:text-vx-text')
            }
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>
    );
  }

  // underline variant
  return (
    <div className={`flex items-end gap-5 border-b border-vx-border ${className}`}>
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleChange(key)}
          className={
            'flex items-center gap-1.5 pb-2.5 text-sm font-medium ' +
            'border-b-2 -mb-px transition-all duration-150 ' +
            (active === key
              ? 'border-vx-accent text-vx-accent'
              : 'border-transparent text-vx-muted hover:text-vx-text')
          }
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}

