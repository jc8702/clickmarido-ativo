'use client';

import React from 'react';
import Link from 'next/link';

export function CustomerTable({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <div className="p-4 text-center">Carregando...</div>;

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-4 font-semibold text-gray-700">Nome</th>
            <th className="p-4 font-semibold text-gray-700">Telefone</th>
            <th className="p-4 font-semibold text-gray-700">Pedidos</th>
            <th className="p-4 font-semibold text-gray-700">Gasto Total</th>
            <th className="p-4 font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">Nenhum cliente encontrado.</td>
            </tr>
          )}
          {data?.data?.map((c: any) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-4">{c.name}</td>
              <td className="p-4">{c.phone}</td>
              <td className="p-4">{c.total_orders}</td>
              <td className="p-4">R$ {c.total_spent}</td>
              <td className="p-4">
                <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
