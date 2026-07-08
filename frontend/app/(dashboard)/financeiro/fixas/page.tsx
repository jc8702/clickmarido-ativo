'use client';

import { useState } from 'react';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

const FREQUENCIES = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
];

export default function FixasPage() {
  const { data, isLoading, createExpense, updateExpense, deleteExpense, toggleExpense } = useRecurringExpenses();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    frequency: 'MENSAL',
    customFrequency: 30,
    dayOfMonth: 1,
    startDate: '',
    endDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, form);
        toast.success('Despesa fixa atualizada!');
      } else {
        await createExpense({ ...form, nextDue: form.startDate });
        toast.success('Despesa fixa criada!');
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar despesa fixa');
    }
  };

  const resetForm = () => {
    setForm({
      description: '',
      amount: 0,
      frequency: 'MENSAL',
      customFrequency: 30,
      dayOfMonth: 1,
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount,
      frequency: expense.frequency,
      customFrequency: expense.customFrequency || 30,
      dayOfMonth: expense.dayOfMonth || 1,
      startDate: expense.startDate?.split('T')[0] || '',
      endDate: expense.endDate?.split('T')[0] || '',
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa fixa?')) return;
    try {
      await deleteExpense(id);
      toast.success('Despesa fixa excluída!');
    } catch (error) {
      toast.error('Erro ao excluir despesa fixa');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleExpense(id);
      toast.success('Status alterado!');
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Despesas Fixas</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Recorrências e previsões</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); resetForm(); setShowModal(true); }}>
          Nova Despesa Fixa
        </Button>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <p className="text-sm opacity-80">Total Mensal Estimado</p>
        <p className="text-3xl font-bold">{formatCurrency(data.monthlyTotal)}</p>
        <p className="text-sm opacity-80 mt-1">{data.data.filter(e => e.isActive).length} despesas ativas</p>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Descrição</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Frequência</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Valor</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Próximo Vencimento</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Carregando...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nenhuma despesa fixa cadastrada</td></tr>
            ) : (
              data.data.map((expense) => (
                <tr key={expense.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-4">
                    <p className="font-medium text-neutral-900 dark:text-white">{expense.description}</p>
                  </td>
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {FREQUENCIES.find(f => f.value === expense.frequency)?.label}
                  </td>
                  <td className="p-4 text-right font-medium text-neutral-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {expense.nextDue ? new Date(expense.nextDue).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggle(expense.id)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        expense.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {expense.isActive ? 'Ativa' : 'Pausada'}
                    </button>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExpense(null); }}
        title={editingExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              placeholder="Ex: Aluguel, Internet, Energia..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Frequência</label>
              <select
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              >
                {FREQUENCIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data Início</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data Fim (opcional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              />
            </div>
          </div>
          {form.frequency === 'PERSONALIZADO' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Intervalo (dias)</label>
              <input
                type="number"
                value={form.customFrequency}
                onChange={e => setForm({ ...form, customFrequency: parseInt(e.target.value) || 30 })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingExpense(null); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingExpense ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
