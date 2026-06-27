'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useQuotations } from '@/hooks/useQuotations';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { CardShimmer } from '@/components/Shimmer';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

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

interface RevenueHistoryItem {
  name: string;
  receita: number;
}

interface ServiceDistributionItem {
  name: string;
  value: number;
}

interface TechnicianPerformanceItem {
  name: string;
  valor: number;
}

interface OrderStatusDistributionItem {
  status: string;
  count: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    pendingAmount: 0,
    ordersInProgress: 0,
    conversionRate: 0,
    customersTotal: 0,
    availableTechnicians: 0,
    lastOrders: [] as Order[],
    topServices: [] as Service[],
    revenueHistory: [] as RevenueHistoryItem[],
    servicesDistribution: [] as ServiceDistributionItem[],
    technicianPerformance: [] as TechnicianPerformanceItem[],
    ordersStatusDistribution: [] as OrderStatusDistributionItem[],
  });
  const [loading, setLoading] = useState(true);

  const { data: quotationsData, isLoading: isLoadingQuotations, mutate: mutateQuotations } = useQuotations(undefined, 1);
  const quotations = (quotationsData?.data || []) as any[];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.data?.data) {
          setStats(response.data.data);
        }
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        {/* Boas-vindas */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 leading-none mb-3">
              Painel de Controle
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Bem-vindo de volta! Aqui está o resumo operacional das suas atividades.</p>
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
                className="border border-neutral-100/70 dark:border-neutral-700/70 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white dark:bg-neutral-800 group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-3 font-medium">{stat.description}</p>
                {stat.trend}
              </Card>
            ))}
          </div>
        )}

        {/* Kanban de Orçamentos */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">Funil de Orçamentos</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Acompanhe as propostas em aberto e suas temperaturas</p>
            </div>
          </div>
          {isLoadingQuotations ? (
             <div className="h-64 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse w-full"></div>
          ) : (
            <KanbanBoard 
              quotations={quotations} 
              onUpdateStatus={async (id, newStatus) => {
                try {
                  const response = await fetch(`/api/quotations/${id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                  });
                  if (response.ok) {
                    mutateQuotations();
                  }
                } catch (err) {
                  console.error('Erro ao atualizar status:', err);
                }
              }} 
            />
          )}
        </div>

        {/* Gráficos de Análise */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Histórico de Faturamento (Linha) */}
            <Card className="lg:col-span-2 border border-neutral-150 dark:border-neutral-700 shadow-sm p-6 bg-white dark:bg-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">Evolução do Faturamento</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Faturamento líquido semanal das últimas 8 semanas</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueHistory}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6347F9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6347F9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                    <Area type="monotone" dataKey="receita" stroke="#6347F9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Status das Ordens (Donut) */}
            <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm p-6 bg-white dark:bg-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">Status das Ordens</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Distribuição atual de ordens de serviço</p>
              <div className="h-72 flex flex-col justify-center items-center relative">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={stats.ordersStatusDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.ordersStatusDistribution?.map((entry: any, index: number) => {
                        const colors = ['#6347F9', '#FB8500', '#1FAA63', '#EF4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, statusLabels[name as string] || name]} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legendas customizadas */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-[10px] font-bold text-neutral-500">
                  {stats.ordersStatusDistribution?.map((entry: any, index: number) => {
                    const colors = ['#6347F9', '#FB8500', '#1FAA63', '#EF4444'];
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                        <span>{statusLabels[entry.status] || entry.status}: {entry.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mais Gráficos: Categorias e Técnicos */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Categorias de Serviços (Pizza) */}
            <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm p-6 bg-white dark:bg-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">Receita por Categoria</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Distribuição financeira de serviços nos últimos 6 meses</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.servicesDistribution}>
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Valor']} />
                    <Bar dataKey="value" fill="#6347F9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Produtividade de Técnicos (Barras Horizontais) */}
            <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm p-6 bg-white dark:bg-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">Performance de Técnicos</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Faturamento gerado por cada técnico com ordens concluídas</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.technicianPerformance} layout="vertical">
                    <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total OS']} />
                    <Bar dataKey="valor" fill="#1FAA63" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Últimas Ordens */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm overflow-hidden">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-5">
                <CardTitle className="text-lg font-bold text-neutral-800 dark:text-neutral-200">Ordens de Serviço Recentes</CardTitle>
                <CardDescription className="text-neutral-500 dark:text-neutral-400">Últimos serviços agendados no CRM</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-8 space-y-4">
                      <div className="h-10 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
                      <div className="h-10 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
                    </div>
                  ) : stats.lastOrders && stats.lastOrders.length > 0 ? (
                    stats.lastOrders.map((order: Order) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl border border-neutral-200/50 dark:border-neutral-600/50 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            Ordem Ref: <span className="font-mono">{order.id.slice(-6).toUpperCase()}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
                            {order.amount ? formatCurrency(order.amount) : 'R$ 0,00'}
                          </span>
                          <Badge variant={statusBadgeVariant[order.status] || 'neutral'} size="sm" className="shadow-sm">
                            {statusLabels[order.status] || order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl">
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
            <Card className="border border-neutral-150 dark:border-neutral-700 shadow-sm overflow-hidden bg-white dark:bg-neutral-800">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 py-5">
                <CardTitle className="text-lg font-bold text-neutral-800 dark:text-neutral-200">Top Serviços Requisitados</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-8 space-y-4">
                      <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
                      <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
                    </div>
                  ) : stats.topServices && stats.topServices.length > 0 ? (
                    stats.topServices.slice(0, 4).map((srv: Service, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-neutral-700 dark:text-neutral-300">{srv.name}</span>
                          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                            {srv.count} {srv.count === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
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
                    <div className="text-center py-10 text-neutral-400 dark:text-neutral-500 text-xs">
                      Sem dados de serviços
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card gradient="subtle" className="border border-primary-100 dark:border-primary-800 shadow-sm relative overflow-hidden bg-gradient-to-br from-primary-50/30 to-indigo-50/20 dark:from-primary-900/20 dark:to-indigo-900/20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Taxa de Conversão Semanal</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-200">{stats.conversionRate || 0}%</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">▲ Excelente</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-hero h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.conversionRate || 0}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    <span>Meta: 80%</span>
                    <span>Progresso Atual</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
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
