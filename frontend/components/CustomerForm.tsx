'use client';

import { useState } from 'react';
import api from '../lib/api';
import { FormBuilder } from '@/components/FormBuilder';

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [error, setError] = useState('');

  const handleSubmit = async (data: Record<string, any>) => {
    setError('');
    try {
      await api.post('/customers', {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      if (onSuccess) onSuccess();
    } catch {
      setError('Erro ao criar cliente. Verifique os dados.');
      throw new Error('Erro ao criar cliente');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-warning-50 border-l-4 border-warning-600 text-warning-900 rounded-md text-sm animate-slide-down">
          {error}
        </div>
      )}
      <FormBuilder
        title="Novo Cliente"
        fields={[
          { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo' },
          { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'email@exemplo.com' },
          { name: 'phone', label: 'Telefone', type: 'phone', placeholder: '(11) 99999-9999' },
        ]}
        onSubmit={handleSubmit}
        submitText="Salvar Cliente"
      />
      {onCancel && (
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
