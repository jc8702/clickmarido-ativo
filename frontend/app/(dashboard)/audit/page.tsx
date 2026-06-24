'use client';

import React, { useState } from 'react';
import { useAudit, AuditLogItem } from '@/hooks/useAudit';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { TableShimmer } from '@/components/Shimmer';

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { logs, totalPages, isLoading } = useAudit({
    page,
    limit: 15,
    entity: entityFilter,
  });

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'quotation':
        return <Badge variant="neutral">Orçamento</Badge>;
      case 'service_order':
        return <Badge variant="primary">Ordem de Serviço</Badge>;
      case 'payment':
        return <Badge variant="success">Pagamento</Badge>;
      default:
        return <Badge variant="neutral">{entity}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created')) return 'Criado';
    if (act.includes('updated')) return 'Atualizado';
    if (act.includes('deleted') || act.includes('cancelled')) return 'Excluído/Cancelado';
    if (act.includes('automation')) return 'Automação Disparada';
    return action;
  };

  const handleToggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return 'Nulo';
    if (typeof val === 'object') {
      return (
        <pre className="text-[11px] font-mono bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 overflow-x-auto text-neutral-800 dark:text-neutral-300 max-w-full">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return String(val);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Auditoria do Sistema</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Timeline completa de ações, alterações e triggers de automação nas entidades do CRM.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Filtrar:
          </label>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todas as Entidades</option>
            <option value="quotation">Orçamentos</option>
            <option value="service_order">Ordens de Serviço</option>
            <option value="payment">Pagamentos</option>
          </select>
        </div>
      </div>

      {/* Histórico/Tabela */}
      <Card className="shadow-lg border-neutral-100 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Timeline de Logs</CardTitle>
          <CardDescription>Rastreabilidade de modificações e triggers do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID da Entidade</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Realizado por</TableHead>
                </TableRow>
              </TableHeader>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isLoading ? (
                  <TableShimmer cols={6} rows={8} />
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const hasValues = log.oldValue || log.newValue;
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                          <TableCell className="text-center">
                            {hasValues ? (
                              <button
                                onClick={() => handleToggleExpand(log.id)}
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                              >
                                <svg
                                  className={`w-4 h-4 transform transition-transform duration-200 ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-700 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {getEntityLabel(log.entity)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs text-neutral-500">
                            {log.entityId.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-semibold">
                            {getActionLabel(log.action)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                            {log.createdBy === 'system_automation' ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">Automação Sistema</span>
                            ) : (
                              log.createdBy || 'Sistema'
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expansão das Diferenças */}
                        {isExpanded && hasValues && (
                          <TableRow className="bg-neutral-50/30 dark:bg-neutral-900/10">
                            <TableCell colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                {log.oldValue && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                      Valor Anterior (Antes)
                                    </h4>
                                    {formatValue(log.oldValue)}
                                  </div>
                                )}
                                {log.newValue && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                      Novo Valor (Depois)
                                    </h4>
                                    {formatValue(log.newValue)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
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
  );
}
