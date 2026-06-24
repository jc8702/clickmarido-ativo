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
  technicianPerformance: Array<{
    id: string;
    name: string;
    osCount: number;
    revenue: number;
    commission: number;
  }>;
  osMargins: Array<{
    id: string;
    number: string;
    total: number;
    materialsCost: number;
    commission: number;
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

  // Inicializar datas padrão (mês corrente)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
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
      <div className="p-8 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <div className="h-96 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen print:bg-white print:text-black">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Relatórios Financeiros</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Análise de fluxos de caixa, produtividade de técnicos, custos de peças e lucratividade.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-sm">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none dark:text-neutral-100"
              />
              <span className="text-neutral-400 text-sm">até</span>
              <input
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
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-neutral-400">Faturamento Bruto</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(data.totals.inflow)}</div>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-neutral-400">Despesas Totais</div>
                <div className="text-2xl font-bold text-red-500 dark:text-red-400 mt-2">{formatCurrency(data.totals.outflow)}</div>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-neutral-400">Lucro Líquido</div>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">{formatCurrency(data.totals.netProfit)}</div>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-neutral-400">Margem Geral</div>
                <div className="text-2xl font-bold text-orange-500 mt-2">{data.totals.profitMarginPercent}%</div>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-neutral-400">Custos de Materiais</div>
                <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-2">{formatCurrency(data.totals.materialsCost)}</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Evolution */}
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
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

              {/* Technician Performance Chart */}
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100">Desempenho e Comissão de Técnicos</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.technicianPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                      <XAxis dataKey="name" className="text-xs text-neutral-500" />
                      <YAxis className="text-xs text-neutral-500" />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="revenue" name="Faturamento Realizado" fill="#6347F9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="commission" name="Comissão Calculada" fill="#FB8500" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* OS Margins Table */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100">Rentabilidade e Margens por Ordem de Serviço</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                      <th className="py-3 px-4">Número OS</th>
                      <th className="py-3 px-4">Faturamento</th>
                      <th className="py-3 px-4">Materiais Usados</th>
                      <th className="py-3 px-4">Comissão Técnico</th>
                      <th className="py-3 px-4">Lucro Líquido</th>
                      <th className="py-3 px-4 text-right">Margem OS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.osMargins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-neutral-400">Nenhuma Ordem de Serviço concluída no período.</td>
                      </tr>
                    ) : (
                      data.osMargins.map(os => (
                        <tr key={os.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                          <td className="py-3 px-4 font-semibold text-primary-600 dark:text-primary-400">{os.number}</td>
                          <td className="py-3 px-4">{formatCurrency(os.total)}</td>
                          <td className="py-3 px-4 text-red-500">{formatCurrency(os.materialsCost)}</td>
                          <td className="py-3 px-4 text-orange-500">{formatCurrency(os.commission)}</td>
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
      </div>
    </div>
  );
}
