'use client';

import React, { useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { TableShimmer } from '@/components/Shimmer';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { toast } from 'react-hot-toast';

export default function ChatPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { messages, total, totalPages, isLoading, mutate } = useMessages({
    page,
    limit: 15,
    search: debouncedSearch,
    status: statusFilter,
  });

  useEscapeToClose(isModalOpen, () => setIsModalOpen(false));

  // Simple debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Chat WhatsApp
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Histórico de notificações e envio de mensagens rápidas.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Mensagem
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar por telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="SENT">Enviado</option>
            <option value="FAILED">Falha</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variáveis/Erro</TableHead>
              </TableRow>
            </TableHeader>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <TableShimmer cols={5} rows={5} />
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    Nenhuma mensagem encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(msg.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {msg.phone}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                      {msg.template}
                    </TableCell>
                    <TableCell>
                      <Badge variant={msg.status === 'SENT' ? 'success' : 'danger'}>
                        {msg.status === 'SENT' ? 'Enviado' : 'Falha'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate" title={msg.error || JSON.stringify(msg.variables)}>
                      {msg.status === 'FAILED' ? msg.error : JSON.stringify(msg.variables)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Página {page} de {totalPages} ({total} registros)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <NewMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          mutate();
        }}
      />
    </div>
  );
}

function NewMessageModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState('payment_reminder');
  const [var1, setVar1] = useState(''); // simplified, most templates have 1 or 2 vars

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          template,
          variables: { '1': var1 }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Mensagem enviada com sucesso!');
      onSuccess();
      setPhone('');
      setVar1('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-bold mb-4">Enviar Mensagem Rápida</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telefone (com DDD)</label>
            <Input
              required
              placeholder="Ex: 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <select
              required
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="payment_reminder">Lembrete de Pagamento</option>
              <option value="service_order_completed">OS Concluída</option>
              <option value="warranty_expiring">Garantia Expirando</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Variável 1 (Nome do Cliente, etc)</label>
            <Input
              required
              placeholder="Valor da variável do template..."
              value={var1}
              onChange={(e) => setVar1(e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">Preencha com o nome ou número do documento, conforme esperado pelo template da Meta.</p>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
