'use client';

import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

export function ItemsBuilder() {
  const { register, control, watch, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const items = watch('items') || [];
  const discount = watch('discount') || 0;
  
  const subtotal = items.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  const total = subtotal - discount;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2">Itens do Orçamento</h3>
      
      {errors.items?.message && <p className="text-red-500 dark:text-red-400 text-xs mb-2">{errors.items.message as string}</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start p-4 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded relative">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Descrição do Serviço *</label>
            <input {...register(`items.${index}.name`)} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
            {/* @ts-ignore */}
            {errors.items?.[index]?.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.items[index].name.message}</p>}
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Qtd *</label>
            <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Preço Un. *</label>
            <input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="pt-6">
            <button type="button" onClick={() => remove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">Remover</button>
          </div>
        </div>
      ))}

      <button 
        type="button" 
        onClick={() => append({ name: '', quantity: 1, unit_price: 0 })}
        className="text-sm px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 font-medium"
      >
        + Adicionar Item
      </button>

      <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded text-right space-y-2">
        <p className="text-neutral-600 dark:text-neutral-400">Subtotal: <span className="font-semibold">R$ {subtotal.toFixed(2)}</span></p>
        <div className="flex justify-end items-center gap-2">
          <label className="text-neutral-600 dark:text-neutral-400 text-sm">Desconto: R$</label>
          <input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} className="w-24 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-right bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" />
        </div>
        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Total: R$ {total.toFixed(2)}</p>
      </div>
    </div>
  );
}
