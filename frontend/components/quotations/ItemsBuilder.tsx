'use client';

import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ProductPicker } from './ProductPicker';
import toast from 'react-hot-toast';

interface SelectedProduct {
  id: string;
  name: string;
  sku: string;
  type: string;
  description: string;
  price: number;
  unit: string;
  category: string;
}

export function ItemsBuilder() {
  const { register, control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const items = watch('items') || [];
  const discount = watch('discount') || 0;
  const paymentMethod = watch('payment_method') || 'PIX';
  const marginPercentage = watch('margin_percentage') || 0;
  const [showPicker, setShowPicker] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});

  const triggerAiEstimation = async (index: number) => {
    const itemName = watch(`items.${index}.name`);
    const itemCategory = watch(`items.${index}.category`) || 'Geral';

    if (!itemName || !itemName.trim()) {
      toast.error('Preencha o nome do serviço para estimar o preço.');
      return;
    }

    setAiLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const response = await fetch('/api/ai/estimate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          category: itemCategory,
          description: itemName,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter sugestão da IA');
      }

      const data = await response.json();
      if (data.success) {
        setValue(`items.${index}.unit_price`, data.suggestedPrice);
        toast.success(
          `Preço sugerido: R$ ${Number(data.suggestedPrice || 0).toFixed(2)}\n${data.explanation}`,
          { duration: 6000 }
        );
      } else {
        toast.error(data.explanation || 'Não foi possível gerar estimativa.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao sugerir preço via IA.');
    } finally {
      setAiLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
  const totalWithoutFee = subtotal - discount;
  const marginAmount = subtotal * (marginPercentage / 100);

  const handleProductSelect = (product: SelectedProduct, quantity: number, type: 'SERVICO' | 'PECA') => {
    append({
      name: product.name,
      quantity: quantity,
      unit_price: product.price,
      sku: product.sku,
      product_id: product.id,
      type: type,
      category: product.category,
    });
    setShowPicker(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Itens do Orçamento</h3>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar Serviço/Peça (SKU)
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
          <p className="text-sm">Nenhum item adicionado.</p>
          <p className="text-xs mt-1">Clique em &quot;Buscar Serviço/Peça&quot; para selecionar do catálogo, ou adicione manualmente abaixo.</p>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-3 items-start p-3 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded relative">
          <div className="w-28">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Tipo</label>
            <select {...register(`items.${index}.type`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
              <option value="SERVICO">Serviço</option>
              <option value="PECA">Peça</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Serviço/Peça *</label>
            <input {...register(`items.${index}.name`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
            {items[index]?.sku && (
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 mt-0.5 block">
                SKU: {items[index].sku}
              </span>
            )}
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Qtd *</label>
            <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Preço Un. *</span>
              {items[index]?.type === 'SERVICO' && items[index]?.name && (
                <button
                  type="button"
                  onClick={() => triggerAiEstimation(index)}
                  disabled={aiLoading[index]}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-0.5"
                  title="Sugerir preço com IA"
                >
                  {aiLoading[index] ? (
                    <svg className="animate-spin h-3 w-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '✨ IA'
                  )}
                </button>
              )}
            </label>
            <input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="pt-5">
            <button type="button" onClick={() => remove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm px-2 py-1">Remover</button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: '', quantity: 1, unit_price: 0, type: 'SERVICO' })}
        className="text-sm px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 font-medium"
      >
        + Adicionar Item Manual
      </button>

      <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded space-y-4">
        {/* Seleção de Pagamento */}
        <div className="border-b border-primary-200 dark:border-primary-700 pb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Forma de Pagamento</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('payment_method', 'PIX')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentMethod === 'PIX'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:border-green-500'
              }`}
            >
              PIX
            </button>
            <button
              type="button"
              onClick={() => setValue('payment_method', 'DINHEIRO')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentMethod === 'DINHEIRO'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:border-green-500'
              }`}
            >
              Dinheiro
            </button>
            <button
              type="button"
              onClick={() => setValue('payment_method', 'CARTAO_CREDITO')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentMethod === 'CARTAO_CREDITO'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:border-purple-500'
              }`}
            >
              Cartão de Crédito
            </button>
          </div>
        </div>

        {/* Margem de Negociação */}
        <div className="border-b border-primary-200 dark:border-primary-700 pb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Margem de Negociacao (%)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('margin_percentage', { valueAsNumber: true })}
              className="w-24 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-right bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">%</span>
            {marginPercentage > 0 && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                (+ R$ {marginAmount.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Desconto */}
        <div className="flex justify-end items-center gap-2">
          <label className="text-neutral-600 dark:text-neutral-400 text-sm">Desconto: R$</label>
          <input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} className="w-24 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-right bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
        </div>

        {/* Totais */}
        <div className="space-y-2 text-right">
          <p className="text-neutral-600 dark:text-neutral-400">
            Subtotal: <span className="font-semibold">R$ {Number(subtotal || 0).toFixed(2)}</span>
          </p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Total a Vista: R$ {Number(totalWithoutFee || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {showPicker && (
        <ProductPicker
          onSelect={handleProductSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
