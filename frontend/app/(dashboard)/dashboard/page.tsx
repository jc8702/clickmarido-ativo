'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';

export default function Dashboard() {
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    pendingAmount: 0,
    ordersInProgress: 0,
    conversionRate: 0,
    customersTotal: 0,
    lastOrders: [] as any[],
    topServices: [] as any[],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-fade-in text-neutral-600">Carregando dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Receita este mês',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receivedThisMonth || 0),
      icon: '💰',
      gradient: 'bg-gradient-hero',
    },
    {
      label: 'Clientes',
      value: stats.customersTotal,
      icon: '👥',
      gradient: 'bg-gradient-accent',
    },
    {
      label: 'Em Progresso',
      value: stats.ordersInProgress,
      icon: '⏳',
      gradient: 'bg-gradient-subtle text-neutral-900',
    },
    {
      label: 'Conversão',
      value: `${stats.conversionRate || 0}%`,
      icon: '📈',
      gradient: 'bg-gradient-warning',
    },
  ];

  const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    agendada: 'primary',
    em_progresso: 'warning',
    concluida: 'success',
    cancelada: 'danger',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/customers', label: 'Clientes' },
          { href: '/quotations', label: 'Orçamentos' },
        ]}
        user={{ name: 'Admin', email: 'admin@clickmarido.local' }}
      />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 mb-4">Visão Geral</h1>
          <p className="text-neutral-600">Resumo do seu negócio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => (
            <Card key={i} gradient="none" shadow="md">
              <div className={`${stat.gradient} rounded-lg p-4 mb-4 text-white text-2xl ${stat.gradient.includes('text-neutral-900') ? 'text-neutral-900' : 'text-white'}`}>
                {stat.icon}
              </div>
              <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Ordens</CardTitle>
                <CardDescription>Ordens de serviço recentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.lastOrders?.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">{order.customer_name}</p>
                        <p className="text-sm text-neutral-600">
                          {order.amount ? `R$ ${Number(order.amount).toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant[order.status] || 'neutral'} size="sm">
                        {order.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {(!stats.lastOrders || stats.lastOrders.length === 0) && (
                    <p className="text-sm text-neutral-500 text-center py-4">Nenhuma ordem recente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topServices?.map((srv: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-sm text-neutral-800">{srv.name}</span>
                      <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">{srv.count}</span>
                    </div>
                  ))}
                  {(!stats.topServices || stats.topServices.length === 0) && (
                    <p className="text-sm text-neutral-500 text-center py-4">Nenhum serviço registrado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card gradient="subtle">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-2">Faturamento Pendente</p>
                <p className="text-2xl font-bold text-neutral-900 mb-4">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.pendingAmount || 0)}
                </p>
                <div className="w-full bg-neutral-300 rounded-full h-2">
                  <div className="bg-gradient-hero h-2 rounded-full" style={{ width: `${Math.min(stats.conversionRate || 0, 100)}%` }} />
                </div>
                <p className="text-xs text-neutral-600 mt-2">{stats.conversionRate || 0}% taxa de conversão</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
