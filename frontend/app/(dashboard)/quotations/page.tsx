'use client';

import Link from 'next/link';
import { useQuotations } from '@/hooks/useQuotations';
import { useEffect, useState } from 'react';

export default function QuotationsPage() {
  const { data, isLoading, mutate } = useQuotations(undefined, 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    mutate();
  }, [mutate]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
        <Link
          href="/dashboard/quotations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Novo Orçamento
        </Link>
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}

      {!isLoading && data.data.length === 0 && (
        <p className="text-gray-600">Nenhum orçamento cadastrado</p>
      )}

      {data.data.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Total</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((q: any) => (
                <tr key={q.id}>
                  <td className="px-6 py-4 text-sm">{q.customer.name}</td>
                  <td className="px-6 py-4 text-sm">R$ {q.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{q.status}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/quotations/${q.id}`} className="text-blue-600 hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
