'use client';

import { useState } from 'react';
import { useRentability } from '@/hooks/useRentability';
import { formatCurrency } from '@/lib/format';

export default function RentabilidadePage() {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useRentability(filters);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Rentabilidade</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Margem real por operação</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Total de Ordens</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.summary.totalOrders}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Lucro Total</p>
              <p className={`text-2xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.totalProfit)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Margem Média</p>
              <p className={`text-2xl font-bold ${data.summary.averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.averageMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Mais Lucrativas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Mais Lucrativas
              </h2>
              {data.mostProfitable.length === 0 ? (
                <p className="text-neutral-500 text-sm">Nenhuma operação registrada</p>
              ) : (
                <div className="space-y-3">
                  {data.mostProfitable.map((op) => (
                    <div key={op.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{op.number}</p>
                        <p className="text-sm text-neutral-500">{op.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(op.grossProfit)}</p>
                        <p className="text-sm text-neutral-500">{op.margin.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Menos Lucrativas
              </h2>
              {data.leastProfitable.length === 0 ? (
                <p className="text-neutral-500 text-sm">Nenhuma operação registrada</p>
              ) : (
                <div className="space-y-3">
                  {data.leastProfitable.map((op) => (
                    <div key={op.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{op.number}</p>
                        <p className="text-sm text-neutral-500">{op.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${op.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(op.grossProfit)}
                        </p>
                        <p className="text-sm text-neutral-500">{op.margin.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Análise por Cliente */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Análise por Cliente
            </h2>
            {data.customerAnalysis.length === 0 ? (
              <p className="text-neutral-500 text-sm">Nenhuma análise disponível</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Cliente</th>
                      <th className="text-right p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Ordens</th>
                      <th className="text-right p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Receita</th>
                      <th className="text-right p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Custo</th>
                      <th className="text-right p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Lucro</th>
                      <th className="text-right p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customerAnalysis.map((c, i) => (
                      <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="p-3 font-medium text-neutral-900 dark:text-white">
                          {c.customer?.name || 'Sem cliente'}
                        </td>
                        <td className="p-3 text-right text-neutral-600 dark:text-neutral-400">{c.orders}</td>
                        <td className="p-3 text-right text-neutral-900 dark:text-white">{formatCurrency(c.totalRevenue)}</td>
                        <td className="p-3 text-right text-neutral-600 dark:text-neutral-400">{formatCurrency(c.totalCost)}</td>
                        <td className={`p-3 text-right font-semibold ${c.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(c.totalProfit)}
                        </td>
                        <td className={`p-3 text-right ${c.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {c.margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
