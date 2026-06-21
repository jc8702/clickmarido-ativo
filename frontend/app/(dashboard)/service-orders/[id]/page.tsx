'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useServiceOrder } from '../../../../hooks/useServiceOrders';

export default function ServiceOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: os, isLoading, mutate } = useServiceOrder(id as string);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) return <div className="p-8 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-screen">Carregando Detalhes da OS...</div>;
  if (!os) return <div className="p-8 bg-neutral-50 dark:bg-neutral-900 text-red-500 dark:text-red-400 min-h-screen">OS não encontrada.</div>;

  const handleStart = async () => {
    setIsProcessing(true);
    // Simula chamada POST /start
    setTimeout(() => {
      mutate({ status: 'em_progresso', arrival_time: new Date().toISOString() });
      setIsProcessing(false);
      alert('Técnico Iniciou o Serviço! Cliente notificado via WhatsApp.');
    }, 1000);
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    // Simula chamada POST /complete
    setTimeout(() => {
      mutate({ status: 'concluida', completion_time: new Date().toISOString() });
      setIsProcessing(false);
      alert('Serviço Concluído com Sucesso!');
    }, 1000);
  };

  const handleUpload = () => {
    // Simula upload cloudinary
    alert('Fotos anexadas (Mock Cloudinary)!');
    mutate({ before_photos: ['https://placehold.co/150x150?text=Before'] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{os.number}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Orçamento Ref: {os.quotation_id}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm
          ${os.status === 'agendada' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
            os.status === 'em_progresso' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
        >
          {os.status.toUpperCase().replace('_', ' ')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Dados do Serviço</h3>
          <div className="space-y-3 text-sm">
            <p><span className="text-neutral-500 dark:text-neutral-400">Cliente:</span> <span className="text-neutral-900 dark:text-neutral-100">{os.customer_name}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Endereço:</span> <span className="text-neutral-900 dark:text-neutral-100">{os.address}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Data Agendada:</span> <span className="text-neutral-900 dark:text-neutral-100">{new Date(os.scheduled_date).toLocaleDateString()} às {os.scheduled_time}</span></p>
            <p><span className="text-neutral-500 dark:text-neutral-400">Técnico Atribuído:</span> <span className="text-neutral-900 dark:text-neutral-100">{os.technician_name}</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Timeline (Execução)</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-600 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Agendado</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.scheduled_date).toLocaleDateString()}</div>
              </div>
            </div>

            {os.arrival_time && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Chegada (Início)</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.arrival_time).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {os.completion_time && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-800 p-3 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Concluído</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(os.completion_time).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-lg border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4 text-neutral-900 dark:text-neutral-100">Fotos do Serviço</h3>
        <div className="flex gap-4">
          <button onClick={handleUpload} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600">
            📸 Tirar Foto Antes
          </button>
          <button onClick={handleUpload} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600">
            📸 Tirar Foto Depois
          </button>
        </div>
        <div className="mt-4 flex gap-4">
          {os.before_photos?.map((p: string, i: number) => (
            <img key={i} src={p} alt="Before" className="w-24 h-24 object-cover rounded border" />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-6">
        {os.status === 'agendada' && (
          <button 
            onClick={handleStart}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            {isProcessing ? 'Processando...' : 'Iniciar Serviço (Técnico Chegou)'}
          </button>
        )}
        
        {os.status === 'em_progresso' && (
          <button 
            onClick={handleComplete}
            disabled={isProcessing}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
          >
            {isProcessing ? 'Processando...' : 'Concluir Serviço'}
          </button>
        )}
      </div>
    </div>
  );
}
