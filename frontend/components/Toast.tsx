'use client';

import React from 'react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
}

export function Toast({ type, title, message, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorMap = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-primary-50 border-primary-200 text-primary-900',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        flex gap-4 p-4 rounded-lg border-l-4 border
        ${colorMap[type]}
        animate-slide-down shadow-lg
      `}
    >
      <div className="text-xl font-bold flex-shrink-0">{iconMap[type]}</div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        {message && <p className="text-sm mt-0.5 opacity-75">{message}</p>}
      </div>
      <button onClick={onClose} className="text-lg opacity-50 hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  );
}
