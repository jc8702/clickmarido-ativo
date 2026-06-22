'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/Modal';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  status: 'pendente' | 'paga' | 'cancelada';
  expenseDate: string;
}

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pendente: 'warning',
  paga: 'success',
  cancelada: 'danger',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export default function ExpensesPage() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('MATERIAL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.data);
    } catch (err) {
      console.error('Erro ao listar despesas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        category,
        description,
        amount: Number(amount),
        expenseDate: expenseDate || undefined,
        notes,
      });
      setIsCreateOpen(false);
      setDescription('');
      setAmount('');
      setExpenseDate('');
      setNotes('');
      fetchExpenses();
    } catch (err) {
      alert('Erro ao registrar despesa.');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.post(`/expenses/${id}/mark-paid`, {
        paidAt: new Date().toISOString(),
      });
      fetchExpenses();
    } catch (err) {
      alert('Erro ao marcar despesa como paga.');
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
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Controle de Despesas</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Controle de gastos operacionais e pagamentos a fornecedores</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Nova Despesa
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
        ) : expenses.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhuma despesa registrada</div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Descrição</TableHeader>
                  <TableHeader>Categoria</TableHeader>
                  <TableHeader>Valor</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <TableCell className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {new Date(exp.expenseDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-semibold text-neutral-850 dark:text-neutral-100">
                      {exp.description}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">{exp.category}</span>
                    </TableCell>
                    <TableCell className="font-bold text-neutral-800 dark:text-neutral-200">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[exp.status] || 'neutral'} size="sm">
                        {statusLabels[exp.status] || exp.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {exp.status === 'pendente' ? (
                        <Button variant="outline" size="sm" onClick={() => handleMarkPaid(exp.id)}>
                          Marcar Paga
                        </Button>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </main>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Despesa">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              <option value="MATERIAL">Material</option>
              <option value="SERVICO">Serviço</option>
              <option value="TRANSPORTE">Transporte</option>
              <option value="ALUGUEL">Aluguel</option>
              <option value="UTILITIES">Contas de Consumo (Luz, Água, etc)</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="Ex: Compra de conexões PVC"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data da Despesa
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Despesa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
