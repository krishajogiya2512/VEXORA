import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card w-full max-w-md mx-4">
        <button onClick={onCancel} className="absolute top-4 right-4 text-vx-muted hover:text-vx-text">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/15' : 'bg-yellow-500/15'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <h3 className="text-vx-text font-semibold text-base mb-1">{title}</h3>
            <p className="text-vx-muted text-sm">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onConfirm} className={`${danger ? 'btn-danger' : 'btn-primary'} text-sm py-2 px-4`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
