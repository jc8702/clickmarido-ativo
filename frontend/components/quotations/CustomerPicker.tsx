'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';

export function CustomerPicker() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700">Selecione o Cliente *</label>
      <select {...register('customer_id')} className="mt-1 block w-full p-2 border rounded bg-white">
        <option value="">Selecione...</option>
        <option value="cust-123">João Silva</option>
        <option value="cust-456">Maria Oliveira</option>
      </select>
      {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id.message as string}</p>}
    </div>
  );
}
