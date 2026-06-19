'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    ordersThisMonth: 0,
    ordersInProgress: 0,
    customersTotal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receita Mês */}
        <div className="bg-[#00A99D] rounded-xl shadow-sm p-6 text-white flex flex-col justify-between h-32">
          <h3 className="text-sm font-medium opacity-90">Receita este mês</h3>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receivedThisMonth || 0)}
          </p>
        </div>

        {/* Faturamento Pendente */}
        <div className="bg-red-500 rounded-xl shadow-sm p-6 text-white flex flex-col justify-between h-32">
          <h3 className="text-sm font-medium opacity-90">Faturamento Pendente</h3>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pendingAmount || 0)}
          </p>
        </div>

        {/* Ordens Em Progresso */}
        <div className="bg-[#E2AC00] rounded-xl shadow-sm p-6 text-white flex flex-col justify-between h-32">
          <h3 className="text-sm font-medium opacity-90">Em Progresso</h3>
          <p className="text-3xl font-bold">{stats.ordersInProgress || 0}</p>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-[#0D2137] rounded-xl shadow-sm p-6 text-white flex flex-col justify-between h-32">
          <h3 className="text-sm font-medium opacity-90">Conversão de Orçamentos</h3>
          <p className="text-3xl font-bold">{stats.conversionRate || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Últimas Ordens</h3>
          <div className="space-y-4">
            {stats.lastOrders?.map(order => (
              <div key={order.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">Status: {order.status}</p>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {order.amount ? `R$ ${Number(order.amount).toFixed(2)}` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Serviços</h3>
          <div className="space-y-4">
            {stats.topServices?.map((srv, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-800">{srv.name}</span>
                <span className="text-sm font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{srv.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
