/**
 * Design-system EmptyState
 */
export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={
        'flex flex-col items-center justify-center text-center py-16 px-6 ' + className
      }
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-vx-secondary border border-vx-border mb-5">
          <Icon className="w-7 h-7 text-vx-muted" />
        </div>
      )}
      <p className="text-sm font-semibold text-vx-sub mb-1">{title}</p>
      {description && (
        <p className="text-xs text-vx-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

