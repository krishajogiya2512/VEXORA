import React from 'react';

export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="mb-4">
        <h3 className="text-vx-text font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-vx-muted text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
