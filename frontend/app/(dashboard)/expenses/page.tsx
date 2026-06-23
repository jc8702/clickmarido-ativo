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
  costCenter?: string;
  description: string;
  amount: number;
  status: 'pendente' | 'paga' | 'cancelada';
  expenseDate: string;
  notes?: string;
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

import { EXPENSE_CATEGORIES, COST_CENTERS, getCategoryLabel, getCostCenterLabel } from '@/lib/finance-options';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

export default function ExpensesPage() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('MATERIAL');
  const [costCenter, setCostCenter] = useState('OPERACIONAL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');

  // Edit states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editCostCenter, setEditCostCenter] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Integrar ESC no fechamento
  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(isEditOpen, () => setIsEditOpen(false));

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
        costCenter,
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
      setCostCenter('OPERACIONAL');
      fetchExpenses();
    } catch (err) {
      alert('Erro ao registrar despesa.');
    }
  };

  const handleEditClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setEditCategory(exp.category);
    setEditCostCenter(exp.costCenter || 'OPERACIONAL');
    setEditDescription(exp.description);
    setEditAmount(String(exp.amount));
    setEditExpenseDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : '');
    setEditNotes(exp.notes || '');
    setIsEditOpen(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        category: editCategory,
        costCenter: editCostCenter,
        description: editDescription,
        amount: Number(editAmount),
        expenseDate: editExpenseDate || undefined,
        notes: editNotes,
      });
      setIsEditOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err) {
      alert('Erro ao atualizar despesa.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa definitivamente?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert('Erro ao excluir despesa.');
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
                  <TableHeader>Centro de Custo</TableHeader>
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
                    <TableCell className="font-semibold text-neutral-855 dark:text-neutral-100">
                      {exp.description}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">
                        {getCategoryLabel(exp.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">
                        {getCostCenterLabel(exp.costCenter || '')}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-neutral-850 dark:text-neutral-200">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[exp.status] || 'neutral'} size="sm">
                        {statusLabels[exp.status] || exp.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {exp.status === 'pendente' && (
                          <Button variant="outline" size="xs" onClick={() => handleMarkPaid(exp.id)}>
                            Marcar Paga
                          </Button>
                        )}
                        <Button variant="outline" size="xs" onClick={() => handleEditClick(exp)}>
                          Editar
                        </Button>
                        <Button variant="danger" size="xs" onClick={() => handleDeleteExpense(exp.id)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </main>

      {/* Modal Criar Despesa */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Despesa">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              >
                {EXPENSE_CATEGORIES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Centro de Custo
              </label>
              <select
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              >
                {COST_CENTERS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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

      {/* Modal Editar Despesa */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Despesa">
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Categoria
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              >
                {EXPENSE_CATEGORIES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Centro de Custo
              </label>
              <select
                value={editCostCenter}
                onChange={(e) => setEditCostCenter(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              >
                {COST_CENTERS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Data da Despesa
            </label>
            <input
              type="date"
              value={editExpenseDate}
              onChange={(e) => setEditExpenseDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Observações
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Atualizar Despesa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
