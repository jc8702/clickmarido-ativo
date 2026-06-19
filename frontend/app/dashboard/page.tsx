'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function DashboardPage() {
  const [kpis, setKpis] = useState({
    receivedThisMonth: 42000,
    pendingRevenue: 8500,
    totalOrdersThisMonth: 125,
    completionRate: 88,
    averageNps: 9.4
  });

  const revenueTrendData = [
    { name: 'Jul/25', faturamento: 12000 },
    { name: 'Ago/25', faturamento: 15000 },
    { name: 'Set/25', faturamento: 14200 },
    { name: 'Out/25', faturamento: 18900 },
    { name: 'Nov/25', faturamento: 22000 },
    { name: 'Dez/25', faturamento: 31000 },
    { name: 'Jan/26', faturamento: 25000 },
    { name: 'Fev/26', faturamento: 27500 },
    { name: 'Mar/26', faturamento: 29000 },
    { name: 'Abr/26', faturamento: 35000 },
    { name: 'Mai/26', faturamento: 38000 },
    { name: 'Jun/26', faturamento: 42000 }
  ];

  const paymentMethodsData = [
    { name: 'PIX', value: 65 },
    { name: 'Cartão de Crédito', value: 25 },
    { name: 'Boleto', value: 10 }
  ];

  const topServicesData = [
    { name: 'Marido de Aluguel', quantidade: 145 },
    { name: 'Eletricista', quantidade: 98 },
    { name: 'Encanador', quantidade: 86 },
    { name: 'Instalação de AC', quantidade: 54 },
    { name: 'Pintor', quantidade: 32 }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Dashboard Executivo</h1>
        <p style={{ color: '#6B7280', marginTop: '4px' }}>KPIs e análise de faturamento em tempo real.</p>
      </header>

      {/* Grid de KPIs - Responsivo */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* KPI 1 */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Recebido este mês</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#10B981', marginTop: '8px' }}>
            R$ {kpis.receivedThisMonth.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '12px', color: '#10B981', display: 'block', marginTop: '4px' }}>▲ +12% vs mês anterior</span>
        </div>

        {/* KPI 2 */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Pendente</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#F59E0B', marginTop: '8px' }}>
            R$ {kpis.pendingRevenue.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginTop: '4px' }}>Aguardando webhook</span>
        </div>

        {/* KPI 3 */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Ordens este mês</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1F2937', marginTop: '8px' }}>
            {kpis.totalOrdersThisMonth}
          </div>
          <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginTop: '4px' }}>Ordens finalizadas & pendentes</span>
        </div>

        {/* KPI 4 */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Taxa de conclusão</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#3B82F6', marginTop: '8px' }}>
            {kpis.completionRate}%
          </div>
          <span style={{ fontSize: '12px', color: '#3B82F6', display: 'block', marginTop: '4px' }}>Eficiência operacional alta</span>
        </div>

        {/* KPI 5 */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>NPS Médio</span>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#8B5CF6', marginTop: '8px' }}>
            {kpis.averageNps} / 10
          </div>
          <span style={{ fontSize: '12px', color: '#8B5CF6', display: 'block', marginTop: '4px' }}>Zona de Excelência</span>
        </div>
      </section>

      {/* Seção de Gráficos */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {/* Gráfico 1 - Linha (Faturamento) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '340px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '20px', margin: 0 }}>Histórico de Faturamento (Últimos 12 meses)</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="faturamento" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2 - Pizza (Métodos Pagamento) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '340px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '20px', margin: 0 }}>Métodos de Pagamento</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3 - Barra (Serviços Top) */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '340px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '20px', margin: 0 }}>Top 5 Serviços</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
