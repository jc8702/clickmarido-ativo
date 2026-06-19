'use client';

import React from 'react';

export function AddressSelector({ addresses, onSelect }: { addresses: any[], onSelect: (addr: any) => void }) {
  if (!addresses || addresses.length === 0) return <p className="text-gray-500 text-sm">Nenhum endereço cadastrado.</p>;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Selecione um Endereço para a OS</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(a => (
          <div 
            key={a.id} 
            className="p-4 border rounded cursor-pointer hover:border-blue-500 transition-colors bg-white shadow-sm"
            onClick={() => onSelect(a)}
          >
            <p className="font-medium text-gray-800">{a.street}, {a.number}</p>
            <p className="text-sm text-gray-500">{a.neighborhood} - {a.city}/{a.state}</p>
            <p className="text-sm text-gray-500">CEP: {a.postal_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
