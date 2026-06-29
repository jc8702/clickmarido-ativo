'use client';

import React from 'react';
import Button from '@/components/Button';
import { XCircle } from 'lucide-react';

interface LeadLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
}

const LOSS_REASONS = [
  { value: 'SEM_ORCAMENTO', label: 'Sem orçamento' },
  { value: 'SEM_TIMING', label: 'Sem timing' },
  { value: 'SEM_NECESSIDADE', label: 'Sem necessidade' },
  { value: 'SEM_AUTORIDADE', label: 'Sem autoridade' },
  { value: 'FORA_DE_PERFIL', label: 'Fora de perfil' },
  { value: 'CONCORRENCIA', label: 'Concorrência' },
  { value: 'RETORNO_FUTURO', label: 'Retorno futuro' },
  { value: 'CONTATO_INVALIDO', label: 'Contato inválido' },
];

export function LeadLossModal({ isOpen, onClose, onConfirm }: LeadLossModalProps) {
  const [lossReason, setLossReason] = React.useState('SEM_ORCAMENTO');
  const [lossNotes, setLossNotes] = React.useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(lossReason, lossNotes);
    setLossNotes('');
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scale-in">
        <h3 className="font-extrabold text-md text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          Justificar Descarte do Lead
        </h3>
        
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Motivo do Descarte</label>
            <select 
              className="w-full p-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
            >
              {LOSS_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Observações Detalhadas</label>
            <textarea 
              required
              className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="Justifique o descarte ou motivo da desqualificação..."
              value={lossNotes}
              onChange={(e) => setLossNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            className="font-bold"
            onClick={handleConfirm}
          >
            Confirmar Descarte
          </Button>
        </div>
      </div>
    </div>
  );
}
