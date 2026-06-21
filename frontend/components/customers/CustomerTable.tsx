'use client';

import React from 'react';
import Link from 'next/link';

export function CustomerTable({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <div className="p-4 text-center text-neutral-900 dark:text-neutral-100">Carregando...</div>;

  return (
    <div className="overflow-x-auto bg-white dark:bg-neutral-800 rounded shadow">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Nome</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Telefone</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Pedidos</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Gasto Total</th>
            <th className="p-4 font-semibold text-neutral-700 dark:text-neutral-300">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-neutral-500 dark:text-neutral-400">Nenhum cliente encontrado.</td>
            </tr>
          )}
          {data?.data?.map((c: any) => (
            <tr key={c.id} className="border-b border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
              <td className="p-4 text-neutral-900 dark:text-neutral-100">{c.name}</td>
              <td className="p-4 text-neutral-900 dark:text-neutral-100">{c.phone}</td>
              <td className="p-4 text-neutral-900 dark:text-neutral-100">{c.total_orders}</td>
              <td className="p-4 text-neutral-900 dark:text-neutral-100">R$ {c.total_spent}</td>
              <td className="p-4">
                <Link href={`/customers/${c.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
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
