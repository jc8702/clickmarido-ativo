"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Badge } from '@/components/Badge';
import Button from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  RefreshCw, 
  Lightbulb, 
  MessageSquare,
  ArrowRight,
  Target
} from 'lucide-react';
import Link from 'next/link';

type AnalyticsData = {
  totalLeads: number;
  qualifiedLeads: number;
  winRate: number;
  avgResponseTime: string;
  totalRevenue: number;
  leadsBySource: { name: string; value: number }[];
  funnelDrops: { stage: string; count: number }[];
  lossAnalysis: { reason: string; count: number }[];
  temperatureStats: { name: string; value: number }[];
  leadsHotAndStale: {
    id: string;
    name: string;
    phone?: string;
    status: string;
    funnelStage: string;
    lastUpdate: string;
  }[];
  slaBreachedLeads: {
    id: string;
    name: string;
    phone?: string;
    slaBreachCount: number;
    funnelStage: string;
  }[];
};

export default function InsightsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const labelColor = isDark ? '#D1D5DB' : '#374151';
  const gridColor = isDark ? '#1F2937' : '#E5E7EB';

  const fetchInsights = () => {
    setRefreshing(true);
    fetch('/api/leads/insights')
      .then(res => res.json())
      .then(insights => {
        setData(insights);
      })
      .catch(err => console.error('Erro ao buscar insights:', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Cores do Design System Corporativo para gráficos
  const COLORS = [
    '#5D3FD3', // Roxo Primário
    '#10B981', // Verde Sucesso
    '#F59E0B', // Laranja Alerta
    '#4C1D95', // Roxo Escuro
    '#9F7AEA'  // Roxo Claro
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Processando métricas de CRM e inteligência comercial...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Volume de Leads',
      value: data?.totalLeads || 0,
      description: 'Leads no pipeline',
      icon: Users,
      color: 'text-primary-600 dark:text-primary-400'
    },
    {
      title: 'Taxa de Qualificação',
      value: data?.totalLeads ? `${Math.round(((data.qualifiedLeads || 0) / data.totalLeads) * 100)}%` : '0%',
      description: `${data?.qualifiedLeads || 0} leads qualificados`,
      icon: Target,
      color: 'text-success-600 dark:text-success-400'
    },
    {
      title: 'Valor do Pipeline',
      value: formatCurrency(data?.totalRevenue || 0),
      description: 'Em negociações ativas',
      icon: DollarSign,
      color: 'text-success-600 dark:text-success-400'
    },
    {
      title: 'SLA de Atendimento',
      value: data?.avgResponseTime || '0 min',
      description: 'Tempo de 1ª resposta',
      icon: Clock,
      color: 'text-warning-600 dark:text-warning-400'
    }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] flex flex-col space-y-6 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      
      {/* Header Padronizado */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Inteligência Comercial & Insights
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Métricas de conversão, saúde do funil de vendas, análise de perdas e alertas operacionais.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInsights} 
          isLoading={refreshing}
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
        >
          Atualizar dados
        </Button>
      </div>

      {/* Grid de KPIs Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} gradient="subtle" shadow="sm" className="relative overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mt-1">
                      {kpi.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos de Funil e Distribuição por Origem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Funil de Conversão */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Funil de Conversão Comercial
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Distribuição de leads ativos pelas etapas do processo de vendas.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data && data.funnelDrops.some(f => f.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnelDrops} layout="vertical">
                  <XAxis type="number" stroke={labelColor} tickLine={false} axisLine={false} />
                  <YAxis dataKey="stage" type="category" stroke={labelColor} width={130} tickLine={false} axisLine={false} className="text-xs font-semibold" />
                  <Tooltip 
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#F3F4F6' : '#111827',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#5D3FD3" radius={[0, 4, 4, 0]}>
                    {data.funnelDrops.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.stage === 'Ganho (Fechado)' ? '#10B981' : '#5D3FD3'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">Nenhum dado do funil comercial registrado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Origem de Leads */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Origem dos Leads
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Canais que mais geram oportunidades comerciais para a empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center">
            {data && data.leadsBySource.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                <div className="flex-1 w-full h-full max-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.leadsBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.leadsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F3F4F6' : '#111827',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 shrink-0 sm:w-1/3 text-xs w-full max-h-[200px] overflow-y-auto pr-1">
                  {data.leadsBySource.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 line-clamp-1">{entry.name}</span>
                      <span className="text-neutral-400 ml-auto font-mono">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">Sem origens registradas no banco.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Motivos de Perda e Temperatura do Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Motivos de Perda */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Análise de Perdas
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Identificação dos gargalos de descarte e motivos de desistência.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data && data.lossAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.lossAnalysis}>
                  <XAxis dataKey="reason" stroke={labelColor} tickLine={false} axisLine={false} className="text-[10px]" />
                  <YAxis stroke={labelColor} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#F3F4F6' : '#111827',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">Nenhuma desqualificação ou perda registrada.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temperatura do Funil */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning-500" />
              Temperatura de Vendas
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Engajamento e urgência dos leads ativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center">
            {data && data.temperatureStats.some(t => t.value > 0) ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                <div className="flex-1 w-full h-full max-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.temperatureStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.temperatureStats.map((entry, index) => {
                          const name = entry.name.toUpperCase();
                          let color = '#E5E7EB'; // Frio
                          if (name === 'MORNO') color = '#9F7AEA'; // Morno
                          if (name === 'QUENTE') color = '#F59E0B'; // Quente
                          if (name.includes('ORÇAMENTO') || name.includes('ORCAMENTO')) color = '#EF4444'; // Crítico / Pronto
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          color: isDark ? '#F3F4F6' : '#111827',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 shrink-0 sm:w-1/3 text-xs w-full max-h-[200px] overflow-y-auto pr-1">
                  {data.temperatureStats.map((entry, index) => {
                    const name = entry.name.toUpperCase();
                    let color = '#9CA3AF'; // Frio
                    if (name === 'MORNO') color = '#9F7AEA'; // Morno
                    if (name === 'QUENTE') color = '#F59E0B'; // Quente
                    if (name.includes('ORÇAMENTO') || name.includes('ORCAMENTO')) color = '#EF4444'; // Crítico / Pronto
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{entry.name}</span>
                        <span className="text-neutral-400 ml-auto font-mono">({entry.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">Nenhum lead com temperatura classificada.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção Operacional: Alertas e Leads Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Leads Quentes Parados (>48h) */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning-500" />
              Leads Quentes Estagnados (&gt;48h)
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Oportunidades de alto fechamento sem nenhuma interação ou atualização recente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 max-h-72 overflow-y-auto">
            {data && data.leadsHotAndStale.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {data.leadsHotAndStale.map(lead => (
                  <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm text-neutral-950 dark:text-neutral-50">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="warning" size="sm" className="text-[10px] py-0 font-bold">
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-neutral-400">
                          Estagnado desde {new Date(lead.lastUpdate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Link href="/pre-vendas" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold flex items-center gap-1 shrink-0">
                      Ver no Kanban
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[150px] flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400 text-center px-4">Excelente! Nenhum lead quente parado comercialmente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quebras de SLA Operacionais */}
        <Card className="border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alerta de Violação de SLA
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Leads ativos que estouraram o prazo de resposta comercial regulamentado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 max-h-72 overflow-y-auto">
            {data && data.slaBreachedLeads.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {data.slaBreachedLeads.map(lead => (
                  <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm text-neutral-950 dark:text-neutral-50">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {lead.slaBreachCount} violações de SLA
                        </span>
                        <span className="text-xs text-neutral-400">
                          Estágio: {lead.funnelStage}
                        </span>
                      </div>
                    </div>
                    <Link href="/chat" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold flex items-center gap-1 shrink-0">
                      Chamar no WhatsApp
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[150px] flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400 text-center px-4">Parabéns! Nenhum lead com estouro de SLA ativo.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloco de Insights e IA */}
      <Card gradient="subtle" className="border border-neutral-200/60 dark:border-neutral-800/60 bg-gradient-subtle dark:bg-neutral-900/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <Lightbulb className="w-64 h-64" />
        </div>
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm text-primary-600 shrink-0">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Conselheiro Comercial Automático
            </h3>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
              Gargalo Comercial e Eficiência Comercial:
            </p>
            <ul className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 list-disc list-inside space-y-1">
              <li>
                <strong>O WhatsApp lidera captações:</strong> {data && data.leadsBySource.length > 0 ? `Canais de mensagem representam a maior parte dos leads ativos. ` : `Foque na captação orgânica via WhatsApp.`}
                A velocidade de 1ª resposta é o fator crucial na conversão.
              </li>
              <li>
                <strong>Mitigue perdas comerciais:</strong> Sempre registre o motivo da perda nas negociações descartadas para calibrar a qualificação operacional e o script de atendimento.
              </li>
              {data && data.leadsHotAndStale.length > 0 && (
                <li className="text-warning-600 dark:text-warning-400 font-medium">
                  Atenção! Você possui {data.leadsHotAndStale.length} leads quentes estagnados sem contato recente. Risco elevado de perda da oportunidade.
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
