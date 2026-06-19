'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuotations } from '../../../hooks/useQuotations';

export default function QuotationsPage() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuotations(filter);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || colors.draft}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm">Gerencie propostas e aprovações</p>
        </div>
        <Link href="/quotations/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          + Novo Orçamento
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setFilter('')} className={`px-3 py-1 rounded border ${!filter ? 'bg-gray-200' : 'bg-white'}`}>Todos</button>
        <button onClick={() => setFilter('draft')} className={`px-3 py-1 rounded border ${filter==='draft' ? 'bg-gray-200' : 'bg-white'}`}>Rascunhos</button>
        <button onClick={() => setFilter('sent')} className={`px-3 py-1 rounded border ${filter==='sent' ? 'bg-gray-200' : 'bg-white'}`}>Enviados</button>
        <button onClick={() => setFilter('approved')} className={`px-3 py-1 rounded border ${filter==='approved' ? 'bg-gray-200' : 'bg-white'}`}>Aprovados</button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4 font-semibold text-gray-700">Número</th>
              <th className="p-4 font-semibold text-gray-700">Cliente</th>
              <th className="p-4 font-semibold text-gray-700">Valor Total</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700">Validade</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-4 text-center">Carregando...</td></tr> : 
              data?.map((q: any) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{q.number}</td>
                  <td className="p-4">{q.customer_name}</td>
                  <td className="p-4">R$ {q.total}</td>
                  <td className="p-4">{getStatusBadge(q.status)}</td>
                  <td className="p-4">{new Date(q.valid_until).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Link href={`/quotations/${q.id}`} className="text-blue-600 hover:underline">Ver Detalhes</Link>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
