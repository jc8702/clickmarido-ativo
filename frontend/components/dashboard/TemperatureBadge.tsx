import React from 'react';

interface TemperatureBadgeProps {
  temperature?: string; // 'QUENTE', 'MORNO', 'FRIO'
}

export function TemperatureBadge({ temperature }: TemperatureBadgeProps) {
  if (!temperature) return null;

  const getTemperatureConfig = (temp: string) => {
    switch (temp.toUpperCase()) {
      case 'QUENTE':
        return {
          icon: '🔥',
          label: 'Quente',
          color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        };
      case 'MORNO':
        return {
          icon: '🟡',
          label: 'Morno',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        };
      case 'FRIO':
        return {
          icon: '❄️',
          label: 'Frio',
          color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        };
      default:
        return null;
    }
  };

  const config = getTemperatureConfig(temperature);

  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${config.color}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
