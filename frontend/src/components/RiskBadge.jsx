import React from 'react';

const riskConfig = {
  LOW:      { label: 'Low Risk',      cls: 'badge-low',      dot: 'bg-green-400' },
  MEDIUM:   { label: 'Medium Risk',   cls: 'badge-medium',   dot: 'bg-amber-400' },
  HIGH:     { label: 'High Risk',     cls: 'badge-high',     dot: 'bg-red-400' },
  CRITICAL: { label: 'Critical Risk', cls: 'badge-critical', dot: 'bg-purple-400' },
};

const statusConfig = {
  PENDING:               { label: 'Pending',              cls: 'badge-pending',  dot: 'bg-vx-muted' },
  UNDER_REVIEW:          { label: 'Under Review',         cls: 'badge-review',   dot: 'bg-sky-400' },
  VERIFIED_SUSPICIOUS:   { label: 'Verified Suspicious',  cls: 'badge-verified', dot: 'bg-vx-accent' },
  INSUFFICIENT_EVIDENCE: { label: 'Insufficient Evidence',cls: 'badge-pending',  dot: 'bg-vx-muted' },
  ESCALATED:             { label: 'Escalated',            cls: 'badge-high',     dot: 'bg-red-400' },
  CLOSED:                { label: 'Closed',               cls: 'badge-closed',   dot: 'bg-vx-muted' },
};

export function RiskBadge({ level }) {
  const badgeConfig = (level && riskConfig[level]) || { label: level || 'Unknown', cls: 'badge-pending', dot: 'bg-vx-muted' };
  return (
    <span className={`badge ${badgeConfig.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dot} shrink-0`} />
      {badgeConfig.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const badgeConfig = (status && statusConfig[status]) || { label: status || 'Unknown', cls: 'badge-pending', dot: 'bg-vx-muted' };
  return (
    <span className={`badge ${badgeConfig.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dot} shrink-0`} />
      {badgeConfig.label}
    </span>
  );
}
