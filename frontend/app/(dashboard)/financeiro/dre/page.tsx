'use client';

import { useState, useMemo } from 'react';
import { useDRE } from '@/hooks/useDRE';
import { formatCurrency, formatDate } from '@/lib/format';

export default function DREPage() {
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; period?: string }>({});
  const { data, isLoading } = useDRE(filters);

  // Filtros do histórico de movimentações
  const [txType, setTxType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [txCategory, setTxCategory] = useState('all');

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Categorias únicas extraídas das transações
  const categories = useMemo(() => {
    if (!data?.transactions) return [];
    const set = new Set(data.transactions.map(t => t.category));
    return Array.from(set).sort();
  }, [data?.transactions]);

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter(t => {
      if (txType !== 'all' && t.type !== txType) return false;
      if (txCategory !== 'all' && t.category !== txCategory) return false;
      return true;
    });
  }, [data?.transactions, txType, txCategory]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">DRE - Demonstrativo de Resultado</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Leitura gerencial da operação</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
          />
          <span className="text-neutral-500">até</span>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Margens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Margem Bruta</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {data.margins.gross.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Margem Operacional</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {data.margins.operational.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Margem Líquida</p>
              <p className={`text-2xl font-bold ${data.margins.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.margins.net.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* DRE */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Demonstrativo do Período
            </h2>
            <div className="space-y-3">
              <DRELine label="Receita Bruta" value={data.dre.receitaBruta} />
              <DRELine label="(-) Impostos sobre Receita" value={data.dre.impostosSobreReceita} negative />
              <DRELine label="(-) Descontos" value={data.dre.descontos} negative />
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <DRELine label="= Receita Líquida" value={data.dre.receitaLiquida} bold />
              </div>
              <DRELine label="(-) Custos Produtos/Serviços" value={data.dre.custosProdutosServicos} negative />
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <DRELine label="= Lucro Bruto" value={data.dre.lucroBruto} bold />
              </div>
              <DRELine label="(-) Despesas Operacionais" value={data.dre.despesasOperacionais} negative />
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <DRELine label="= Resultado Operacional" value={data.dre.resultadoOperacional} bold />
              </div>
              <DRELine label="(-) Despesas Financeiras" value={data.dre.despesasFinanceiras} negative />
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <DRELine label="= Resultado Financeiro" value={data.dre.resultadoFinanceiro} bold />
              </div>
              <DRELine label="(-) Impostos" value={data.dre.impostos} negative />
              <div className="border-t-2 border-neutral-300 dark:border-neutral-600 pt-2">
                <DRELine label="= Lucro Líquido" value={data.dre.lucroLiquido} bold large />
              </div>
            </div>
          </div>

          {/* Comparativo */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Comparativo com Período Anterior
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Receita Anterior</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(data.comparison.previousRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Receita Atual</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(data.comparison.currentRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Crescimento</p>
                <p className={`text-lg font-semibold ${data.comparison.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.comparison.growth.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Despesas por Categoria */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Despesas por Categoria
            </h2>
            <div className="space-y-2">
              {Object.entries(data.expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{category}</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de Movimentações */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Histórico de Movimentações
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filtro por tipo */}
                <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden text-sm">
                  <button
                    onClick={() => { setTxType('all'); setTxCategory('all'); }}
                    className={`px-3 py-1.5 transition-colors ${txType === 'all' ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  >
                    Tudo
                  </button>
                  <button
                    onClick={() => { setTxType('revenue'); setTxCategory('all'); }}
                    className={`px-3 py-1.5 border-l border-neutral-300 dark:border-neutral-700 transition-colors ${txType === 'revenue' ? 'bg-green-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  >
                    Receitas
                  </button>
                  <button
                    onClick={() => { setTxType('expense'); setTxCategory('all'); }}
                    className={`px-3 py-1.5 border-l border-neutral-300 dark:border-neutral-700 transition-colors ${txType === 'expense' ? 'bg-red-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  >
                    Despesas
                  </button>
                </div>
                {/* Filtro por categoria */}
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
                >
                  <option value="all">Todas categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Descrição</th>
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="text-neutral-900 dark:text-neutral-300">
                      <td className="py-3">{formatDate(t.date)}</td>
                      <td className="py-3">{t.description}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${t.type === 'revenue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-medium ${t.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-500">
                        Nenhuma movimentação encontrada neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Resumo filtrado */}
            {filteredTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-sm">
                <span className="text-neutral-500">{filteredTransactions.length} movimentação(ões)</span>
                <span className={`font-semibold ${filteredTransactions.reduce((s, t) => s + t.amount, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {formatCurrency(filteredTransactions.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DRELine({ label, value, negative, bold, large }: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''} ${large ? 'text-lg' : ''}`}>
      <span className={`${bold ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
        {label}
      </span>
      <span className={`${negative ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
