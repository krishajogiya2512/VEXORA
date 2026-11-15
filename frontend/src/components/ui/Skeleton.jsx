/**
 * Design-system Skeleton placeholders
 */

export function Skeleton({ className = '' }) {
  return (
    <div
      className={
        'rounded-md bg-vx-secondary relative overflow-hidden ' + className
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.045) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s linear infinite',
        }}
      />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-vx-card border border-vx-border rounded-xl p-5 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

export function SkeletonRow({ cols = 5, className = '' }) {
  return (
    <tr className={`border-b border-vx-border/60 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;

