'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

interface LeadFollowupFormProps {
  leadId: string;
  token: string;
  onSuccess: () => void;
}

export function LeadFollowupForm({ leadId, token, onSuccess }: LeadFollowupFormProps) {
  const [followupText, setFollowupText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: followupText }),
      });

      if (res.ok) {
        toast.success('Interação registrada!');
        setFollowupText('');
        onSuccess();
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea 
        required
        className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-primary-500"
        rows={4}
        placeholder="Escreva detalhes da ligação, conversa ou mensagem trocada com o lead..."
        value={followupText}
        onChange={(e) => setFollowupText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          variant="primary" 
          size="sm"
          className="font-bold px-4"
          isLoading={submitting}
        >
          Registrar Interação
        </Button>
      </div>
    </form>
  );
}
