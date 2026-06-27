'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { EXPENSE_CATEGORIES, COST_CENTERS, getCategoryLabel, getCostCenterLabel } from '@/lib/finance-options';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { formatCurrency } from '@/lib/format';

interface Expense {
  id: string;
  category: string;
  costCenter?: string;
  description: string;
  amount: number;
  status: 'pendente' | 'paga' | 'cancelada';
  expenseDate: string;
  dueDate?: string;
  vendorName?: string;
  documentType?: string;
  documentNumber?: string;
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState('MATERIAL');
  const [costCenter, setCostCenter] = useState('OPERACIONAL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editCostCenter, setEditCostCenter] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('');
  const [editDocumentNumber, setEditDocumentNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Mark paid
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEscapeToClose(isCreateOpen, () => setIsCreateOpen(false));
  useEscapeToClose(isEditOpen, () => setIsEditOpen(false));
  useEscapeToClose(isDeleteOpen, () => setIsDeleteOpen(false));
  useEscapeToClose(isPayOpen, () => setIsPayOpen(false));

  const fetchExpenses = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses', { params: { page: p, limit: 20 } });
      setExpenses(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar despesas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(1);
    setPage(1);
  }, []);

  const resetCreateForm = () => {
    setCategory('MATERIAL');
    setCostCenter('OPERACIONAL');
    setDescription('');
    setAmount('');
    setExpenseDate('');
    setDueDate('');
    setVendorName('');
    setDocumentType('');
    setDocumentNumber('');
    setNotes('');
    setCreateError('');
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/expenses', {
        category,
        costCenter,
        description,
        amount: Number(amount),
        expenseDate: expenseDate || undefined,
        dueDate: dueDate || undefined,
        vendorName: vendorName || undefined,
        documentType: documentType || undefined,
        documentNumber: documentNumber || undefined,
        notes,
      });
      setIsCreateOpen(false);
      resetCreateForm();
      fetchExpenses(1);
      setPage(1);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao registrar despesa.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setEditCategory(exp.category);
    setEditCostCenter(exp.costCenter || 'OPERACIONAL');
    setEditDescription(exp.description);
    setEditAmount(String(exp.amount));
    setEditExpenseDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : '');
    setEditDueDate(exp.dueDate ? exp.dueDate.split('T')[0] : '');
    setEditVendorName(exp.vendorName || '');
    setEditDocumentType(exp.documentType || '');
    setEditDocumentNumber(exp.documentNumber || '');
    setEditNotes(exp.notes || '');
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        category: editCategory,
        costCenter: editCostCenter,
        description: editDescription,
        amount: Number(editAmount),
        expenseDate: editExpenseDate || undefined,
        dueDate: editDueDate || undefined,
        vendorName: editVendorName || undefined,
        documentType: editDocumentType || undefined,
        documentNumber: editDocumentNumber || undefined,
        notes: editNotes,
      });
      setIsEditOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao atualizar despesa.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/expenses/${selectedExpense.id}`);
      setIsDeleteOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao excluir despesa.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedExpense) return;
    setPayLoading(true);
    setPayError('');
    try {
      await api.post(`/expenses/${selectedExpense.id}/mark-paid`);
      setIsPayOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao marcar despesa como paga.';
      setPayError(msg);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Controle de Despesas</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Controle de gastos operacionais e pagamentos a fornecedores</p>
          </div>
          <Button onClick={() => { resetCreateForm(); setIsCreateOpen(true); }} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Nova Despesa
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
        ) : error ? (
          <Card>
            <div className="text-center py-12 space-y-3">
              <p className="text-red-600 dark:text-red-400 font-semibold text-sm" role="alert">{error}</p>
              <Button onClick={() => fetchExpenses(1)} variant="outline" size="sm">Tentar Novamente</Button>
            </div>
          </Card>
        ) : expenses.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhuma despesa registrada</div>
          </Card>
        ) : (
          <>
            <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Data</TableHeader>
                      <TableHeader className="hidden sm:table-cell">Descrição</TableHeader>
                      <TableHeader className="hidden md:table-cell">Categoria</TableHeader>
                      <TableHeader>Valor</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Ações</TableHeader>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
                        <TableCell className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-nowrap">
                          {new Date(exp.expenseDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-semibold text-neutral-800 dark:text-neutral-100">
                          {exp.description}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">
                            {getCategoryLabel(exp.category)}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[exp.status] || 'neutral'} size="sm">
                            {statusLabels[exp.status] || exp.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {exp.status === 'pendente' && (
                              <Button variant="outline" size="xs" onClick={() => { setSelectedExpense(exp); setIsPayOpen(true); setPayError(''); }}>
                                Pagar
                              </Button>
                            )}
                            <Button variant="outline" size="xs" onClick={() => openEditModal(exp)}>
                              Editar
                            </Button>
                            <Button variant="danger" size="xs" onClick={() => { setSelectedExpense(exp); setIsDeleteOpen(true); setDeleteError(''); }}>
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchExpenses(page - 1); }}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchExpenses(page + 1); }}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Criar Despesa */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Despesa">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-category" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Categoria *</label>
              <select id="exp-category" value={category} onChange={(e) => setCategory(e.target.value)}
                aria-label="Categoria da despesa"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                {EXPENSE_CATEGORIES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exp-costCenter" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Centro de Custo</label>
              <select id="exp-costCenter" value={costCenter} onChange={(e) => setCostCenter(e.target.value)}
                aria-label="Centro de custo"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                {COST_CENTERS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="exp-description" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Descrição *</label>
            <input id="exp-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm"
              placeholder="Ex: Compra de conexões PVC" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-amount" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Valor (R$) *</label>
              <input id="exp-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm"
                placeholder="0,00" />
            </div>
            <div>
              <label htmlFor="exp-expenseDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Data da Despesa</label>
              <input id="exp-expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-dueDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Data de Vencimento</label>
              <input id="exp-dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
            <div>
              <label htmlFor="exp-vendorName" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Fornecedor</label>
              <input id="exp-vendorName" type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm"
                placeholder="Nome do fornecedor" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-documentType" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Tipo de Documento</label>
              <select id="exp-documentType" value={documentType} onChange={(e) => setDocumentType(e.target.value)}
                aria-label="Tipo de documento"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                <option value="">Nenhum</option>
                <option value="NOTA_FISCAL">Nota Fiscal</option>
                <option value="RECIBO">Recibo</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label htmlFor="exp-documentNumber" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Número do Documento</label>
              <input id="exp-documentNumber" type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm"
                placeholder="Ex: NF-12345" />
            </div>
          </div>
          <div>
            <label htmlFor="exp-notes" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Observações</label>
            <textarea id="exp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={createLoading}>Registrar Despesa</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Despesa */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Despesa">
        <form onSubmit={handleUpdateExpense} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {editError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-category" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Categoria *</label>
              <select id="edit-category" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                aria-label="Categoria da despesa"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                {EXPENSE_CATEGORIES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-costCenter" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Centro de Custo</label>
              <select id="edit-costCenter" value={editCostCenter} onChange={(e) => setEditCostCenter(e.target.value)}
                aria-label="Centro de custo"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                {COST_CENTERS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Descrição *</label>
            <input id="edit-description" type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-amount" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Valor (R$) *</label>
              <input id="edit-amount" type="number" step="0.01" min="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
            <div>
              <label htmlFor="edit-expenseDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Data da Despesa</label>
              <input id="edit-expenseDate" type="date" value={editExpenseDate} onChange={(e) => setEditExpenseDate(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-dueDate" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Data de Vencimento</label>
              <input id="edit-dueDate" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
            <div>
              <label htmlFor="edit-vendorName" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Fornecedor</label>
              <input id="edit-vendorName" type="text" value={editVendorName} onChange={(e) => setEditVendorName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-documentType" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Tipo de Documento</label>
              <select id="edit-documentType" value={editDocumentType} onChange={(e) => setEditDocumentType(e.target.value)}
                aria-label="Tipo de documento"
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm">
                <option value="">Nenhum</option>
                <option value="NOTA_FISCAL">Nota Fiscal</option>
                <option value="RECIBO">Recibo</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-documentNumber" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Número do Documento</label>
              <input id="edit-documentNumber" type="text" value={editDocumentNumber} onChange={(e) => setEditDocumentNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Observações</label>
            <textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-white text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={editLoading}>Atualizar Despesa</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Excluir Despesa">
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {deleteError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Tem certeza que deseja excluir a despesa <strong>&ldquo;{selectedExpense?.description}&rdquo;</strong> no valor de <strong>{selectedExpense ? formatCurrency(selectedExpense.amount) : ''}</strong>?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              Esta ação é irreversível.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Se a despesa possui transações financeiras vinculadas (foi marcada como paga), a exclusão será bloqueada. Nesse caso, cancele a despesa ao invés de excluí-la.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Voltar</Button>
            <Button variant="danger" onClick={handleDeleteExpense} isLoading={deleteLoading}>
              Sim, Excluir Despesa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Pagamento */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Marcar como Paga">
        <div className="space-y-4">
          {payError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800" role="alert">
              {payError}
            </div>
          )}
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Confirma o pagamento da despesa <strong>&ldquo;{selectedExpense?.description}&rdquo;</strong> no valor de <strong>{selectedExpense ? formatCurrency(selectedExpense.amount) : ''}</strong>?
          </p>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
              O que acontecerá ao confirmar:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-500 mt-1 space-y-1 list-disc list-inside">
              <li>Status da despesa mudará para &ldquo;Paga&rdquo;</li>
              <li>Uma transação financeira de saída será registrada</li>
              <li>O saldo do dashboard será atualizado</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPayOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarkPaid} isLoading={payLoading}>
              Sim, Confirmar Pagamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
