'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { CardShimmer } from '@/components/Shimmer';
import { getCategoryLabel, getCostCenterLabel } from '@/lib/finance-options';
import { formatCurrency } from '@/lib/format';

interface FinancialData {
  balance: {
    current: number;
    projected: number;
    forecast30: number;
    forecast60: number;
    forecast90: number;
  };
  today: {
    inflow: number;
    outflow: number;
  };
  receivable: {
    overdue: number;
    pending: number;
    total: number;
  };
  payable: {
    overdue: number;
    pending: number;
    total: number;
  };
  counts: {
    totalInvoices: number;
    confirmedPayments: number;
    todayPayments: number;
    todayExpenses: number;
  };
  recentActivity: {
    payments: Array<{
      id: string;
      amount: number;
      paidAt: string;
      method: string;
      customer?: { name: string };
    }>;
    expenses: Array<{
      id: string;
      amount: number;
      paidAt: string;
      category: string;
      description: string;
    }>;
  };
  distribution: {
    byCategory: Array<{ category: string; amount: number }>;
    byCostCenter: Array<{ costCenter: string; amount: number }>;
  };
}

export default function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const fetchingRef = useRef(false);

  const fetchFinancialData = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/financial/dashboard');
      setData(res.data);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar dados financeiros.';
      setError(msg);
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchFinancialData();

    let debounceTimer: NodeJS.Timeout;

    const handleFocus = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchFinancialData, 300);
    };

    window.addEventListener('focus', handleFocus);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchFinancialData, 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getBalanceColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-neutral-600 dark:text-neutral-400';
  };

  const getBalanceIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '—';
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">
              Painel Financeiro
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Controle integrado de receitas, despesas e fluxo de caixa
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                Atualizado às {lastUpdated}
              </span>
            )}
            <Button 
              onClick={fetchFinancialData} 
              variant="outline" 
              size="sm" 
              disabled={loading} 
              isLoading={loading}
              aria-label="Recarregar dados financeiros"
            >
              Recarregar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <CardShimmer />
              <CardShimmer />
              <CardShimmer />
              <CardShimmer />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardShimmer />
              <CardShimmer />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardShimmer />
              <CardShimmer />
            </div>
          </div>
        ) : error ? (
          <Card className="border border-red-200 dark:border-red-800">
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Verifique sua conexão e tente novamente
                </p>
              </div>
              <Button onClick={fetchFinancialData} variant="outline" size="sm">
                Tentar Novamente
              </Button>
            </div>
          </Card>
        ) : !data ? (
          <Card>
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Nenhum dado financeiro disponível
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Registre pagamentos e despesas para visualizar o painel
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Saldo Consolidado */}
              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">
                    Saldo Consolidado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl sm:text-3xl font-black ${getBalanceColor(data.balance?.current ?? 0)}`}>
                    {formatCurrency(data.balance?.current ?? 0)}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Receitas confirmadas - Despesas pagas
                  </p>
                  {(data.balance?.projected ?? 0) !== (data.balance?.current ?? 0) && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Projetado</span>
                        <span className={`text-sm font-bold ${getBalanceColor(data.balance?.projected ?? 0)}`}>
                          {getBalanceIcon(data.balance?.projected ?? 0)} {formatCurrency(data.balance?.projected ?? 0)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Considerando despesas pendentes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Previsão 30 Dias */}
              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">
                    Previsão 30 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl sm:text-3xl font-black ${getBalanceColor(data.balance?.forecast30 ?? 0)}`}>
                    {formatCurrency(data.balance?.forecast30 ?? 0)}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Fluxo projetado com base em vencimentos
                  </p>
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">A receber (30d)</span>
                      <span className="font-semibold text-emerald-600">
                        +{formatCurrency(data.receivable?.pending ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">A pagar</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(data.payable?.pending ?? 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fluxo Hoje */}
              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">
                    Fluxo de Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Entradas</span>
                      <span className="text-lg font-bold text-emerald-600">
                        +{formatCurrency(data.today?.inflow ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Saídas</span>
                      <span className="text-lg font-bold text-rose-600">
                        -{formatCurrency(data.today?.outflow ?? 0)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Saldo do dia</span>
                        <span className={`text-sm font-bold ${getBalanceColor((data.today?.inflow ?? 0) - (data.today?.outflow ?? 0))}`}>
                          {formatCurrency((data.today?.inflow ?? 0) - (data.today?.outflow ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contadores */}
              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Faturas</span>
                      <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                        {data.counts?.totalInvoices ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Pagamentos</span>
                      <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                        {data.counts?.confirmedPayments ?? 0}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700">
                      {data.receivable?.overdue > 0 && (
                        <div className="flex items-center gap-2 text-xs text-rose-600">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          {data.receivable.overdue} fatura(s) vencida(s)
                        </div>
                      )}
                      {data.payable?.overdue > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 mt-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          {data.payable.overdue} despesa(s) vencida(s)
                        </div>
                      )}
                      {(!data.receivable?.overdue && !data.payable?.overdue) && (
                        <span className="text-xs text-emerald-600">✓ Sem pendências vencidas</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Listas e Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Últimos Recebimentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {data.recentActivity?.payments?.length > 0 ? (
                    data.recentActivity.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                            {p.customer?.name || 'Cliente'}
                          </p>
                          <p className="text-xs text-neutral-500 font-medium">
                            {p.method?.toUpperCase()} • {new Date(p.paidAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-extrabold text-emerald-600 text-sm ml-3 whitespace-nowrap">
                          +{formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-neutral-400">Nenhum recebimento recente</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Últimas Despesas Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {data.recentActivity?.expenses?.length > 0 ? (
                    data.recentActivity.expenses.map((e) => (
                      <div key={e.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                            {e.description}
                          </p>
                          <p className="text-xs text-neutral-500 font-medium">
                            {getCategoryLabel(e.category)} • {new Date(e.paidAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-extrabold text-rose-600 text-sm ml-3 whitespace-nowrap">
                          -{formatCurrency(e.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-neutral-400">Nenhuma despesa recente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Distribuição e DRE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Despesas por Categoria (DRE)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {data.distribution?.byCategory?.length > 0 ? (
                    data.distribution.byCategory.map((c) => (
                      <div key={c.category} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                          {getCategoryLabel(c.category)}
                        </span>
                        <span className="font-extrabold text-rose-600 text-sm">
                          -{formatCurrency(c.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-neutral-400">Nenhuma despesa registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Despesas por Centro de Custo (DRE)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {data.distribution?.byCostCenter?.length > 0 ? (
                    data.distribution.byCostCenter.map((cc) => (
                      <div key={cc.costCenter} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                          {getCostCenterLabel(cc.costCenter)}
                        </span>
                        <span className="font-extrabold text-rose-600 text-sm">
                          -{formatCurrency(cc.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-neutral-400">Nenhuma despesa registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
