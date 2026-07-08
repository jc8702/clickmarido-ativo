'use client';

import { useState } from 'react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { formatCurrency } from '@/lib/format';

export default function FluxoCaixaPage() {
  const [filters, setFilters] = useState({ period: 'monthly' });
  const { data, isLoading } = useCashFlow(filters);
  const { data: bankAccounts } = useBankAccounts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Fluxo de Caixa</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Visão projetada e operacional</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filters.period}
            onChange={e => setFilters({ period: e.target.value })}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="projected">Projetado</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Saldo Atual</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(data.totalBalance)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Entradas Previstas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.current.receivable)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Saídas Previstas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.current.payable)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Saldo Projetado</p>
              <p className={`text-2xl font-bold ${data.current.projected >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.current.projected)}
              </p>
            </div>
          </div>

          {/* Projeção */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Projeção Futura</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">30 dias</p>
                <p className={`text-xl font-bold ${data.projection.days30 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.projection.days30)}
                </p>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">60 dias</p>
                <p className={`text-xl font-bold ${data.projection.days60 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.projection.days60)}
                </p>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">90 dias</p>
                <p className={`text-xl font-bold ${data.projection.days90 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.projection.days90)}
                </p>
              </div>
            </div>
          </div>

          {/* Contas Bancárias */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Saldos por Conta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.bankAccounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{account.nickname || account.bankName}</p>
                    <p className="text-sm text-neutral-500">{account.bankName}</p>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(account.currentBalance)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas */}
          {(data.alerts.overdueReceivable.count > 0 || data.alerts.overduePayable.count > 0) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Vencidos</h3>
              <div className="flex flex-wrap gap-4">
                {data.alerts.overdueReceivable.count > 0 && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {data.alerts.overdueReceivable.count} recebimentos vencidos ({formatCurrency(data.alerts.overdueReceivable.total)})
                  </p>
                )}
                {data.alerts.overduePayable.count > 0 && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {data.alerts.overduePayable.count} pagamentos vencidos ({formatCurrency(data.alerts.overduePayable.total)})
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
