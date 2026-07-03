'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import { useTechnicians } from '@/hooks/useTechnicians';

export interface LeadScheduleFormProps {
  leadId: string;
  token: string;
  onSuccess: () => void;
  currentAppointment?: {
    id: string;
    scheduledAt: string;
    notes: string | null;
    technicianId: string | null;
  } | null;
}

export function LeadScheduleForm({ leadId, token, onSuccess, currentAppointment }: LeadScheduleFormProps) {
  // Formata data ISO para string compatível com input datetime-local (YYYY-MM-DDTHH:mm)
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { technicians, isLoading: loadingTechs } = useTechnicians({ active: 'true' });

  // Sincroniza estados quando o agendamento atual mudar (ex: ao abrir outro lead)
  useEffect(() => {
    if (currentAppointment) {
      setAppointmentDate(formatDateTime(currentAppointment.scheduledAt));
      setAppointmentNotes(currentAppointment.notes || '');
      setTechnicianId(currentAppointment.technicianId || '');
    } else {
      setAppointmentDate('');
      setAppointmentNotes('');
      setTechnicianId('');
    }
  }, [currentAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate) return;

    setSubmitting(true);
    try {
      const isEditing = !!currentAppointment;
      const url = `/api/leads/${leadId}/appointment`;
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        scheduledAt: appointmentDate,
        notes: appointmentNotes,
        technicianId: technicianId || null,
        ...(isEditing ? { appointmentId: currentAppointment.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEditing ? 'Agendamento comercial atualizado!' : 'Agendamento comercial criado!');
        if (!isEditing) {
          setAppointmentDate('');
          setAppointmentNotes('');
          setTechnicianId('');
        }
        onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao salvar agendamento');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data e Hora da Visita</label>
        <input 
          type="datetime-local"
          required
          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono w-full"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Técnico para Levantamento</label>
        <select 
          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 w-full"
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
          disabled={loadingTechs}
        >
          <option value="">Nenhum técnico atribuído</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.specialty || 'Geral'})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Anotações do Agendamento</label>
        <textarea 
          className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
          rows={3}
          placeholder="Pauta da reunião, endereço de visita ou observações..."
          value={appointmentNotes}
          onChange={(e) => setAppointmentNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          variant="primary" 
          size="sm"
          className="font-bold px-4"
          isLoading={submitting}
        >
          {currentAppointment ? 'Salvar Alterações' : 'Criar Compromisso'}
        </Button>
      </div>
    </form>
  );
}
