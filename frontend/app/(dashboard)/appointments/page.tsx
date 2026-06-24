'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  location: string;
  notes: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  technician: {
    id: string;
    name: string;
    specialty: string;
  };
  serviceOrder: {
    id: string;
    number: string;
    status: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');

  useEffect(() => {
    const fetchTechs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/technicians', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        setTechnicians(d.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTechs();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode, selectedTechnicianId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      let url = `/api/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      if (selectedTechnicianId) {
        url += `&technicianId=${selectedTechnicianId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setHours(0, 0, 0, 0);
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() - date.getDay());
      date.setHours(0, 0, 0, 0);
    } else {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getEndDate = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() + (6 - date.getDay()));
      date.setHours(23, 59, 59, 999);
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendada: 'bg-blue-100 text-blue-800',
      confirmada: 'bg-green-100 text-green-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-gray-100 text-gray-800',
      cancelada: 'bg-red-100 text-red-800',
      nao_compareceu: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      agendada: 'Agendada',
      confirmada: 'Confirmada',
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
      nao_compareceu: 'Não Compareceu',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      {/* Controles de Visualização */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-750 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-750 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-750 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            Mês
          </button>

          {/* Filtro de Técnicos */}
          <select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className="ml-4 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-750 text-neutral-800 dark:text-neutral-200 outline-none"
          >
            <option value="">Todos os Técnicos</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} {tech.specialty ? `(${tech.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium">
            {selectedDate.toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' && { day: 'numeric' }),
              ...(viewMode === 'week' && { day: 'numeric', month: 'numeric' }),
            })}
          </span>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="text-center py-8">Carregando agendamentos...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum agendamento encontrado para este período.
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      OS #{appointment.serviceOrder.number}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>{formatTime(appointment.date)} ({appointment.duration}min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>{appointment.customer.name}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{appointment.location}</span>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Técnico:</span> {appointment.technician.name}
                    {appointment.technician.specialty && (
                      <span className="text-gray-400"> ({appointment.technician.specialty})</span>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Obs:</span> {appointment.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                    Editar
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                    Iniciar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
