'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { CardShimmer } from '@/components/Shimmer';

export default function FinancialDashboard() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/financial/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Painel Financeiro</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Controle integrado de receitas, despesas e fluxo de caixa</p>
          </div>
          <Button onClick={fetchFinancialData} variant="outline" size="sm">
            Recarregar Dados
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CardShimmer />
            <CardShimmer />
            <CardShimmer />
          </div>
        ) : !data ? (
          <Card>
            <div className="text-center py-12 text-neutral-500">Erro ao carregar dados.</div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Bento Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">Saldo Consolidado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.balance?.current || 0)}
                  </div>
                  <p className="text-xs text-neutral-500">Receitas menos despesas efetuadas</p>
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">Previsão 30 Dias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                    {formatCurrency(data.balance?.forecast30 || 0)}
                  </div>
                  <p className="text-xs text-neutral-500">Fluxo projetado com base em faturas pendentes</p>
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider text-neutral-400">Hoje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 font-semibold">Entradas:</span>
                    <span className="font-extrabold text-emerald-600">+{formatCurrency(data.today?.inflow || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 font-semibold">Saídas:</span>
                    <span className="font-extrabold text-rose-600">-{formatCurrency(data.today?.outflow || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Listas e Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Últimos Recebimentos</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {data.recentActivity?.payments?.length > 0 ? (
                    data.recentActivity.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <div>
                          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{p.customer?.name}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">Método: {p.method.toUpperCase()} • {new Date(p.paidAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="font-extrabold text-emerald-600 text-sm">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs text-neutral-400">Nenhum recebimento recente</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-4">
                  <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Últimas Despesas Pagas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {data.recentActivity?.expenses?.length > 0 ? (
                    data.recentActivity.expenses.map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <div>
                          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{e.description}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">Categoria: {e.category} • {new Date(e.paidAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="font-extrabold text-rose-600 text-sm">-{formatCurrency(e.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs text-neutral-400">Nenhuma despesa recente</p>
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
