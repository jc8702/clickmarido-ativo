import React from 'react';
import { TemperatureBadge } from './TemperatureBadge';
import type { Quotation } from './KanbanBoard';

interface ProposalCardProps {
  quotation: Quotation;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function ProposalCard({
  quotation,
  isDragged,
  onDragStart,
  onDragEnd,
}: ProposalCardProps) {
  const getValidityStatus = (createdAtString: string, status: string) => {
    if (status === 'aceito' || status === 'aprovado' || status === 'rejeitado') return null;
    const createdDate = new Date(createdAtString);
    const today = new Date();
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 15) {
      return {
        label: `Aberto há ${diffDays} dias`,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
      };
    } else if (diffDays > 7) {
      return {
        label: `Aberto há ${diffDays} dias`,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      };
    }
    return {
      label: diffDays === 1 ? 'Aberto hoje' : `Aberto há ${diffDays} dias`,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    };
  };

  const validity = getValidityStatus(quotation.createdAt, quotation.status);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab active:cursor-grabbing bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/70 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600 select-none flex flex-col gap-3 ${
        isDragged ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight truncate">
            {quotation.customer?.name || 'Cliente'}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
            ID: {quotation.number || quotation.id.slice(-6).toUpperCase()}
          </p>
        </div>
        
        {/* Mock temperature if missing, just for demonstration if we haven't updated the DB yet */}
        <TemperatureBadge temperature={quotation.temperature || (Math.random() > 0.6 ? 'QUENTE' : 'MORNO')} />
      </div>

      {validity && (
        <div className="flex items-center">
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase border ${validity.color}`}
          >
            {validity.label}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700">
        <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
          {new Date(quotation.createdAt).toLocaleDateString('pt-BR')}
        </span>
        <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
          R$ {Number(quotation.total || 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
