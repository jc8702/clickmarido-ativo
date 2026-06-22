'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useServiceOrder, useStartServiceOrder, useCompleteServiceOrder } from '@/hooks/useServiceOrders';
import { useAuth } from '@/hooks/useAuth';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  agendada: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Agendada' },
  em_execucao: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Em Execução' },
  concluida: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Concluída' },
  cancelada: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Cancelada' },
};

export default function ServiceOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { getToken } = useAuth();
  const { data: os, isLoading, mutate } = useServiceOrder(id as string);
  const { mutateAsync: startOrder, isPending: starting } = useStartServiceOrder();
  const { mutateAsync: completeOrder, isPending: completing } = useCompleteServiceOrder();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goBack = useCallback(() => {
    router.push('/service-orders');
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  if (isLoading) {
    return (
      <div className="p-8 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Carregando Detalhes da OS...</div>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="p-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button onClick={goBack} className="text-blue-600 dark:text-blue-400 hover:underline mb-4">&larr; Voltar</button>
          <div className="text-center py-12 text-red-500 dark:text-red-400">OS não encontrada.</div>
        </div>
      </div>
    );
  }

  const handleStart = async () => {
    try {
      await startOrder(os.id);
      await mutate();
      alert('Técnico Iniciou o Serviço!');
    } catch (err: any) {
      alert('Erro ao iniciar: ' + err.message);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOrder(os.id);
      await mutate();
      alert('Serviço Concluído com Sucesso!');
    } catch (err: any) {
      alert('Erro ao concluir: ' + err.message);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceOrderId', os.id);
      formData.append('type', 'antes');

      const token = getToken();
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao enviar foto');
      }
      await mutate();
      alert('Foto enviada com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const customerName = os.customer?.name || 'Cliente não informado';
  const techName = os.technician?.name || 'Não atribuído';
  const status = statusConfig[os.status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: os.status };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="mb-4">
        <button onClick={goBack} className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar para Ordens de Serviço</button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{os.number}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Orçamento Ref: <Link href={`/quotations?id=${os.quotationId}`} className="text-blue-600 dark:text-blue-400 hover:underline">{os.quotationId?.slice(0, 8)}</Link>
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${status.bg} ${status.text}`}>
          {status.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Dados do Serviço</h3>
          <div className="space-y-3 text-sm">
            <p><span className="text-neutral-500 dark:text-neutral-400">Cliente:</span> <span className="text-neutral-900 dark:text-neutral-100 font-medium">{customerName}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Endereço:</span> <span className="text-neutral-900 dark:text-neutral-100">{os.address || 'Não informado'}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Data Agendada:</span> <span className="text-neutral-900 dark:text-neutral-100">{os.scheduledTime ? new Date(os.scheduledTime).toLocaleString('pt-BR') : 'Não agendado'}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Técnico:</span> <span className="text-neutral-900 dark:text-neutral-100">{techName}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Valor Total:</span> <span className="text-neutral-900 dark:text-neutral-100 font-bold">R$ {(os.finalTotal || 0).toFixed(2)}</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Timeline</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-600 before:to-transparent">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Criada</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.createdAt).toLocaleString('pt-BR')}</div>
              </div>
            </div>

            {os.startedAt && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Início</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.startedAt).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            )}

            {os.completedAt && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Concluído</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.completedAt).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Fotos do Serviço</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Enviar Foto'}
        </button>
        {os.photos && os.photos.length > 0 ? (
          <div className="mt-4 flex gap-4 flex-wrap">
            {os.photos.map((photo: any) => (
              <img key={photo.id} src={photo.url} alt={photo.fileName} className="w-24 h-24 object-cover rounded border" />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Nenhuma foto enviada ainda.</p>
        )}
      </div>

      <div className="flex justify-end gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-6">
        {os.status === 'agendada' && (
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {starting ? 'Processando...' : 'Iniciar Serviço'}
          </button>
        )}

        {os.status === 'em_execucao' && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {completing ? 'Processando...' : 'Concluir Serviço'}
          </button>
        )}
      </div>
    </div>
  );
}
