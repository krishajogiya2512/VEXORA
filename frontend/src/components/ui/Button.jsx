import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Design-system Button
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg ' +
    'transition-all duration-150 active:scale-[0.98] select-none ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ';

  const variants = {
    primary:   'bg-gradient-to-r from-vx-accent to-vx-accent-d text-vx-invert shadow-sm hover:brightness-110',
    secondary: 'bg-vx-secondary text-vx-sub border border-vx-border hover:bg-vx-elevated hover:text-vx-text hover:border-vx-border-s',
    ghost:     'text-vx-muted hover:text-vx-text hover:bg-vx-secondary',
    danger:    'bg-vx-danger/90 text-white hover:bg-vx-danger',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;

