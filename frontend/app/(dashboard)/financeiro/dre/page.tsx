'use client';

import { useState } from 'react';
import { useDRE } from '@/hooks/useDRE';
import { formatCurrency } from '@/lib/format';

export default function DREPage() {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useDRE(filters);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">DRE - Demonstrativo de Resultado</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Leitura gerencial da operação</p>
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
