'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/Badge';
import { ProposalCard } from './ProposalCard';

interface Customer {
  id: string;
  name: string;
}

export interface Quotation {
  id: string;
  number?: string | null;
  customerId: string;
  total: number;
  status: string;
  temperature?: string;
  createdAt: string;
  customer?: Customer;
}

interface KanbanBoardProps {
  quotations: Quotation[];
  onUpdateStatus?: (id: string, newStatus: string) => void;
}

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  rascunho: 'neutral',
  pendente: 'warning',
  enviado: 'primary',
  aceito: 'success',
  rejeitado: 'danger',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Novo',
  pendente: 'Em Análise',
  enviado: 'Em Negociação',
  aceito: 'Ganho',
  rejeitado: 'Perdido',
};

const columns = ['rascunho', 'pendente', 'enviado', 'aceito', 'rejeitado'];

export function KanbanBoard({ quotations, onUpdateStatus }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const getQuotationsByStatus = (status: string) =>
    quotations.filter((q) => q.status === status);

  const handleDragStart = (e: React.DragEvent, quotationId: string) => {
    e.dataTransfer.setData('text/plain', quotationId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(quotationId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const quotationId = e.dataTransfer.getData('text/plain');
    if (quotationId && targetStatus && onUpdateStatus) {
      onUpdateStatus(quotationId, targetStatus);
    }
    setDraggedId(null);
    setDragOverStatus(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start w-full overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = getQuotationsByStatus(status);
        const isDragOver = dragOverStatus === status;

        return (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            className={`bg-neutral-100/60 dark:bg-neutral-800/60 p-4 rounded-2xl border transition-colors duration-200 min-h-[400px] flex-shrink-0 min-w-[220px] ${
              isDragOver
                ? 'border-primary-400 dark:border-primary-500 bg-primary-50/40 dark:bg-primary-900/20'
                : 'border-neutral-200/40 dark:border-neutral-700/40'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm tracking-wide uppercase">
                {statusLabels[status] || status}
              </h3>
              <Badge variant={statusColors[status] || 'neutral'} size="sm">
                {items.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {items.map((quotation) => (
                <ProposalCard
                  key={quotation.id}
                  quotation={quotation}
                  isDragged={draggedId === quotation.id}
                  onDragStart={(e) => handleDragStart(e, quotation.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs border border-dashed border-neutral-300/60 dark:border-neutral-600/60 rounded-xl">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
