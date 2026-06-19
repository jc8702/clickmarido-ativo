'use client';

import React from 'react';
import Link from 'next/link';
import { useServiceOrders } from '../../../hooks/useServiceOrders';

export default function ServiceOrdersCalendarPage() {
  const { data, isLoading } = useServiceOrders();

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (isLoading) return <div className="p-8">Carregando Agenda...</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'agendada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'em_progresso': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'concluida': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda de Serviços</h1>
          <p className="text-gray-500">Arraste para realocar técnicos ou reagendar.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Agendada</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Em Progresso</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Concluída</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {days.map((day, idx) => (
          <div key={day} className="bg-gray-50 rounded-lg border border-gray-200 min-h-[600px]">
            <div className="bg-gray-200 p-3 text-center font-semibold text-sm border-b border-gray-300">
              {day}
            </div>
            <div className="p-2 space-y-3">
              {/* Simulando cards para os dias atuais (ex: Hoje cai num dos dias) */}
              {idx === new Date().getDay() - 1 && data?.map(os => (
                <div 
                  key={os.id} 
                  draggable
                  className={`p-3 rounded-md border shadow-sm cursor-grab ${getStatusColor(os.status)}`}
                >
                  <Link href={`/service-orders/${os.id}`}>
                    <div className="font-bold text-sm mb-1">{os.number}</div>
                    <div className="text-xs font-medium mb-2">{os.scheduled_time} - {os.technician_name}</div>
                    <div className="text-xs truncate">{os.customer_name}</div>
                    <div className="text-xs truncate opacity-75">{os.address}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
