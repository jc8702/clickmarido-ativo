'use client';

import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ProductPicker } from './ProductPicker';

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
  const [showPicker, setShowPicker] = useState(false);

  const subtotal = items.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  const total = subtotal - discount;

  const handleProductSelect = (product: SelectedProduct, quantity: number) => {
    append({
      name: product.name,
      quantity: quantity,
      unit_price: product.price,
      sku: product.sku,
      product_id: product.id,
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
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Preço Un. *</label>
            <input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="pt-5">
            <button type="button" onClick={() => remove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm px-2 py-1">Remover</button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: '', quantity: 1, unit_price: 0 })}
        className="text-sm px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 font-medium"
      >
        + Adicionar Item Manual
      </button>

      <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded text-right space-y-2">
        <p className="text-neutral-600 dark:text-neutral-400">Subtotal: <span className="font-semibold">R$ {subtotal.toFixed(2)}</span></p>
        <div className="flex justify-end items-center gap-2">
          <label className="text-neutral-600 dark:text-neutral-400 text-sm">Desconto: R$</label>
          <input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} className="w-24 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-right bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
        </div>
        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Total: R$ {total.toFixed(2)}</p>
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
