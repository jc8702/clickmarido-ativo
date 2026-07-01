'use client';

import React, { useState } from 'react';
import { useNPS } from '@/hooks/useNPS';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { TableShimmer } from '@/components/Shimmer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function NPSPage() {
  const [page, setPage] = useState(1);
  const { metrics, history, totalPages, isLoading } = useNPS({
    page,
    limit: 10,
  });

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
    if (score >= 75) return { label: 'Zona de Excelência', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' };
    if (score >= 50) return { label: 'Zona de Qualidade', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50' };
    if (score >= 0) return { label: 'Zona de Aperfeiçoamento', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' };
    return { label: 'Zona Crítica', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' };
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return <Badge variant="success">Promotor ({score})</Badge>;
    if (score >= 7) return <Badge variant="warning">Neutro ({score})</Badge>;
    return <Badge variant="danger">Detrator ({score})</Badge>;
  };

  const npsScore = metrics?.npsScore ?? 0;
  const classification = getClassification(npsScore);

  const chartData = metrics
    ? [
        { name: 'Promotores (9-10)', value: metrics.promoters, color: '#10b981' },
        { name: 'Passivos (7-8)', value: metrics.passives, color: '#f59e0b' },
        { name: 'Detratores (0-6)', value: metrics.detractors, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Pesquisa de Satisfação (NPS)</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Acompanhe o nível de satisfação dos seus clientes e os feedbacks coletados.
        </p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>NPS Global</CardTitle>
            <CardDescription>Net Promoter Score consolidado</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {isLoading ? (
              <div className="h-16 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            ) : (
              <div className="text-center space-y-3">
                <span className={`text-6xl font-black tracking-tight ${classification.color.split(' ')[0]}`}>
                  {npsScore > 0 ? `+${npsScore}` : npsScore}
                </span>
                <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold ${classification.color}`}>
                  {classification.label}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Respostas</CardTitle>
            <CardDescription>Pesquisas respondidas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <span className="text-5xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {isLoading ? '...' : metrics?.totalResponses ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
            <CardDescription>Percentual por tipo de cliente</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
            ) : metrics && metrics.totalResponses > 0 ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span>Promotores:</span>
                  <span className="font-semibold">
                    {Math.round((metrics.promoters / metrics.totalResponses) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                  <span>Passivos:</span>
                  <span className="font-semibold">
                    {Math.round((metrics.passives / metrics.totalResponses) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>Detratores:</span>
                  <span className="font-semibold">
                    {Math.round((metrics.detractors / metrics.totalResponses) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-4 text-sm">Sem respostas suficientes</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Distribuição Visual</CardTitle>
            <CardDescription>Divisão de categorias NPS</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {isLoading ? (
              <div className="h-48 w-48 rounded-full border-8 border-neutral-100 dark:border-neutral-800 border-t-neutral-200 animate-spin" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} respostas`, 'Quantidade']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400 text-sm text-center">
                Dados insuficientes para gerar o gráfico.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Avaliações</CardTitle>
            <CardDescription>Respostas individuais de clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Comentário</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {isLoading ? (
                    <TableShimmer cols={4} rows={5} />
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                        Nenhuma avaliação recebida até o momento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          <div>{item.customer?.name || 'Cliente Removido'}</div>
                          <div className="text-xs text-neutral-500">{item.customer?.phone}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {getScoreBadge(item.score)}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600 dark:text-neutral-300 max-w-md">
                          {(() => {
                            const { options, comment } = parseFeedback(item.feedback);
                            return (
                              <div className="space-y-1.5">
                                {options.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {options.map((opt) => (
                                      <span
                                        key={opt}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                          item.score >= 9
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                                            : item.score >= 7
                                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                                        }`}
                                      >
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {comment ? (
                                  <div className="truncate max-w-xs" title={comment}>
                                    {comment}
                                  </div>
                                ) : options.length > 0 ? (
                                  <span className="text-neutral-400 text-xs italic">Sem comentário adicional</span>
                                ) : (
                                  <span className="text-neutral-400 italic">Sem comentário</span>
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
              <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
