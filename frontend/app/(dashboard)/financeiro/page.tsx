'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFinancialDashboard } from '@/hooks/useFinancialDashboard';
import { formatCurrency } from '@/lib/format';

const financialSections = [
  {
    title: 'Contas Bancárias',
    description: 'Gerencie suas contas e saldos',
    href: '/financeiro/contas-bancarias',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    title: 'Plano de Contas',
    description: 'Classifique receitas e despesas',
    href: '/financeiro/plano-contas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: 'bg-purple-500',
  },
  {
    title: 'Contas a Receber',
    description: 'Títulos e recebimentos',
    href: '/financeiro/receber',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-500',
  },
  {
    title: 'Contas a Pagar',
    description: 'Títulos e pagamentos',
    href: '/financeiro/pagar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-red-500',
  },
  {
    title: 'Despesas Fixas',
    description: 'Recorrências e previsões',
    href: '/financeiro/fixas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: 'bg-orange-500',
  },
  {
    title: 'Fluxo de Caixa',
    description: 'Visão projetada e operacional',
    href: '/financeiro/fluxo-caixa',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: 'bg-teal-500',
  },
  {
    title: 'DRE',
    description: 'Demonstrativo de resultado',
    href: '/financeiro/dre',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    ),
    color: 'bg-indigo-500',
  },
  {
    title: 'Rentabilidade',
    description: 'Margem real por operação',
    href: '/financeiro/rentabilidade',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    color: 'bg-pink-500',
  },
  {
    title: 'Conciliação Bancária',
    description: 'Conciliação de extratos',
    href: '/financeiro/conciliacao-bancaria',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-cyan-500',
  },
];

export default function FinanceiroPage() {
  const { data: dashboard, isLoading } = useFinancialDashboard();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Central Financeira
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Gestão completa das finanças da empresa
          </p>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Saldo Consolidado</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(dashboard?.totalBalance || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">A Receber</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(dashboard?.receivables.pending || 0)}
          </p>
          <p className="text-xs text-neutral-500">{dashboard?.receivables.count || 0} títulos</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">A Pagar</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(dashboard?.payables.pending || 0)}
          </p>
          <p className="text-xs text-neutral-500">{dashboard?.payables.count || 0} títulos</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Projeção 30 dias</p>
          <p className={`text-2xl font-bold ${(dashboard?.projection.net || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(dashboard?.projection.net || 0)}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {(dashboard?.overdueReceivables.count || 0) > 0 || (dashboard?.overduePayables.count || 0) > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Alertas</h3>
          <div className="flex flex-wrap gap-4">
            {(dashboard?.overdueReceivables.count || 0) > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {dashboard?.overdueReceivables.count} títulos a receber vencidos ({formatCurrency(dashboard?.overdueReceivables.total || 0)})
              </p>
            )}
            {(dashboard?.overduePayables.count || 0) > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {dashboard?.overduePayables.count} títulos a pagar vencidos ({formatCurrency(dashboard?.overduePayables.total || 0)})
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Cards de Acesso Rápido */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financialSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className={`${section.color} text-white p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {section.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Contas Bancárias */}
      {dashboard?.bankAccounts && dashboard.bankAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Contas Bancárias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.bankAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {account.nickname || account.bankName}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {account.bankName} • {account.accountNumber}
                    </p>
                  </div>
                  {account.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                  )}
                </div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white mt-2">
                  {formatCurrency(account.currentBalance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Recebimentos */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Últimos Recebimentos
          </h3>
          {dashboard?.recentActivity.receivables.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhum recebimento recente</p>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentActivity.receivables.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.customer?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(item.totalAmount)}
                    </p>
                    <p className="text-xs text-neutral-500">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Pagamentos */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Últimos Pagamentos
          </h3>
          {dashboard?.recentActivity.payables.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhum pagamento recente</p>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentActivity.payables.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.vendor?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(item.totalAmount)}
                    </p>
                    <p className="text-xs text-neutral-500">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
