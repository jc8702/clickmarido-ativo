'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import { useTechnicians } from '@/hooks/useTechnicians';
import { Trash2, Edit3, Plus, Calendar, User, Clock, FileText } from 'lucide-react';

export interface LeadScheduleFormProps {
  leadId: string;
  token: string;
  onSuccess: () => void;
  currentAppointment?: {
    id: string;
    scheduledAt: string;
    notes: string | null;
    technicianId: string | null;
    googleEventId?: string | null;
  } | null;
  allAppointments?: any[];
}

export function LeadScheduleForm({ leadId, token, onSuccess, currentAppointment, allAppointments = [] }: LeadScheduleFormProps) {
  // Formata data ISO para string compatível com input datetime-local (YYYY-MM-DDTHH:mm)
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isNewMode, setIsNewMode] = useState<boolean>(true);
  const [submitType, setSubmitType] = useState<'PUT' | 'POST'>('POST');
  
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { technicians, isLoading: loadingTechs } = useTechnicians({ active: 'true' });

  // Sincroniza estados quando o agendamento atual mudar (ex: ao abrir outro lead)
  useEffect(() => {
    if (currentAppointment) {
      setSelectedAppointment(currentAppointment);
      setIsNewMode(false);
      setAppointmentDate(formatDateTime(currentAppointment.scheduledAt));
      setAppointmentNotes(currentAppointment.notes || '');
      setTechnicianId(currentAppointment.technicianId || '');
    } else {
      setSelectedAppointment(null);
      setIsNewMode(true);
      setAppointmentDate('');
      setAppointmentNotes('');
      setTechnicianId('');
    }
  }, [currentAppointment]);

  const handleSelectAppointmentForEdit = (appt: any) => {
    setSelectedAppointment(appt);
    setIsNewMode(false);
    setAppointmentDate(formatDateTime(appt.scheduledAt));
    setAppointmentNotes(appt.notes || '');
    setTechnicianId(appt.technicianId || '');
    toast.success('Agendamento carregado para edição!');
  };

  const handleSetNewMode = () => {
    setSelectedAppointment(null);
    setIsNewMode(true);
    setAppointmentDate('');
    setAppointmentNotes('');
    setTechnicianId('');
  };

  const handleDateChange = (val: string) => {
    setAppointmentDate(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate) return;

    setSubmitting(true);
    try {
      const isEditing = submitType === 'PUT' && !!selectedAppointment;
      const url = `/api/leads/${leadId}/appointment`;
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        scheduledAt: appointmentDate,
        notes: appointmentNotes,
        technicianId: technicianId || null,
        ...(isEditing ? { appointmentId: selectedAppointment.id } : {}),
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
        handleSetNewMode();
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

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar e excluir permanentemente este agendamento?')) return;
    
    setDeletingId(apptId);
    try {
      const res = await fetch(`/api/leads/${leadId}/appointment?appointmentId=${apptId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success('Agendamento comercial cancelado!');
        if (selectedAppointment?.id === apptId) {
          handleSetNewMode();
        }
        onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao cancelar agendamento');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao cancelar agendamento.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Agendamento */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-50/50 dark:bg-neutral-950/20 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/30">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {selectedAppointment ? 'Editar Compromisso Selecionado' : 'Agendar Novo Compromisso'}
          </h4>
          {selectedAppointment && (
            <button
              type="button"
              onClick={handleSetNewMode}
              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Limpar / Novo
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data e Hora da Visita</label>
          <input 
            type="datetime-local"
            required
            className="p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500 font-mono w-full"
            value={appointmentDate}
            onChange={(e) => handleDateChange(e.target.value)}
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

        <div className="flex flex-wrap gap-2 justify-end">
          {selectedAppointment ? (
            <>
              <Button 
                type="submit" 
                variant="outline" 
                size="sm"
                className="font-bold px-3 border-neutral-300 text-neutral-700 dark:text-neutral-300 dark:border-neutral-700"
                onClick={() => setSubmitType('POST')}
                isLoading={submitting && submitType === 'POST'}
              >
                Salvar como Novo
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                size="sm"
                className="font-bold px-3"
                onClick={() => setSubmitType('PUT')}
                isLoading={submitting && submitType === 'PUT'}
              >
                Remarcar Compromisso
              </Button>
            </>
          ) : (
            <Button 
              type="submit" 
              variant="primary" 
              size="sm"
              className="font-bold px-4 shadow"
              onClick={() => setSubmitType('POST')}
              isLoading={submitting && submitType === 'POST'}
            >
              Criar Compromisso
            </Button>
          )}
        </div>
      </form>

      {/* Lista de Agendamentos Ativos */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Compromissos Agendados ({allAppointments.length})
        </h4>

        {allAppointments.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">Nenhum agendamento registrado para este lead.</p>
        ) : (
          <div className="space-y-2">
            {allAppointments.map((appt) => {
              const apptDate = new Date(appt.scheduledAt);
              const formattedDate = apptDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const formattedTime = apptDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div 
                  key={appt.id} 
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all ${
                    selectedAppointment?.id === appt.id 
                      ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      <span className="capitalize">{formattedDate} às {formattedTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelectAppointmentForEdit(appt)}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
                        title="Editar Agendamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        disabled={deletingId === appt.id}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                        title="Cancelar Agendamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span>Técnico: {appt.technician?.name || 'Nenhum técnico atribuído'}</span>
                    </div>
                    {appt.notes && (
                      <div className="flex items-start gap-1 mt-1 bg-neutral-50 dark:bg-neutral-950/40 p-2 rounded border border-neutral-100 dark:border-neutral-800/50">
                        <FileText className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="italic break-words">{appt.notes}</span>
                      </div>
                    )}
                    {appt.googleEventId && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 dark:text-green-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Sincronizado com Google Agenda
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
