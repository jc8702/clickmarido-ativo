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
    success: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800 text-success-900 dark:text-success-100',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
    warning: 'bg-warning-50 dark:bg-warning-900/30 border-warning-200 dark:border-warning-800 text-warning-900 dark:text-warning-100',
    info: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-100',
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
