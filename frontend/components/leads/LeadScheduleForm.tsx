'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

interface LeadScheduleFormProps {
  leadId: string;
  token: string;
  onSuccess: () => void;
}

export function LeadScheduleForm({ leadId, token, onSuccess }: LeadScheduleFormProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledAt: appointmentDate,
          notes: appointmentNotes,
        }),
      });

      if (res.ok) {
        toast.success('Agendamento comercial criado!');
        setAppointmentDate('');
        setAppointmentNotes('');
        onSuccess();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data e Hora da Reunião</label>
        <input 
          type="datetime-local"
          required
          className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
        />
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
          Criar Compromisso
        </Button>
      </div>
    </form>
  );
}
