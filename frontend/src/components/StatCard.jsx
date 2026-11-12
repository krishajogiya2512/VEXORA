import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
    green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  border: 'border-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', border: 'border-yellow-500/20' },
    red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    border: 'border-red-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card hover:border-vx-blue/30 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-vx-muted text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-vx-text">
            {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
          </p>
          {subtitle && <p className="text-vx-muted text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend > 0 ? (
            <><TrendingUp className="w-3 h-3 text-green-400" /><span className="text-green-400">+{trend}%</span></>
          ) : trend < 0 ? (
            <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400">{trend}%</span></>
          ) : (
            <><Minus className="w-3 h-3 text-vx-muted" /><span className="text-vx-muted">No change</span></>
          )}
          <span className="text-vx-muted ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
