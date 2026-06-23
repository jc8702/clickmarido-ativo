'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/Modal';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

interface Invoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  status: 'rascunho' | 'emitida' | 'cancelada' | 'paga';
  customer: {
    name: string;
  };
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
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Estados para baixa e detalhes
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('pix');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(selectedInvoice !== null && !isPayOpen, () => setSelectedInvoice(null));
  useEscapeToClose(isPayOpen, () => setIsPayOpen(false));

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.data);
    } catch (err) {
      console.error('Erro ao listar invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        quotationId,
        dueDate: dueDate || undefined,
      });
      setIsCreateOpen(false);
      setQuotationId('');
      setDueDate('');
      fetchInvoices();
    } catch (err) {
      alert('Erro ao criar invoice. Verifique se o Orçamento existe e já não possui fatura.');
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPayLoading(true);
    try {
      await api.post(`/invoices/${selectedInvoice.id}/pay`, {
        method: payMethod,
        paidAt: payDate || undefined,
        notes: payNotes,
      });
      setIsPayOpen(false);
      setSelectedInvoice(null);
      setPayNotes('');
      setPayDate('');
      fetchInvoices();
    } catch (err) {
      alert('Erro ao dar baixa na fatura.');
    } finally {
      setPayLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Faturamento (Invoices)</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Controle de faturas e emissão fiscal</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Nova Fatura
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
        ) : invoices.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhuma fatura registrada</div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Número</TableHeader>
                  <TableHeader>Cliente</TableHeader>
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
                    <TableCell className="font-semibold text-neutral-800 dark:text-neutral-200">
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
          </Card>
        )}
      </main>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Fatura">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              ID do Orçamento (Quotation ID)
            </label>
            <input
              type="text"
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="Ex: cj..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Fatura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes da Fatura */}
      <Modal isOpen={selectedInvoice !== null && !isPayOpen} onClose={() => setSelectedInvoice(null)} title={`Detalhes da Fatura #${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <div className="space-y-6 text-neutral-800 dark:text-neutral-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Cliente</span>
                <strong className="text-sm font-semibold">{selectedInvoice.customer?.name}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Vencimento</span>
                <strong className="text-sm font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Valor Total</span>
                <strong className="text-sm font-extrabold text-neutral-900 dark:text-white">{formatCurrency(selectedInvoice.totalAmount)}</strong>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block font-bold uppercase">Status</span>
                <div>
                  <Badge variant={statusBadgeVariant[selectedInvoice.status] || 'neutral'} size="sm">
                    {statusLabels[selectedInvoice.status] || selectedInvoice.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Fechar
              </Button>
              {selectedInvoice.status !== 'paga' && selectedInvoice.status !== 'cancelada' && (
                <Button onClick={() => setIsPayOpen(true)}>
                  Baixar Fatura (Pago)
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Baixa de Fatura */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Baixar Fatura como Paga">
        <form onSubmit={handlePayInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Método de Recebimento
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão de Crédito/Débito</option>
              <option value="boleto">Boleto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data do Pagamento
            </label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Observações
            </label>
            <textarea
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              rows={3}
              placeholder="Ex: Recebido via PIX manual"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
              Voltar
            </Button>
            <Button type="submit" isLoading={payLoading}>
              Confirmar Recebimento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
