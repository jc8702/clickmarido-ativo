'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import api from '@/lib/api';

interface Customer {
  id: string;
  name: string;
}

export function CustomerPicker() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const customerId = watch('customer_id');

  useEffect(() => {
    api.get('/customers')
      .then(res => {
        const data = res.data?.data || res.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Erro ao buscar clientes:', err))
      .finally(() => setLoading(false));
  }, []);

  // If we have a customer_id but customers just loaded, ensure the value is set
  useEffect(() => {
    if (!loading && customers.length > 0 && customerId) {
      const exists = customers.some(c => c.id === customerId);
      if (exists) {
        setValue('customer_id', customerId, { shouldValidate: true });
      }
    }
  }, [loading, customers, customerId, setValue]);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Selecione o Cliente *</label>
      <select
        {...register('customer_id')}
        disabled={loading}
        className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
      >
        <option value="">{loading ? 'Carregando clientes...' : 'Selecione...'}</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {errors.customer_id && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.customer_id.message as string}</p>}
    </div>
  );
}
