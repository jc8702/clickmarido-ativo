'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import PaymentForm from '../../../components/PaymentForm';
import CreatePaymentForm from '../../../components/CreatePaymentForm';
import { useAuth } from '@/hooks/useAuth';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

interface Payment {
  id: string;
  quotationId?: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  status: 'pendente' | 'aprovado' | 'confirmado';
  method?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
  customer?: { name: string; phone?: string; email?: string };
  quotation?: {
    id: string;
    number?: string;
    total?: number;
    status?: string;
    notes?: string;
    serviceOrder?: {
      id: string;
      number: string;
      status?: string;
      scheduledTime?: string;
      address?: string;
      finalTotal?: number;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber?: string;
    totalAmount?: number;
    status?: string;
    dueDate?: string;
  };
}

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pendente: 'warning',
  aprovado: 'success',
  confirmado: 'success',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Pago',
  confirmado: 'Pago',
};

const osStatusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const osStatusVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  agendada: 'primary',
  em_andamento: 'warning',
  concluida: 'success',
  cancelada: 'danger',
};

const quotationStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceito: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
};

const quotationStatusVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  rascunho: 'neutral',
  enviada: 'primary',
  aceito: 'success',
  recusada: 'danger',
  expirada: 'warning',
};

export default function PaymentsPage() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pixModalId, setPixModalId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Approve confirmation
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Payment | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Detail modals
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);
  const [osData, setOsData] = useState<{ id: string; number: string; status?: string; scheduledTime?: string; address?: string; finalTotal?: number } | null>(null);
  const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false);
  const [propostaData, setPropostaData] = useState<{ id: string; number?: string; total?: number; status?: string; notes?: string } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ id: string; invoiceNumber?: string; totalAmount?: number; status?: string; dueDate?: string } | null>(null);

  useEscapeToClose(pixModalId !== null, () => setPixModalId(null));
  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(isApproveOpen, () => setIsApproveOpen(false));
  useEscapeToClose(isDeleteOpen, () => setIsDeleteOpen(false));
  useEscapeToClose(isOsModalOpen, () => setIsOsModalOpen(false));
  useEscapeToClose(isPropostaModalOpen, () => setIsPropostaModalOpen(false));
  useEscapeToClose(isInvoiceModalOpen, () => setIsInvoiceModalOpen(false));

  const fetchPayments = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/payments', { params: { page: p, limit: 20 } });
      setPayments(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar pagamentos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
    setPage(1);
  }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    setApproveError('');
    try {
      await api.patch(`/payments/${approveTarget.id}/approve`);
      setIsApproveOpen(false);
      setApproveTarget(null);
      fetchPayments();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao marcar como pago.';
      setApproveError(msg);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/payments/${deleteTarget.id}`);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchPayments();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao excluir pagamento.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const openOsModal = (payment: Payment) => {
    if (payment.quotation?.serviceOrder) {
      setOsData(payment.quotation.serviceOrder);
      setIsOsModalOpen(true);
    }
  };

  const openPropostaModal = (payment: Payment) => {
    if (payment.quotation) {
      setPropostaData(payment.quotation);
      setIsPropostaModalOpen(true);
    }
  };

  const openInvoiceModal = (payment: Payment) => {
    if (payment.invoice) {
      setInvoiceData(payment.invoice);
      setIsInvoiceModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Pagamentos</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Acompanhamento e faturamento dos serviços realizados</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Registrar Recebimento Manual
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
        ) : error ? (
          <Card>
            <div className="text-center py-12 space-y-3">
              <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
              <Button onClick={() => fetchPayments(1)} variant="outline" size="sm">Tentar Novamente</Button>
            </div>
          </Card>
        ) : payments.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhum pagamento registrado</div>
          </Card>
        ) : (
          <>
            <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Cliente</TableHeader>
                      <TableHeader className="hidden md:table-cell">OS</TableHeader>
                      <TableHeader className="hidden lg:table-cell">Proposta</TableHeader>
                      <TableHeader className="hidden sm:table-cell">Financeiro</TableHeader>
                      <TableHeader>Valor (R$)</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Ações</TableHeader>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {payments.map((row) => (
                      <TableRow key={row.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                        <TableCell className="font-medium font-mono text-xs text-neutral-500 dark:text-neutral-400">
                          {row.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/customers?id=${row.customerId}`}
                            className="font-semibold text-neutral-800 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                          >
                            {row.customer?.name || 'Cliente Avulso'}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {row.quotation?.serviceOrder ? (
                            <button
                              onClick={() => openOsModal(row)}
                              className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline bg-neutral-100/80 dark:bg-neutral-700/80 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                            >
                              {row.quotation.serviceOrder.number}
                            </button>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">Sem OS</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {row.quotation ? (
                            <button
                              onClick={() => openPropostaModal(row)}
                              className="font-mono text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline bg-neutral-100/80 dark:bg-neutral-700/80 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                            >
                              {row.quotation.number || row.quotation.id.slice(-6).toUpperCase()}
                            </button>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">Manual/Avulso</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {row.invoice ? (
                            <button
                              onClick={() => openInvoiceModal(row)}
                              className="font-mono text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline bg-neutral-100/80 dark:bg-neutral-700/80 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                            >
                              #{row.invoice.invoiceNumber || row.invoice.id.slice(-6).toUpperCase()}
                            </button>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {formatCurrency(row.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[row.status] || 'neutral'} size="sm">
                            {statusLabels[row.status] || row.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {row.status === 'pendente' && (
                              <>
                                <Button variant="outline" size="xs" onClick={() => setPixModalId(row.id)}>
                                  PIX
                                </Button>
                                <Button variant="secondary" size="xs" onClick={() => { setApproveTarget(row); setIsApproveOpen(true); setApproveError(''); }}>
                                  Pagar
                                </Button>
                              </>
                            )}
                            <Button variant="danger" size="xs" onClick={() => { setDeleteTarget(row); setIsDeleteOpen(true); setDeleteError(''); }}>
                              Excluir
                            </Button>
                          </div>
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchPayments(page - 1); }}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchPayments(page + 1); }}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal PIX */}
      <Modal isOpen={pixModalId !== null} onClose={() => setPixModalId(null)} title="Cobrança PIX">
        {pixModalId && (
          <PaymentForm paymentId={pixModalId} onClose={() => setPixModalId(null)} />
        )}
      </Modal>

      {/* Modal Criar Pagamento */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Registrar Recebimento Manual">
        <CreatePaymentForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => { setIsCreateOpen(false); fetchPayments(); }}
        />
      </Modal>

      {/* Modal Confirmar Pagamento */}
      <Modal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)} title="Confirmar Recebimento">
        <div className="space-y-4">
          {approveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800">
              {approveError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Confirma o recebimento do pagamento <strong>#{approveTarget?.id.slice(-6).toUpperCase()}</strong> no valor de <strong>{approveTarget ? formatCurrency(approveTarget.amount) : ''}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            O pagamento será marcado como confirmado e uma transação financeira de entrada será criada automaticamente.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove} isLoading={approveLoading}>Sim, Confirmar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Excluir Pagamento */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Excluir Pagamento">
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800">
              {deleteError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Tem certeza que deseja excluir o pagamento <strong>#{deleteTarget?.id.slice(-6).toUpperCase()}</strong> no valor de <strong>{deleteTarget ? formatCurrency(deleteTarget.amount) : ''}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            Esta ação é irreversível. Se o pagamento possui transações financeiras vinculadas, a exclusão será bloqueada.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteLoading}>Sim, Excluir</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes da OS */}
      <Modal isOpen={isOsModalOpen} onClose={() => setIsOsModalOpen(false)} title={`Ordem de Serviço ${osData?.number || ''}`}>
        {osData ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Número</span>
                <strong className="text-sm">{osData.number}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Status</span>
                <Badge variant={osStatusVariant[osData.status || ''] || 'neutral'} size="sm">
                  {osStatusLabels[osData.status || ''] || osData.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Agendamento</span>
                <span className="text-sm">{formatDate(osData.scheduledTime)}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Valor Final</span>
                <strong className="text-sm">{osData.finalTotal ? formatCurrency(Number(osData.finalTotal)) : '—'}</strong>
              </div>
              {osData.address && (
                <div className="col-span-2">
                  <span className="text-xs text-neutral-500 block font-bold uppercase">Endereço</span>
                  <span className="text-sm">{osData.address}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <Button variant="outline" size="sm" onClick={() => setIsOsModalOpen(false)}>Fechar</Button>
              <Link href={`/service-orders?id=${osData.id}`}>
                <Button size="sm">Ver OS Completa</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">Carregando...</div>
        )}
      </Modal>

      {/* Modal Detalhes da Proposta */}
      <Modal isOpen={isPropostaModalOpen} onClose={() => setIsPropostaModalOpen(false)} title={`Proposta ${propostaData?.number || ''}`}>
        {propostaData ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Número</span>
                <strong className="text-sm">{propostaData.number || 'Sem número'}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Status</span>
                <Badge variant={quotationStatusVariant[propostaData.status || ''] || 'neutral'} size="sm">
                  {quotationStatusLabels[propostaData.status || ''] || propostaData.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Valor Total</span>
                <strong className="text-sm">{propostaData.total ? formatCurrency(Number(propostaData.total)) : '—'}</strong>
              </div>
              {propostaData.notes && (
                <div className="col-span-2">
                  <span className="text-xs text-neutral-500 block font-bold uppercase">Observações</span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{propostaData.notes}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <Button variant="outline" size="sm" onClick={() => setIsPropostaModalOpen(false)}>Fechar</Button>
              <Link href={`/quotations?id=${propostaData.id}`}>
                <Button size="sm">Ver Proposta Completa</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">Carregando...</div>
        )}
      </Modal>

      {/* Modal Detalhes do Financeiro */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title={`Fatura #${invoiceData?.invoiceNumber || ''}`}>
        {invoiceData ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Número</span>
                <strong className="text-sm">#{invoiceData.invoiceNumber}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Status</span>
                <Badge variant={invoiceData.status === 'paga' ? 'success' : invoiceData.status === 'cancelada' ? 'danger' : 'primary'} size="sm">
                  {invoiceData.status === 'paga' ? 'Paga' : invoiceData.status === 'cancelada' ? 'Cancelada' : invoiceData.status === 'emitida' ? 'Emitida' : invoiceData.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Valor Total</span>
                <strong className="text-sm">{invoiceData.totalAmount ? formatCurrency(Number(invoiceData.totalAmount)) : '—'}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Vencimento</span>
                <span className="text-sm">{formatDate(invoiceData.dueDate)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>Fechar</Button>
              <Link href={`/invoices?id=${invoiceData.id}`}>
                <Button size="sm">Ver Fatura Completa</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">Carregando...</div>
        )}
      </Modal>
    </div>
  );
}
