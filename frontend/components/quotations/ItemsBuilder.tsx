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
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Itens do Orçamento</h3>
      
      {errors.items?.message && <p className="text-red-500 text-xs mb-2">{errors.items.message as string}</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start p-4 bg-gray-50 border rounded relative">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700">Descrição do Serviço *</label>
            <input {...register(`items.${index}.name`)} className="mt-1 block w-full p-2 border rounded text-sm" />
            {/* @ts-ignore */}
            {errors.items?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.items[index].name.message}</p>}
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-700">Qtd *</label>
            <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded text-sm" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-700">Preço Un. *</label>
            <input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded text-sm" />
          </div>
          <div className="pt-6">
            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 text-sm">Remover</button>
          </div>
        </div>
      ))}

      <button 
        type="button" 
        onClick={() => append({ name: '', quantity: 1, unit_price: 0 })}
        className="text-sm px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium"
      >
        + Adicionar Item
      </button>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded text-right space-y-2">
        <p className="text-gray-600">Subtotal: <span className="font-semibold">R$ {subtotal.toFixed(2)}</span></p>
        <div className="flex justify-end items-center gap-2">
          <label className="text-gray-600 text-sm">Desconto: R$</label>
          <input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} className="w-24 p-1 border rounded text-right" />
        </div>
        <p className="text-xl font-bold text-gray-900">Total: R$ {total.toFixed(2)}</p>
      </div>
    </div>
  );
}
