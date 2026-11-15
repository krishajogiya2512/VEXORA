import { forwardRef } from 'react';

/**
 * Design-system Input / Textarea
 * size: 'sm' | 'md'
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    size = 'md',
    multiline = false,
    rows = 4,
    className = '',
    ...props
  },
  ref
) {
  const base =
    'w-full bg-vx-secondary border border-vx-border rounded-lg ' +
    'text-vx-text placeholder:text-vx-muted ' +
    'focus:outline-none focus:ring-2 focus:ring-vx-accent/30 focus:border-vx-accent ' +
    'transition-all duration-150 ';

  const errorStyle = error ? 'border-vx-danger focus:ring-vx-danger/30 focus:border-vx-danger ' : '';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3.5 py-2.5 text-sm',
  };

  const field = multiline ? (
    <textarea
      ref={ref}
      rows={rows}
      className={`${base} ${errorStyle} ${sizes[size]} resize-none ${className}`}
      {...props}
    />
  ) : (
    <input
      ref={ref}
      className={`${base} ${errorStyle} ${sizes[size]} ${className}`}
      {...props}
    />
  );

  if (!label && !error && !hint) return field;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-vx-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      {field}
      {(error || hint) && (
        <p className={`text-xs ${error ? 'text-vx-danger' : 'text-vx-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Input;

