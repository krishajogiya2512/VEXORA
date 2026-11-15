/**
 * Design-system Badge
 * variant: risk levels or status strings — auto-resolved
 */

const RISK_VARIANTS = {
  low:      'bg-green-500/12  text-green-400  ring-1 ring-green-500/25',
  medium:   'bg-amber-500/12  text-amber-400  ring-1 ring-amber-500/25',
  high:     'bg-red-500/12    text-red-400    ring-1 ring-red-500/25',
  critical: 'bg-purple-500/12 text-purple-400 ring-1 ring-purple-500/25',
};

const STATUS_VARIANTS = {
  pending:    'bg-vx-muted/12  text-vx-sub     ring-1 ring-vx-muted/25',
  review:     'bg-sky-500/12   text-sky-400    ring-1 ring-sky-500/25',
  'in-review':'bg-sky-500/12   text-sky-400    ring-1 ring-sky-500/25',
  'in review':'bg-sky-500/12   text-sky-400    ring-1 ring-sky-500/25',
  verified:   'bg-vx-accent/12 text-vx-accent  ring-1 ring-vx-accent/25',
  confirmed:  'bg-vx-accent/12 text-vx-accent  ring-1 ring-vx-accent/25',
  active:     'bg-vx-accent/12 text-vx-accent  ring-1 ring-vx-accent/25',
  open:       'bg-sky-500/12   text-sky-400    ring-1 ring-sky-500/25',
  closed:     'bg-vx-secondary text-vx-muted   ring-1 ring-vx-border',
  draft:      'bg-vx-muted/12  text-vx-muted   ring-1 ring-vx-muted/25',
  resolved:   'bg-green-500/12 text-green-400  ring-1 ring-green-500/25',
  escalated:  'bg-red-500/12   text-red-400    ring-1 ring-red-500/25',
  dismissed:  'bg-vx-secondary text-vx-muted   ring-1 ring-vx-border',
};

export default function Badge({ children, variant, dot = true, className = '' }) {
  const key = (variant || String(children)).toLowerCase().trim();
  const style =
    RISK_VARIANTS[key] ||
    STATUS_VARIANTS[key] ||
    'bg-vx-secondary text-vx-sub ring-1 ring-vx-border';

  return (
    <span
      className={
        `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ` +
        `text-[10px] font-semibold tracking-wide uppercase ${style} ${className}`
      }
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90 shrink-0" />}
      {children}
    </span>
  );
}

