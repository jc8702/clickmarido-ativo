'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import api from '../lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface CreatePaymentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePaymentForm({ onSuccess, onCancel }: CreatePaymentFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    amount: '',
    status: 'aprovado', // Padrão: Pago (aprovado)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers?limit=100');
        const data = res.data?.data || res.data || [];
        setCustomers(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, customerId: data[0].id }));
        }
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        setError('Erro ao carregar lista de clientes.');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Por favor, selecione um cliente.');
      return;
    }
    if (!formData.description) {
      setError('Por favor, insira uma descrição.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Por favor, insira um valor maior que zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/payments', {
        customerId: formData.customerId,
        description: formData.description,
        amount: Number(formData.amount),
        status: formData.status,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      setError(err.response?.data?.error || 'Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in text-neutral-800 dark:text-neutral-200">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-150 dark:border-red-800">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Cliente
        </label>
        {loadingCustomers ? (
          <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-lg" />
        ) : customers.length === 0 ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400 py-2">
            Nenhum cliente cadastrado. Crie um cliente antes de lançar recebimentos.
          </div>
        ) : (
          <select
            className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
            value={formData.customerId}
            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        )}
      </div>

      <Input
        label="Descrição do Recebimento"
        type="text"
        placeholder="Ex: Pagamento de instalação elétrica"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Valor Recebido (R$)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
          required
        />

        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            Status do Pagamento
          </label>
          <select
            className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="aprovado">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-700">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" isLoading={loading} disabled={customers.length === 0}>
          Registrar Lançamento
        </Button>
      </div>
    </form>
  );
}

export default CreatePaymentForm;
