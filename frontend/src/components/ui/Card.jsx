/**
 * Design-system Card primitives
 *
 * <Card>          – standard surface
 * <Card.Header>   – title + optional action slot
 * <Card.Body>     – padded content area
 * <Card.Footer>   – footer row
 * <KpiCard>       – headline metric tile
 */

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={
        'bg-vx-card border border-vx-border rounded-xl shadow-card ' +
        'bg-[linear-gradient(135deg,rgba(255,255,255,0.025)_0%,transparent_60%)] ' +
        (hover ? 'hover:border-vx-border-s hover:shadow-card-lg transition-all duration-200 ' : '') +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-5 pt-5 pb-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-vx-text">{title}</h3>
        {subtitle && <p className="text-xs text-vx-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '', noPadding = false }) {
  return (
    <div className={noPadding ? className : `px-5 pb-5 ${className}`}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`px-5 py-3 border-t border-vx-border flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
};

/** Headline KPI metric tile */
export function KpiCard({ label, value, icon: Icon, trend, color = 'text-vx-accent', onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={
        'bg-vx-card border border-vx-border rounded-xl p-5 shadow-card ' +
        'bg-[linear-gradient(135deg,rgba(255,255,255,0.025)_0%,transparent_60%)] ' +
        'flex flex-col gap-3 hover:border-vx-border-s hover:shadow-card-lg ' +
        'transition-all duration-200 ' +
        (onClick ? 'cursor-pointer ' : '') +
        className
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-vx-muted uppercase tracking-widest">{label}</span>
        {Icon && (
          <span className={`p-2 rounded-lg bg-vx-secondary ${color}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="font-mono text-3xl font-bold text-vx-text tracking-tight">{value}</div>
      {trend !== undefined && (
        <div className="text-xs text-vx-muted">{trend}</div>
      )}
    </div>
  );
}

export default Card;

