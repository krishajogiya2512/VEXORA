import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', message }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeMap[size]} text-vx-blue animate-spin`} />
      {message && <p className="text-vx-muted text-sm">{message}</p>}
    </div>
  );
}
