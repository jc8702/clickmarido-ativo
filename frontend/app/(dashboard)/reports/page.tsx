'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface ReportData {
  totals: {
    inflow: number;
    outflow: number;
    netProfit: number;
    profitMarginPercent: number;
    materialsCost: number;
  };
  osMargins: Array<{
    id: string;
    number: string;
    total: number;
    materialsCost: number;
    netProfit: number;
    profitMarginPercent: number;
  }>;
  transactions: {
    inflows: Array<{ id: string; date: string; description: string; amount: number }>;
    outflows: Array<{ id: string; date: string; description: string; category: string; amount: number }>;
  };
}

export default function ReportsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializar datas padrão (mês corrente) — dentro do componente para atualizar corretamente
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { firstDay, lastDay };
  };

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.firstDay);
  const [endDate, setEndDate] = useState(defaults.lastDay);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }
      const response = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Erro ao carregar relatórios');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error('Dados inválidos recebidos do servidor');
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, getToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Formatar gráfico de fluxo de caixa diário (entradas e saídas agrupadas por dia)
  const getChartData = () => {
    if (!data) return [];
    const dayMap: Record<string, { date: string; inflow: number; outflow: number }> = {};

    data.transactions.inflows.forEach(inf => {
      const day = inf.date.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { date: day, inflow: 0, outflow: 0 };
      dayMap[day].inflow += inf.amount;
    });

    data.transactions.outflows.forEach(outf => {
      const day = outf.date.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { date: day, inflow: 0, outflow: 0 };
      dayMap[day].outflow += outf.amount;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleExportCSV = () => {
    const token = getToken();
    window.open(`/api/reports?export=csv&startDate=${startDate}&endDate=${endDate}&token=${token}`, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const chartData = getChartData();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Relatórios Financeiros</h1>
          <div className="h-96 bg-white dark:bg-neutral-800 rounded-2xl animate-pulse"></div>
        </main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Relatórios Financeiros</h1>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm mb-3">{error}</p>
            <button onClick={fetchReports} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-sm font-semibold rounded-xl transition-all">
              Tentar Novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 print:bg-white print:text-black">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Relatórios Financeiros</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Análise de fluxos de caixa, produtividade de técnicos, custos de peças e lucratividade.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 shadow-sm">
              <label htmlFor="report-start-date" className="sr-only">Data inicial</label>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none dark:text-neutral-100"
              />
              <span className="text-neutral-400 text-sm" aria-hidden="true">até</span>
              <label htmlFor="report-end-date" className="sr-only">Data final</label>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none dark:text-neutral-100"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-xs text-white font-semibold rounded-xl transition-all shadow-md"
            >
              Imprimir Relatório
            </button>
          </div>
        </div>

        {data && (
          <>
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <dl className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                <dt className="text-xs font-semibold text-neutral-400">Faturamento Bruto</dt>
                <dd className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(data.totals.inflow)}</dd>
              </dl>
              <dl className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                <dt className="text-xs font-semibold text-neutral-400">Despesas Totais</dt>
                <dd className="text-2xl font-bold text-red-500 dark:text-red-400 mt-2">{formatCurrency(data.totals.outflow)}</dd>
              </dl>
              <dl className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                <dt className="text-xs font-semibold text-neutral-400">Lucro Líquido</dt>
                <dd className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">{formatCurrency(data.totals.netProfit)}</dd>
              </dl>
              <dl className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                <dt className="text-xs font-semibold text-neutral-400">Margem Geral</dt>
                <dd className="text-2xl font-bold text-orange-500 mt-2">{data.totals.profitMarginPercent}%</dd>
              </dl>
              <dl className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                <dt className="text-xs font-semibold text-neutral-400">Custos de Materiais</dt>
                <dd className="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-2">{formatCurrency(data.totals.materialsCost)}</dd>
              </dl>
            </div>

            {/* Charts Grid */}
            <div className="mb-6">
              {/* Cash Flow Evolution */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100">Fluxo de Caixa Diário</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1FAA63" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#1FAA63" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                      <XAxis dataKey="date" className="text-xs text-neutral-500" />
                      <YAxis className="text-xs text-neutral-500" />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area type="monotone" dataKey="inflow" name="Entradas" stroke="#1FAA63" fillOpacity={1} fill="url(#colorInflow)" />
                      <Area type="monotone" dataKey="outflow" name="Saídas" stroke="#EF4444" fillOpacity={1} fill="url(#colorOutflow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* OS Margins Table */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100">Rentabilidade e Margens por Ordem de Serviço</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" aria-label="Rentabilidade por Ordem de Serviço">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                      <th className="py-3 px-4">Número OS</th>
                      <th className="py-3 px-4">Faturamento</th>
                      <th className="py-3 px-4">Materiais Usados</th>
                      <th className="py-3 px-4">Lucro Líquido</th>
                      <th className="py-3 px-4 text-right">Margem OS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.osMargins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-neutral-400">Nenhuma Ordem de Serviço concluída no período.</td>
                      </tr>
                    ) : (
                      data.osMargins.map(os => (
                        <tr key={os.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                          <td className="py-3 px-4 font-semibold text-primary-600 dark:text-primary-400">{os.number}</td>
                          <td className="py-3 px-4">{formatCurrency(os.total)}</td>
                          <td className="py-3 px-4 text-red-500">{formatCurrency(os.materialsCost)}</td>
                          <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatCurrency(os.netProfit)}</td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded ${os.profitMarginPercent >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'}`}>
                              {os.profitMarginPercent}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
