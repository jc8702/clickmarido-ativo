'use client';

import React from 'react';

export function AddressSelector({ addresses, onSelect }: { addresses: any[], onSelect: (addr: any) => void }) {
  if (!addresses || addresses.length === 0) return <p className="text-neutral-500 dark:text-neutral-400 text-sm">Nenhum endereço cadastrado.</p>;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Selecione um Endereço para a OS</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(a => (
          <div 
            key={a.id} 
            className="p-4 border border-neutral-200 dark:border-neutral-600 rounded cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-white dark:bg-neutral-800 shadow-sm"
            onClick={() => onSelect(a)}
          >
            <p className="font-medium text-neutral-800 dark:text-neutral-200">{a.street}, {a.number}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{a.neighborhood} - {a.city}/{a.state}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">CEP: {a.postal_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
