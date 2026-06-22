import React from 'react';

type Props = {
  classification: string;
  isBlocked?: boolean;
};

export function VendorClassificationBadge({ classification, isBlocked }: Props) {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
        Bloqueado
      </span>
    );
  }

  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    A: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      label: 'Classe A (Preferencial)',
    },
    B: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/60',
      label: 'Classe B (Aprovado)',
    },
    C: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/60',
      label: 'Classe C (Atenção)',
    },
    D: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/60',
      label: 'Classe D (Não Recomendado)',
    },
  };

  const config = configs[classification] || configs.B;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}
