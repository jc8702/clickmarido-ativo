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

interface CreateServiceOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateServiceOrderForm({ onSuccess, onCancel }: CreateServiceOrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    amount: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
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
      setError('Por favor, descreva o serviço.');
      return;
    }
    if (!formData.amount || Number(formData.amount) < 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/service-orders', {
        customerId: formData.customerId,
        description: formData.description,
        amount: Number(formData.amount),
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        notes: formData.notes,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro ao criar OS:', err);
      setError(err.response?.data?.error || 'Erro ao agendar ordem de serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in text-neutral-800">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-150">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Cliente
        </label>
        {loadingCustomers ? (
          <div className="h-10 bg-neutral-100 animate-pulse rounded-lg" />
        ) : customers.length === 0 ? (
          <div className="text-sm text-neutral-500 py-2">
            Nenhum cliente cadastrado. Crie um cliente antes de agendar uma OS.
          </div>
        ) : (
          <select
            className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 shadow-sm"
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
        label="Descrição do Serviço"
        type="text"
        placeholder="Ex: Instalação de chuveiro elétrico"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Valor Cobrado (R$)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
          required
        />

        <Input
          label="Data Agendada"
          type="date"
          value={formData.scheduled_date}
          onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Observações / Notas
        </label>
        <textarea
          className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 shadow-sm placeholder:text-neutral-400"
          rows={3}
          placeholder="Instruções específicas para o serviço..."
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" isLoading={loading} disabled={customers.length === 0}>
          Agendar OS
        </Button>
      </div>
    </form>
  );
}

export default CreateServiceOrderForm;
