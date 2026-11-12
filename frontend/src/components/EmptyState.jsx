import React from 'react';
import { AlertCircle, Search, FileQuestion } from 'lucide-react';

const iconMap = { empty: FileQuestion, search: Search, error: AlertCircle };

export default function EmptyState({ icon = 'empty', title, description, action }) {
  const Icon = iconMap[icon] || FileQuestion;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-vx-secondary border border-vx-border flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-vx-muted" />
      </div>
      <h3 className="text-vx-text font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-vx-muted text-sm max-w-sm mb-5">{description}</p>}
      {action && action}
    </div>
  );
}
