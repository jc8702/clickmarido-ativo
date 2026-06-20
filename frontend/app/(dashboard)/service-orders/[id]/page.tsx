'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useServiceOrder } from '../../../../hooks/useServiceOrders';

export default function ServiceOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: os, isLoading, mutate } = useServiceOrder(id as string);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) return <div className="p-8">Carregando Detalhes da OS...</div>;
  if (!os) return <div className="p-8 text-red-500">OS não encontrada.</div>;

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{os.number}</h1>
          <p className="text-gray-500 mt-1">Orçamento Ref: {os.quotation_id}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm
          ${os.status === 'agendada' ? 'bg-blue-100 text-blue-800' : 
            os.status === 'em_progresso' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}
        >
          {os.status.toUpperCase().replace('_', ' ')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Dados do Serviço</h3>
          <div className="space-y-3 text-sm">
            <p><span className="text-gray-500">Cliente:</span> {os.customer_name}</p>
            <p><span className="text-gray-500">Endereço:</span> {os.address}</p>
            <p><span className="text-gray-500">Data Agendada:</span> {new Date(os.scheduled_date).toLocaleDateString()} às {os.scheduled_time}</p>
            <p><span className="text-gray-500">Técnico Atribuído:</span> {os.technician_name}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Timeline (Execução)</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded border shadow-sm">
                <div className="font-bold text-gray-800 text-sm">Agendado</div>
                <div className="text-xs text-gray-500">{new Date(os.scheduled_date).toLocaleDateString()}</div>
              </div>
            </div>

            {os.arrival_time && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded border shadow-sm">
                  <div className="font-bold text-gray-800 text-sm">Chegada (Início)</div>
                  <div className="text-xs text-gray-500">{new Date(os.arrival_time).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {os.completion_time && (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded border shadow-sm">
                  <div className="font-bold text-gray-800 text-sm">Concluído</div>
                  <div className="text-xs text-gray-500">{new Date(os.completion_time).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Fotos do Serviço</h3>
        <div className="flex gap-4">
          <button onClick={handleUpload} className="px-4 py-2 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">
            📸 Tirar Foto Antes
          </button>
          <button onClick={handleUpload} className="px-4 py-2 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200">
            📸 Tirar Foto Depois
          </button>
        </div>
        <div className="mt-4 flex gap-4">
          {os.before_photos?.map((p: string, i: number) => (
            <img key={i} src={p} alt="Before" className="w-24 h-24 object-cover rounded border" />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t pt-6">
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
