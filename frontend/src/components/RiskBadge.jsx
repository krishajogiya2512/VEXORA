import React from 'react';

const riskConfig = {
  LOW:      { label: 'Low Risk',      cls: 'badge-low' },
  MEDIUM:   { label: 'Medium Risk',   cls: 'badge-medium' },
  HIGH:     { label: 'High Risk',     cls: 'badge-high' },
  CRITICAL: { label: 'Critical Risk', cls: 'badge-critical' },
};

const statusConfig = {
  PENDING:               { label: 'Pending',              cls: 'badge-pending' },
  UNDER_REVIEW:          { label: 'Under Review',         cls: 'badge-review' },
  VERIFIED_SUSPICIOUS:   { label: 'Verified Suspicious',  cls: 'badge-verified' },
  INSUFFICIENT_EVIDENCE: { label: 'Insufficient Evidence',cls: 'badge-pending' },
  ESCALATED:             { label: 'Escalated',            cls: 'badge-high' },
  CLOSED:                { label: 'Closed',               cls: 'badge-closed' },
};

const DEFAULT_BADGE = { label: 'Pending', cls: 'badge-pending' };

export function RiskBadge({ level }) {
  const badgeConfig = (level && riskConfig[level]) || { label: level || 'Unknown', cls: 'badge-pending' };
  return <span className={`badge ${badgeConfig.cls}`}>{badgeConfig.label}</span>;
}

export function StatusBadge({ status }) {
  const badgeConfig = (status && statusConfig[status]) || { label: status || 'Unknown', cls: 'badge-pending' };
  return <span className={`badge ${badgeConfig.cls}`}>{badgeConfig.label}</span>;
}
