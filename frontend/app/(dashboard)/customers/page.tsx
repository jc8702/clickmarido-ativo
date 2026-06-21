'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';

export default function CustomersPage() {
  const { data, isLoading, mutate } = useCustomers(1, '');
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    mutate();
  }, [mutate]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/dashboard/customers/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Novo Cliente
        </Link>
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}

      {!isLoading && data.data.length === 0 && (
        <p className="text-gray-600">Nenhum cliente cadastrado</p>
      )}

      {data.data.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((customer: any) => (
                <tr key={customer.id} className="border-b">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-blue-600 hover:underline"
                    >
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
