'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import api from '../lib/api';

interface Technician {
  id: string;
  name: string;
  specialty?: string;
}

interface EditServiceOrderFormProps {
  so: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const formatForDatetimeLocal = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().slice(0, 16);
};

export function EditServiceOrderForm({ so, onSuccess, onCancel }: EditServiceOrderFormProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [osDetails, setOsDetails] = useState<any>(so);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [formData, setFormData] = useState({
    technicianId: so.technicianId || '',
    scheduledTime: formatForDatetimeLocal(so.scheduledTime),
    address: so.address || '',
    notes: so.notes || '',
    finalTotal: String(so.finalTotal || 0),
    status: so.status || 'agendada',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoadingTechs(true);
      try {
        const [techsRes, osRes] = await Promise.all([
          api.get('/technicians?limit=100'),
          !so.quotation?.items ? api.get(`/service-orders/${so.id}`) : Promise.resolve(null)
        ]);
        setTechnicians(techsRes.data.data || techsRes.data || []);
        if (osRes) {
          setOsDetails(osRes.data);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar lista de técnicos ou dados da OS.');
      } finally {
        setLoadingTechs(false);
      }
    };
    fetchData();
  }, [so]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/service-orders/${so.id}`, {
        technicianId: formData.technicianId || null,
        scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : null,
        address: formData.address,
        notes: formData.notes,
        finalTotal: Number(formData.finalTotal),
        status: formData.status,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro ao editar OS:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar ordem de serviço.');
    } finally {
      setLoading(false);
    }
  };

  const serviceCategory = osDetails?.quotation?.items?.[0]?.product?.category || '';

  const sortedTechnicians = [...technicians].sort((a, b) => {
    if (!serviceCategory) return 0;
    const aMatch = a.specialty?.toLowerCase().includes(serviceCategory.toLowerCase());
    const bMatch = b.specialty?.toLowerCase().includes(serviceCategory.toLowerCase());
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in text-neutral-800 dark:text-neutral-200">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-150 dark:border-red-800">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            Técnico Responsável {serviceCategory && `(Categoria OS: ${serviceCategory})`}
          </label>
          {loadingTechs ? (
            <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-lg" />
          ) : (
            <select
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
              value={formData.technicianId}
              onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
            >
              <option value="">Nenhum técnico atribuído</option>
              {sortedTechnicians.map(t => {
                const isMatch = serviceCategory && t.specialty?.toLowerCase().includes(serviceCategory.toLowerCase());
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty || 'Geral'}){isMatch ? ' ⭐ (Recomendado para esta OS)' : ''}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            Status da OS
          </label>
          <select
            className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="agendada">Agendada</option>
            <option value="em_execucao">Em Execução</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Data e Hora Agendada"
          type="datetime-local"
          value={formData.scheduledTime}
          onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
        />

        <Input
          label="Valor Final / Cobrado (R$)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.finalTotal}
          onChange={e => setFormData({ ...formData, finalTotal: e.target.value })}
          required
        />
      </div>

      <Input
        label="Endereço de Atendimento"
        type="text"
        placeholder="Rua, Número, Bairro, Cidade - UF"
        value={formData.address}
        onChange={e => setFormData({ ...formData, address: e.target.value })}
        required
      />

      <div>
        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Notas e Relato do Técnico / Observações
        </label>
        <textarea
          className="w-full px-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
          rows={4}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Anotações sobre a execução da ordem de serviço..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} type="button" disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={loading}>
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}

export default EditServiceOrderForm;
