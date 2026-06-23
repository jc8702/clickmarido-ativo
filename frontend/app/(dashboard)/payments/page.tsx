'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [pixModalId, setPixModalId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEscapeToClose(pixModalId !== null, () => setPixModalId(null));
  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data.data);
    } catch (err) {
      console.error('Erro ao listar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/approve`);
      fetchPayments();
    } catch (err) {
      alert('Erro ao marcar como pago.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Pagamentos</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Acompanhamento e faturamento dos serviços realizados</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Registrar Recebimento Manual
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400 animate-fade-in">Carregando...</div>
        ) : payments.length === 0 ? (
          <Card gradient="none" shadow="md">
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhum pagamento registrado</div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>ID Pagamento</TableHeader>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader>OS (Ref)</TableHeader>
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
                    <TableCell>
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
                    <TableCell className="font-bold text-neutral-800 dark:text-neutral-200">
                      {row.amount ? `R$ ${Number(row.amount).toFixed(2)}` : 'R$ 0,00'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[row.status] || 'neutral'} size="sm" className="shadow-sm">
                        {statusLabels[row.status] || row.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {row.status === 'pendente' ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setPixModalId(row.id)}>
                              Gerar PIX
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleApprove(row.id)}>
                              Marcar Pago
                            </Button>
                          </>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500 text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
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
    </div>
  );
}
