'use client';

import React, { useState } from 'react';
import { useNPS, usePendingNPS } from '@/hooks/useNPS';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { TableShimmer } from '@/components/Shimmer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function NPSPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending'>('dashboard');
  
  const { metrics, history, totalPages, isLoading } = useNPS({
    page,
    limit: 10,
  });

  const { pending, isLoading: isLoadingPending } = usePendingNPS();

  const parseFeedback = (feedbackText: string | null) => {
    if (!feedbackText) return { options: [], comment: '' };
    const match = feedbackText.match(/^\[Opções: (.*?)\]\s*(.*)$/s);
    if (match) {
      const options = match[1].split(',').map(o => o.trim());
      const comment = match[2];
      return { options, comment };
    }
    return { options: [], comment: feedbackText };
  };

  const getClassification = (score: number) => {
    if (score >= 75) return { label: 'Zona de Excelência', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' };
    if (score >= 50) return { label: 'Zona de Qualidade', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50', bg: 'bg-gradient-to-br from-sky-500 to-blue-600' };
    if (score >= 0) return { label: 'Zona de Aperfeiçoamento', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50', bg: 'bg-gradient-to-br from-amber-500 to-orange-600' };
    return { label: 'Zona Crítica', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50', bg: 'bg-gradient-to-br from-rose-500 to-red-600' };
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return <Badge variant="success">Promotor ({score})</Badge>;
    if (score >= 7) return <Badge variant="warning">Neutro ({score})</Badge>;
    return <Badge variant="danger">Detrator ({score})</Badge>;
  };

  const handleSendSurvey = (customerId: string, phone: string, osId?: string, techId?: string) => {
    // Aqui no futuro será substituído pela integração com Z-API para enviar um template do WhatsApp
    let link = `https://clickmarido-ativo-frontend.vercel.app/survey/${customerId}`;
    const params = new URLSearchParams();
    if (osId) params.append('os', osId);
    if (techId) params.append('tech', techId);
    if (params.toString()) link += `?${params.toString()}`;

    const message = encodeURIComponent(`Olá! Agradecemos por utilizar nossos serviços. Gostaríamos de saber como foi sua experiência conosco e com nosso técnico. Por favor, responda nossa rápida pesquisa de satisfação: ${link}`);
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const npsScore = metrics?.npsScore ?? 0;
  const classification = getClassification(npsScore);

  const chartData = metrics
    ? [
        { name: 'Promotores', value: metrics.promoters, color: '#10b981' },
        { name: 'Passivos', value: metrics.passives, color: '#f59e0b' },
        { name: 'Detratores', value: metrics.detractors, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Inteligência de Cliente
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 mt-2">
            Acompanhe a satisfação (NPS) e envie pesquisas para serviços concluídos.
          </p>
        </div>
        <div className="flex bg-neutral-100/70 dark:bg-neutral-800/70 backdrop-blur-md p-1.5 rounded-full border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-white dark:bg-neutral-700 shadow-md text-primary-600 dark:text-primary-400 scale-105' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white dark:bg-neutral-700 shadow-md text-primary-600 dark:text-primary-400 scale-105' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'}`}
          >
            Pesquisas Pendentes
            {pending && pending.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {pending.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 overflow-hidden relative border border-white/20 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl group hover:-translate-y-1 transition-all duration-300">
              <div className={`absolute inset-0 opacity-15 dark:opacity-20 ${classification.bg} group-hover:opacity-25 transition-opacity duration-500`} />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 dark:bg-white/5 blur-3xl rounded-full pointer-events-none" />
              <CardContent className="flex flex-col items-center justify-center p-10 h-full relative z-10">
                {isLoading ? (
                  <div className="h-24 w-32 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-2xl animate-pulse" />
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">NPS Global</p>
                    <span className={`text-8xl font-black tracking-tighter drop-shadow-sm ${classification.color.split(' ')[0]} group-hover:scale-105 transition-transform duration-500`}>
                      {npsScore > 0 ? `+${npsScore}` : npsScore}
                    </span>
                    <div className={`mt-6 px-5 py-2 rounded-full border backdrop-blur-sm text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${classification.color}`}>
                      {classification.label}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <Card className="border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <CardHeader className="pb-2 pt-6 px-6">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total de Respostas</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                    {isLoading ? '...' : metrics?.totalResponses ?? 0}
                  </div>
                  <p className="text-sm text-neutral-500 mt-2 font-medium">respostas recebidas até hoje</p>
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl row-span-2 flex flex-col justify-center overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <CardHeader className="pb-0 text-center">
                  <CardTitle className="text-sm font-medium text-neutral-500">Distribuição Visual</CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                  {isLoading ? (
                    <div className="h-32 w-32 rounded-full border-8 border-neutral-100 dark:border-neutral-800 border-t-neutral-300 animate-spin" />
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} respostas`, 'Quantidade']}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontWeight: '600'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-neutral-400 text-sm">Sem dados</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <CardHeader className="pb-2 pt-6 px-6">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Taxa de Resposta</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                    {isLoading ? '...' : metrics?.totalResponses ? Math.round((metrics.totalResponses / Math.max(metrics.totalResponses + pending.length, 1)) * 100) : 0}%
                  </div>
                  <p className="text-sm text-neutral-500 mt-2 font-medium">dos clientes enviados respondem</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórico e Feedbacks */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden rounded-3xl">
            <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 px-8 py-6 backdrop-blur-sm">
              <CardTitle className="text-xl font-bold">Feedbacks Recentes</CardTitle>
              <CardDescription className="text-neutral-500 mt-1">O que os clientes estão dizendo sobre seus serviços</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent">
                      <TableHead className="pl-6 font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Nota NPS</TableHead>
                      <TableHead className="font-semibold">Técnico / OS</TableHead>
                      <TableHead className="font-semibold pr-6">Feedback Analítico</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {isLoading ? (
                      <TableShimmer cols={5} rows={4} />
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-neutral-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p>Nenhum feedback recebido ainda.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="font-bold text-neutral-900 dark:text-neutral-100">{item.customer?.name || 'Cliente Removido'}</div>
                            <div className="text-xs text-neutral-500 mt-0.5">{item.customer?.phone}</div>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {getScoreBadge(item.score)}
                          </TableCell>
                          <TableCell>
                            {item.technician ? (
                              <div>
                                <div className="text-sm font-semibold">{item.technician.name}</div>
                                {item.technicianScore && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-amber-500 text-xs flex">
                                      {Array.from({ length: item.technicianScore }).map((_, i) => (
                                        <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                      ))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">N/A</span>
                            )}
                            {item.serviceOrder && (
                              <div className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">
                                OS: {item.serviceOrder.number}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 py-4 max-w-md">
                            {(() => {
                              const { options, comment } = parseFeedback(item.feedback);
                              return (
                                <div className="space-y-2">
                                  {options.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {options.map((opt) => (
                                        <span
                                          key={opt}
                                          className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                                            item.score >= 9
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                              : item.score >= 7
                                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                                          }`}
                                        >
                                          {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {comment && (
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic border-l-2 pl-3 border-neutral-200 dark:border-neutral-700">
                                      "{comment}"
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Paginação */}
              {!isLoading && totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-sm text-neutral-500 font-medium">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full shadow-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      Anterior
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full shadow-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pending' && (
        <Card className="border border-rose-100/50 dark:border-rose-900/30 shadow-[0_8px_30px_rgb(225,29,72,0.08)] rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-rose-50/80 to-transparent dark:from-rose-950/30 dark:to-transparent border-b border-rose-100/50 dark:border-rose-900/30 px-8 py-8 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-2xl shadow-sm text-rose-600 dark:text-rose-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-rose-900 dark:text-rose-100">Pesquisas Prontas para Disparo</CardTitle>
                <CardDescription className="text-rose-700/80 dark:text-rose-200/60 mt-1 font-medium">
                  Clientes com serviço recentemente concluído que devem receber a avaliação de NPS.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent border-b border-neutral-100 dark:border-neutral-800">
                    <TableHead className="pl-6 font-semibold py-4">Cliente</TableHead>
                    <TableHead className="font-semibold">Valor da OS</TableHead>
                    <TableHead className="font-semibold">Data de Conclusão</TableHead>
                    <TableHead className="font-semibold pr-6 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {isLoadingPending ? (
                    <TableShimmer cols={4} rows={3} />
                  ) : pending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Tudo em dia!</p>
                          <p className="text-neutral-500">Nenhum cliente pendente de envio de pesquisa no momento.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.map((item) => (
                      <TableRow key={item.paymentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="font-bold text-neutral-900 dark:text-neutral-100">{item.customerName}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{item.customerPhone}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.paymentAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-500">
                          {item.paymentDate && new Date(item.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                          <Button 
                            onClick={() => handleSendSurvey(item.customerId, item.customerPhone, item.osId, item.technicianId)}
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 gap-2 rounded-xl px-5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Disparar Pesquisa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
