'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { formatCurrency } from '@/lib/format';

interface Invoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  issRate: number | null;
  description: string | null;
  notes: string | null;
  status: 'rascunho' | 'emitida' | 'cancelada' | 'paga';
  customer: { id: string; name: string; email: string };
  quotation?: { id: string; total: number };
  payments?: { id: string; amount: number; status: string }[];
}

interface QuotationOption {
  id: string;
  number: string | null;
  total: number;
  customer: { name: string };
  status: string;
}

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  rascunho: 'warning',
  emitida: 'primary',
  cancelada: 'danger',
  paga: 'success',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  emitida: 'Emitida',
  cancelada: 'Cancelada',
  paga: 'Paga',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailData, setDetailData] = useState<Invoice | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Issue (emitir) confirmation
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Pay modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('pix');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDueDate, setEditDueDate] = useState('');
  const [editIssRate, setEditIssRate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Cancel confirmation
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(selectedInvoice !== null && !isPayOpen && !isEditOpen && !isCancelOpen && !isIssueOpen, () => { setSelectedInvoice(null); setDetailData(null); });
  useEscapeToClose(isPayOpen, () => setIsPayOpen(false));
  useEscapeToClose(isEditOpen, () => setIsEditOpen(false));
  useEscapeToClose(isCancelOpen, () => setIsCancelOpen(false));
  useEscapeToClose(isIssueOpen, () => setIsIssueOpen(false));

  const fetchInvoices = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/invoices', { params: { page: p, limit: 20 } });
      setInvoices(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar faturas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const res = await api.get('/quotations', { params: { status: 'aceito', limit: 100 } });
      setQuotations(res.data.data || res.data || []);
    } catch {
      setQuotations([]);
    } finally {
      setLoadingQuotations(false);
    }
  };

  const fetchInvoiceDetail = async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await api.get(`/invoices/${id}`);
      setDetailData(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar detalhes da fatura.';
      setDetailError(msg);
      setDetailData(selectedInvoice);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
    setPage(1);
  }, []);

  useEffect(() => {
    if (isCreateOpen) fetchQuotations();
  }, [isCreateOpen]);

  useEffect(() => {
    if (selectedInvoice) fetchInvoiceDetail(selectedInvoice.id);
  }, [selectedInvoice]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/invoices', {
        quotationId,
        dueDate: dueDate || undefined,
      });
      setIsCreateOpen(false);
      setQuotationId('');
      setDueDate('');
      fetchInvoices(1);
      setPage(1);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar fatura.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!selectedInvoice) return;
    setIssueLoading(true);
    setIssueError('');
    try {
      await api.put(`/invoices/${selectedInvoice.id}`, { status: 'emitida' });
      setIsIssueOpen(false);
      setSelectedInvoice(null);
      setDetailData(null);
      fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao emitir fatura.';
      setIssueError(msg);
    } finally {
      setIssueLoading(false);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPayLoading(true);
    setPayError('');
    try {
      await api.post(`/invoices/${selectedInvoice.id}/pay`, {
        method: payMethod,
        paidAt: payDate || undefined,
        notes: payNotes,
      });
      setIsPayOpen(false);
      setSelectedInvoice(null);
      setDetailData(null);
      setPayNotes('');
      setPayDate('');
      fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao dar baixa na fatura.';
      setPayError(msg);
    } finally {
      setPayLoading(false);
    }
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/invoices/${selectedInvoice.id}`, {
        dueDate: editDueDate || undefined,
        issRate: editIssRate !== '' ? Number(editIssRate) : undefined,
        description: editDescription || undefined,
        notes: editNotes !== undefined ? editNotes : undefined,
      });
      setIsEditOpen(false);
      setSelectedInvoice(null);
      setDetailData(null);
      fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao editar fatura.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await api.delete(`/invoices/${selectedInvoice.id}`);
      setIsCancelOpen(false);
      setSelectedInvoice(null);
      setDetailData(null);
      fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao cancelar fatura.';
      setCancelError(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const openEditModal = () => {
    if (!detailData) return;
    setEditDueDate(detailData.dueDate ? detailData.dueDate.split('T')[0] : '');
    setEditIssRate(detailData.issRate != null ? String(detailData.issRate) : '5');
    setEditDescription(detailData.description || '');
    setEditNotes(detailData.notes || '');
    setEditError('');
    setIsEditOpen(true);
  };

  const canEdit = detailData?.status === 'rascunho';
  const canIssue = detailData?.status === 'rascunho';
  const canCancel = detailData && detailData.status !== 'paga' && detailData.status !== 'cancelada';
  const canPay = detailData && detailData.status !== 'paga' && detailData.status !== 'cancelada';

  const verifyTotalConsistency = (inv: Invoice): boolean => {
    const expectedTax = Number(inv.subtotal) * ((inv.issRate ?? 5) / 100);
    const taxDiff = Math.abs(Number(inv.taxAmount) - expectedTax);
    const totalDiff = Math.abs(Number(inv.totalAmount) - (Number(inv.subtotal) + Number(inv.taxAmount)));
    return taxDiff < 0.01 && totalDiff < 0.01;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Faturamento</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Controle de faturas e emissão fiscal</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Nova Fatura
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
        ) : error ? (
          <Card>
            <div className="text-center py-12 space-y-3">
              <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
              <Button onClick={() => fetchInvoices(1)} variant="outline" size="sm">Tentar Novamente</Button>
            </div>
          </Card>
        ) : invoices.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhuma fatura registrada</div>
          </Card>
        ) : (
          <>
            <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Número</TableHeader>
                      <TableHeader className="hidden sm:table-cell">Cliente</TableHeader>
                      <TableHeader>Vencimento</TableHeader>
                      <TableHeader>Valor Total</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {invoices.map((inv) => (
                      <TableRow
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-bold text-neutral-900 dark:text-neutral-100">
                          #{inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-semibold text-neutral-800 dark:text-neutral-200">
                          {inv.customer?.name}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400 text-sm">
                          {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-bold text-neutral-800 dark:text-neutral-200">
                          {formatCurrency(inv.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[inv.status] || 'neutral'} size="sm">
                            {statusLabels[inv.status] || inv.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 px-1">
                <span className="text-xs text-neutral-500">Página {page} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchInvoices(page - 1); }}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchInvoices(page + 1); }}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Criar Fatura */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Fatura">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {createError}
            </div>
          )}
          <div>
            <label htmlFor="invoice-quotation" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Orçamento *
            </label>
            {loadingQuotations ? (
              <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-xl" />
            ) : quotations.length === 0 ? (
              <p className="text-sm text-neutral-500 py-2">Nenhum orçamento aceito disponível para faturar.</p>
            ) : (
              <select
                id="invoice-quotation"
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                required
                aria-label="Selecione um orçamento"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm"
              >
                <option value="">Selecione um orçamento...</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number || q.id.slice(-6).toUpperCase()} — {q.customer?.name} — {formatCurrency(Number(q.total))}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="invoice-dueDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data de Vencimento
            </label>
            <input
              id="invoice-dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createLoading} disabled={loadingQuotations || quotations.length === 0}>
              Criar Fatura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes da Fatura */}
      <Modal isOpen={selectedInvoice !== null && !isPayOpen && !isEditOpen && !isCancelOpen && !isIssueOpen} onClose={() => { setSelectedInvoice(null); setDetailData(null); }} title={`Fatura #${selectedInvoice?.invoiceNumber}`}>
        {loadingDetail ? (
          <div className="text-center py-8 text-neutral-500">Carregando detalhes...</div>
        ) : detailError ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{detailError}</p>
            <Button onClick={() => selectedInvoice && fetchInvoiceDetail(selectedInvoice.id)} variant="outline" size="sm">
              Tentar Novamente
            </Button>
          </div>
        ) : detailData ? (
          <div className="space-y-5 text-neutral-800 dark:text-neutral-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Cliente</span>
                <strong className="text-sm">{detailData.customer?.name}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Vencimento</span>
                <strong className="text-sm">{new Date(detailData.dueDate).toLocaleDateString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Subtotal</span>
                <span className="text-sm">{formatCurrency(Number(detailData.subtotal))}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">ISS ({detailData.issRate ?? 5}%)</span>
                <span className="text-sm">{formatCurrency(Number(detailData.taxAmount))}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-neutral-500 block font-bold uppercase">Valor Total</span>
                <strong className="text-lg font-extrabold text-neutral-900 dark:text-white">{formatCurrency(Number(detailData.totalAmount))}</strong>
                {!verifyTotalConsistency(detailData) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Atenção: Valores podem estar inconsistentes. Verifique subtotal e impostos.
                  </p>
                )}
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Status</span>
                <Badge variant={statusBadgeVariant[detailData.status] || 'neutral'} size="sm">
                  {statusLabels[detailData.status] || detailData.status.toUpperCase()}
                </Badge>
              </div>
              {detailData.description && (
                <div className="col-span-2">
                  <span className="text-xs text-neutral-500 block font-bold uppercase">Descrição</span>
                  <span className="text-sm">{detailData.description}</span>
                </div>
              )}
              {detailData.notes && (
                <div className="col-span-2">
                  <span className="text-xs text-neutral-500 block font-bold uppercase">Observações</span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{detailData.notes}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <Button variant="outline" onClick={() => { setSelectedInvoice(null); setDetailData(null); }}>
                Fechar
              </Button>
              {canIssue && (
                <Button onClick={() => setIsIssueOpen(true)}>
                  Emitir Fatura
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" onClick={openEditModal}>
                  Editar
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" onClick={() => setIsCancelOpen(true)}>
                  Cancelar Fatura
                </Button>
              )}
              {canPay && (
                <Button onClick={() => setIsPayOpen(true)}>
                  Baixar como Paga
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">Nenhum dado disponível</div>
        )}
      </Modal>

      {/* Modal Emitir Fatura */}
      <Modal isOpen={isIssueOpen} onClose={() => setIsIssueOpen(false)} title="Emitir Fatura">
        <div className="space-y-4">
          {issueError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {issueError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Deseja emitir a fatura <strong>#{selectedInvoice?.invoiceNumber}</strong> no valor de <strong>{selectedInvoice ? formatCurrency(selectedInvoice.totalAmount) : ''}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            A fatura mudará de "Rascunho" para "Emitida". Após a emissão, ela poderá ser baixada como paga ou cancelada.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsIssueOpen(false)}>Cancelar</Button>
            <Button onClick={handleIssueInvoice} isLoading={issueLoading}>Sim, Emitir</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Fatura */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Fatura">
        <form onSubmit={handleEditInvoice} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {editError}
            </div>
          )}
          <div>
            <label htmlFor="edit-dueDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Data de Vencimento</label>
            <input id="edit-dueDate" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="edit-issRate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Alíquota ISS (%)</label>
            <input id="edit-issRate" type="number" step="0.1" min="0" max="100" value={editIssRate} onChange={(e) => setEditIssRate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Descrição</label>
            <input id="edit-description" type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Observações</label>
            <textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={editLoading}>Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Cancelamento */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Cancelar Fatura">
        <div className="space-y-4">
          {cancelError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {cancelError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Tem certeza que deseja cancelar a fatura <strong>#{selectedInvoice?.invoiceNumber}</strong> no valor de <strong>{selectedInvoice ? formatCurrency(selectedInvoice.totalAmount) : ''}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            Esta ação irá alterar o status para "Cancelada" e reverter o orçamento vinculado para "Enviada". Faturas canceladas não podem ser reativadas.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Voltar</Button>
            <Button variant="danger" onClick={handleCancelInvoice} isLoading={cancelLoading}>
              Sim, Cancelar Fatura
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Baixa de Fatura */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Baixar Fatura como Paga">
        <form onSubmit={handlePayInvoice} className="space-y-4">
          {payError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {payError}
            </div>
          )}
          <div>
            <label htmlFor="pay-method" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Método de Recebimento *
            </label>
            <select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
              aria-label="Método de recebimento"
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white">
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão de Crédito/Débito</option>
              <option value="boleto">Boleto</option>
            </select>
          </div>
          <div>
            <label htmlFor="pay-date" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data do Pagamento
            </label>
            <input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="pay-notes" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Observações
            </label>
            <textarea id="pay-notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="Ex: Recebido via PIX manual" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>Voltar</Button>
            <Button type="submit" isLoading={payLoading}>Confirmar Recebimento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
