'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardContent } from '@/components/Card';
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
  customer?: {
    name: string;
    phone?: string;
  };
  quotation?: {
    id: string;
    serviceOrder?: {
      id: string;
    };
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

  useEscapeToClose(pixModalId !== null, () => setPixModalId(null));
  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(isApproveOpen, () => setIsApproveOpen(false));

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
                      <TableHeader>ID Pagamento</TableHeader>
                      <TableHeader>Cliente</TableHeader>
                      <TableHeader className="hidden sm:table-cell">OS (Ref)</TableHeader>
                      <TableHeader>Valor (R$)</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Ações</TableHeader>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {payments.map((row) => (
                      <TableRow key={row.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
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
                        <TableCell className="hidden sm:table-cell">
                          {row.quotationId ? (
                            <Link
                              href={`/quotations?id=${row.quotationId}`}
                              className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline bg-neutral-100/80 dark:bg-neutral-700/80 px-2 py-1 rounded font-bold"
                            >
                              {row.quotationId.slice(-6).toUpperCase()}
                            </Link>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-550 text-xs italic">Manual/Avulso</span>
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
                                  Gerar PIX
                                </Button>
                                <Button variant="secondary" size="xs" onClick={() => { setApproveTarget(row); setIsApproveOpen(true); setApproveError(''); }}>
                                  Marcar Pago
                                </Button>
                              </>
                            )}
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

      <Modal
        isOpen={pixModalId !== null}
        onClose={() => setPixModalId(null)}
        title="Cobrança PIX"
      >
        {pixModalId && (
          <PaymentForm
            paymentId={pixModalId}
            onClose={() => setPixModalId(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Recebimento Manual"
      >
        <CreatePaymentForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchPayments();
          }}
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
            <Button onClick={handleApprove} isLoading={approveLoading}>
              Sim, Confirmar Recebimento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
