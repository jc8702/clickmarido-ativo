'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { CardShimmer } from '@/components/Shimmer';

interface Order {
  id: string;
  customer_name: string;
  amount: number;
  status: string;
}

interface Service {
  name: string;
  count: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const authUser = user as { email: string } | null;
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    pendingAmount: 0,
    ordersInProgress: 0,
    conversionRate: 0,
    customersTotal: 0,
    lastOrders: [] as Order[],
    topServices: [] as Service[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const statCards = [
    {
      label: 'Faturamento do Mês',
      value: formatCurrency(stats.receivedThisMonth || 0),
      description: 'Ganhos reais recebidos este mês',
      color: 'text-emerald-600',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      trend: (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 mt-2 w-max">
          ▲ 12.4%
        </span>
      ),
    },
    {
      label: 'Faturamento Pendente',
      value: formatCurrency(stats.pendingAmount || 0),
      description: 'Valores aguardando faturamento',
      color: 'text-amber-600',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h45.6M12 5.6V4a1 1 0 10-2 0v1.6M12 9v4H8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      trend: (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 mt-2 w-max">
          Aguardando
        </span>
      ),
    },
    {
      label: 'Clientes Ativos',
      value: stats.customersTotal,
      description: 'Total de contatos cadastrados',
      color: 'text-primary-600',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
      trend: (
        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 mt-2 w-max">
          ▲ 2 novos
        </span>
      ),
    },
    {
      label: 'Conversão',
      value: `${stats.conversionRate || 0}%`,
      description: 'Orçamentos aprovados',
      color: 'text-indigo-600',
      icon: (
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      ),
      trend: (
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 mt-2 w-max">
          Meta: 80%
        </span>
      ),
    },
  ];

  const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    agendada: 'primary',
    em_progresso: 'warning',
    concluida: 'success',
    cancelada: 'danger',
  };

  const statusLabels: Record<string, string> = {
    agendada: 'Agendada',
    em_progresso: 'Em Execução',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/customers', label: 'Clientes' },
          { href: '/quotations', label: 'Orçamentos' },
          { href: '/service-orders', label: 'Ordens de Serviço' },
          { href: '/payments', label: 'Pagamentos' },
          { href: '/warranties', label: 'Garantias' },
        ]}
        user={authUser ? { name: 'Admin', email: authUser.email } : { name: 'Admin', email: 'admin@clickmarido.local' }}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        {/* Boas-vindas */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-extrabold tracking-tight text-neutral-900 leading-none mb-3">
              Painel de Controle
            </h1>
            <p className="text-neutral-500 font-medium">Bem-vindo de volta! Aqui está o resumo operacional das suas atividades.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/quotations/new">
              <Button className="shadow-md hover:shadow-lg transition-all duration-300">
                + Novo Orçamento
              </Button>
            </Link>
            <Link href="/customers/new">
              <Button variant="secondary">
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardShimmer key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {statCards.map((stat, i) => (
              <Card 
                key={i} 
                gradient="none" 
                shadow="md" 
                className="border border-neutral-100/70 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
                <p className="text-[11px] text-neutral-500 mt-3 font-medium">{stat.description}</p>
                {stat.trend}
              </Card>
            ))}
          </div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Últimas Ordens */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-neutral-150 shadow-sm overflow-hidden">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-5">
                <CardTitle className="text-lg font-bold text-neutral-800">Ordens de Serviço Recentes</CardTitle>
                <CardDescription className="text-neutral-500">Últimos serviços agendados no CRM</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-8 space-y-4">
                      <div className="h-10 bg-neutral-100 rounded animate-pulse" />
                      <div className="h-10 bg-neutral-100 rounded animate-pulse" />
                    </div>
                  ) : stats.lastOrders && stats.lastOrders.length > 0 ? (
                    stats.lastOrders.map((order: Order) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/60 rounded-xl border border-neutral-200/50 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-900 text-sm group-hover:text-primary-600 transition-colors">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-neutral-500 font-medium">
                            Ordem Ref: <span className="font-mono">{order.id.slice(-6).toUpperCase()}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-extrabold text-neutral-800">
                            {order.amount ? formatCurrency(order.amount) : 'R$ 0,00'}
                          </span>
                          <Badge variant={statusBadgeVariant[order.status] || 'neutral'} size="sm" className="shadow-sm">
                            {statusLabels[order.status] || order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-200 rounded-xl">
                      <span className="text-3xl block mb-2">⏳</span>
                      Nenhuma ordem de serviço recente cadastrada.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Top Serviços e Performance */}
          <div className="space-y-6">
            {/* Top Serviços */}
            <Card className="border border-neutral-150 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-5">
                <CardTitle className="text-lg font-bold text-neutral-800">Top Serviços Requisitados</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-8 space-y-4">
                      <div className="h-6 bg-neutral-100 rounded animate-pulse" />
                      <div className="h-6 bg-neutral-100 rounded animate-pulse" />
                    </div>
                  ) : stats.topServices && stats.topServices.length > 0 ? (
                    stats.topServices.slice(0, 4).map((srv: Service, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-neutral-700">{srv.name}</span>
                          <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                            {srv.count} {srv.count === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-indigo-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(
                                (srv.count / (stats.topServices[0]?.count || 1)) * 100, 
                                100
                              )}%` 
                            }} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-neutral-400 text-xs">
                      Sem dados de serviços
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card gradient="subtle" className="border border-primary-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-primary-50/30 to-indigo-50/20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Taxa de Conversão Semanal</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-neutral-800">{stats.conversionRate || 0}%</span>
                    <span className="text-xs font-bold text-emerald-600">▲ Excelente</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-hero h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.conversionRate || 0}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500">
                    <span>Meta: 80%</span>
                    <span>Progresso Atual</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                  Continue convertendo orçamentos em ordens aprovadas para impulsionar o faturamento mensal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
