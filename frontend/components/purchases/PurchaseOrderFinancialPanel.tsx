import React from 'react';
import Link from 'next/link';

type Props = {
  subtotal: number;
  discountAmount: number;
  freightAmount: number;
  taxAmount: number;
  totalAmount: number;
  expenseId?: string | null;
  expense?: {
    id: string;
    category: string;
    amount: number;
    status: string;
  } | null;
};

export function PurchaseOrderFinancialPanel({
  subtotal,
  discountAmount,
  freightAmount,
  taxAmount,
  totalAmount,
  expenseId,
  expense,
}: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700 space-y-4">
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-3">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase">Resumo Financeiro</h4>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
          <span>Subtotal dos Itens:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-red-600 dark:text-red-400">
          <span>(-) Descontos:</span>
          <span>{formatCurrency(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
          <span>(+) Frete:</span>
          <span>{formatCurrency(freightAmount)}</span>
        </div>
        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
          <span>(+) Impostos:</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-700 pt-2">
          <span>Valor Total OC:</span>
          <span className="text-primary-600 dark:text-primary-400">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Vínculo Financeiro */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 space-y-2">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase block">Integração Financeira</span>
        {expenseId && expense ? (
          <div className="bg-neutral-50 dark:bg-neutral-700/30 p-3 rounded border border-neutral-200 dark:border-neutral-700/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Despesa Vinculada:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Valor da Despesa:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Status Financeiro:</span>
              <span className={`font-semibold ${
                expense.status === 'pago' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : expense.status === 'cancelada'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {expense.status.toUpperCase()}
              </span>
            </div>
            <div className="pt-2 text-center border-t border-neutral-200 dark:border-neutral-700/40">
              <Link 
                href={`/expenses?id=${expenseId}`} 
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Ver Despesa no Financeiro ➔
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-700/30 text-xs text-neutral-500 dark:text-neutral-400 rounded text-center">
            A despesa correspondente será gerada automaticamente no módulo Financeiro assim que esta ordem de compra for <strong className="text-neutral-700 dark:text-neutral-300">Aprovada</strong>.
          </div>
        )}
      </div>
    </div>
  );
}
