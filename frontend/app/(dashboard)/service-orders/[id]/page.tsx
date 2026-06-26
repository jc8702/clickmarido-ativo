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
  const [mediaList, setMediaList] = useState<any[]>([]);

  const goBack = useCallback(() => {
    router.push('/service-orders');
  }, [router]);

  const fetchMedia = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`/api/media?serviceOrderId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setMediaList(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  }, [id, getToken]);

  useEffect(() => {
    if (id) {
      fetchMedia();
    }
  }, [id, fetchMedia]);

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
      formData.append('caption', 'Evidência fotográfica do serviço');

      const token = getToken();
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao enviar foto');
      }
      await mutate();
      await fetchMedia();
      alert('Foto enviada com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Checklist do Serviço
  const defaultChecklist = [
    { id: 1, label: 'Inspeção Inicial do Local', checked: false },
    { id: 2, label: 'Materiais e Ferramentas Conferidos', checked: false },
    { id: 3, label: 'Execução Técnica das Atividades', checked: false },
    { id: 4, label: 'Limpeza e Organização Pós-Serviço', checked: false }
  ];

  const checklist = (os.automationLog as any)?.checklist || defaultChecklist;

  const handleToggleChecklist = async (itemId: number) => {
    try {
      const updatedChecklist = checklist.map((item: any) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      const token = getToken();
      const response = await fetch(`/api/service-orders/${os.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          automationLog: {
            ...((os.automationLog as any) || {}),
            checklist: updatedChecklist,
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Erro ao salvar checklist');
      }
      await mutate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const customerName = os.customer?.name || 'Cliente não informado';
  const techName = os.technician?.name || 'Não atribuído';
  const status = statusConfig[os.status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: os.status };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <button onClick={goBack} className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar para Ordens de Serviço</button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Rápido
          </button>
          <button
            onClick={() => window.open(`/print/service-order/${os.id}`, '_blank')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF Premium
          </button>
        </div>
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
            <p><span className="text-neutral-500 dark:text-neutral-400">Valor Total:</span> <span className="text-neutral-900 dark:text-neutral-100 font-bold">R$ {Number(os.finalTotal || 0).toFixed(2)}</span></p>
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

      {/* Checklist de OS */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">
          Checklist de Execução da OS
        </h3>
        <div className="space-y-3">
          {checklist.map((item: any) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggleChecklist(item.id)}
                className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium text-neutral-800 dark:text-neutral-200 ${item.checked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fotos e Evidências */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">
          Fotos e Evidências do Serviço
        </h3>
        <div className="flex gap-4 items-center">
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
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Enviando...' : 'Enviar Foto'}
          </button>
        </div>

        {/* Galeria Unificada */}
        {((os.photos && os.photos.length > 0) || mediaList.length > 0) ? (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Fotos legadas da OS */}
            {os.photos?.map((photo: any) => (
              <div key={photo.id} className="relative group border rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img src={photo.url} alt={photo.fileName} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-white truncate">{photo.fileName}</span>
                </div>
              </div>
            ))}
            {/* Novas mídias via /api/media */}
            {mediaList.map((media: any) => (
              <div key={media.id} className="relative group border rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img src={media.fileUrl} alt={media.fileName} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded self-start uppercase font-bold">{media.type}</span>
                  <span className="text-[10px] text-white truncate">{media.caption || media.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Nenhuma foto enviada ainda.</p>
        )}
      </div>

      {/* Materiais/Peças Consumidos */}
      {os.productUsages && os.productUsages.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">
            Materiais e Peças Utilizados
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Quantidade</th>
                  <th className="py-2 text-right">Preço Unitário</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {os.productUsages.map((usage: any) => (
                  <tr key={usage.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="py-2 text-neutral-800 dark:text-neutral-200">{usage.product?.name || 'Peça'}</td>
                    <td className="py-2 text-neutral-600 dark:text-neutral-400">{usage.quantityUsed}</td>
                    <td className="py-2 text-right text-neutral-600 dark:text-neutral-400">R$ {Number(usage.product?.price || 0).toFixed(2)}</td>
                    <td className="py-2 text-right font-medium text-neutral-800 dark:text-neutral-200">R$ {(Number(usage.quantityUsed || 0) * Number(usage.product?.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assinatura Digital do Cliente */}
      {os.signature && (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">
            Assinatura Digital de Aceite
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl flex items-center justify-center">
              <img src={os.signature.signatureData} alt="Assinatura" className="h-20 max-w-full object-contain" />
            </div>
            <div className="text-sm space-y-1.5">
              <p><span className="text-neutral-500">Signatário:</span> <span className="font-medium">{os.signature.signerName}</span></p>
              <p><span className="text-neutral-500">Data e Hora:</span> <span>{new Date(os.signature.signedAt).toLocaleString('pt-BR')}</span></p>
              {os.signature.ipAddress && <p><span className="text-neutral-500">IP:</span> <span className="font-mono text-xs">{os.signature.ipAddress}</span></p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-6 print:hidden">
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
