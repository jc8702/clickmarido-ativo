import React, { useState } from 'react';
import { useVendorPurchaseHistory } from '../../hooks/useVendors';
import { Shimmer } from '../Shimmer';
import Link from 'next/link';

type Props = {
  vendorId: string;
};

export function VendorPurchaseHistory({ vendorId }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useVendorPurchaseHistory(vendorId, page);

  if (isLoading) {
    return <Shimmer className="h-48 w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
        Ocorreu um erro ao carregar o histórico de compras: {error}
      </div>
    );
  }

  const { data: orders = [], meta = { total: 0, page: 1, limit: 10, totalPages: 1 }, stats = { totalSpent: 0, ordersCount: 0 } } = data || {};

  return (
    <div className="space-y-4">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded shadow border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Total Investido</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSpent)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded shadow border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Pedidos Emitidos</span>
          <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-2">
            {stats.ordersCount} {stats.ordersCount === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
      </div>

      {/* Tabela de Ordens */}
      <div className="bg-white dark:bg-neutral-800 rounded shadow overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
              <tr>
                <th className="px-6 py-3 text-left">Número</th>
                <th className="px-6 py-3 text-left">Data de Emissão</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Valor Total</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 text-neutral-800 dark:text-neutral-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    Nenhum pedido de compra emitido para este fornecedor.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-4 font-semibold text-primary-600 dark:text-primary-400">
                      <Link href={`/purchases/${order.id}`}>
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.issueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        order.status === 'recebida'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
                          : order.status === 'cancelada'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                          : order.status === 'aprovada'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800'
                          : order.status === 'parcialmente_recebida'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/purchases/${order.id}`} 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold"
                      >
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {meta.totalPages > 1 && (
          <div className="bg-neutral-50 dark:bg-neutral-700/30 px-6 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Mostrando página {meta.page} de {meta.totalPages} ({meta.total} registros)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                Anterior
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
