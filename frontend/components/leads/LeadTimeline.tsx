'use client';

import React from 'react';
import { History } from 'lucide-react';

interface LeadEvent {
  id: string;
  type: string;
  oldValue?: string | null;
  newValue?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: {
    name: string;
  } | null;
}

interface LeadTimelineProps {
  events: LeadEvent[];
}

const getEventBadge = (type: string) => {
  switch (type) {
    case 'LEAD_CREATED':
      return { label: 'Entrada', color: 'bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300' };
    case 'LEAD_QUALIFIED':
      return { label: 'Qualificação', color: 'bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300' };
    case 'STAGE_CHANGED':
      return { label: 'Movimentação', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' };
    case 'FOLLOWUP_LOGGED':
      return { label: 'Follow-up', color: 'bg-warning-100 text-warning-800 dark:bg-warning-950/40 dark:text-warning-300' };
    case 'APPOINTMENT_SCHEDULED':
      return { label: 'Agendado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' };
    case 'DEAL_LOST':
    case 'LEAD_DISQUALIFIED':
      return { label: 'Descarte', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' };
    default:
      return { label: 'Histórico', color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300' };
  }
};

export function LeadTimeline({ events }: LeadTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center">
        <History className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
        <p className="text-xs text-neutral-400">Nenhum evento registrado no histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pr-1">
      <div className="relative border-l-2 border-neutral-100 dark:border-neutral-800 pl-4 ml-2 space-y-5">
        {events.map((evt) => {
          const badge = getEventBadge(evt.type);
          return (
            <div key={evt.id} className="relative">
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-400 dark:bg-neutral-700" />
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(evt.createdAt).toLocaleDateString('pt-BR')} às {new Date(evt.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {evt.notes && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {evt.notes}
                  </p>
                )}

                {evt.user && (
                  <span className="text-[10px] text-neutral-400 block">
                    Autor: {evt.user.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
