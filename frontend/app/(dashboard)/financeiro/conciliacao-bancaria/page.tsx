'use client';

import { useState } from 'react';
import { useBankReconciliation } from '@/hooks/useBankReconciliation';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

export default function ConciliacaoBancariaPage() {
  const [filters, setFilters] = useState({ bankAccountId: '' });
  const { data, isLoading, createReconciliation, reconcile } = useBankReconciliation(filters);
  const { data: bankAccounts } = useBankAccounts();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    bankAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'ENTRADA',
    documentNumber: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReconciliation(form);
      toast.success('Registro criado!');
      setShowModal(false);
      setForm({
        bankAccountId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'ENTRADA',
        documentNumber: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Erro ao criar registro');
    }
  };

  const handleReconcile = async (id: string) => {
    try {
      await reconcile(id);
      toast.success('Registro conciliado!');
    } catch (error) {
      toast.error('Erro ao conciliar');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Conciliação Bancária</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Conciliação de extratos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Novo Registro</Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <select
          value={filters.bankAccountId}
          onChange={e => setFilters({ bankAccountId: e.target.value })}
          className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
        >
          <option value="">Todas as contas</option>
          {bankAccounts.data.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
          ))}
        </select>
      </div>

      {/* Resumo Pendente */}
      {data.pendingSummary.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Pendentes de Conciliação</h3>
          <div className="flex flex-wrap gap-4">
            {data.pendingSummary.map((summary) => (
              <p key={summary.bankAccountId} className="text-sm text-amber-700 dark:text-amber-300">
                {summary._count} registros - {formatCurrency(summary._sum.amount || 0)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Data</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Descrição</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Conta</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Valor</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Tipo</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Carregando...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Nenhum registro encontrado</td></tr>
            ) : (
              data.data.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {new Date(item.transactionDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-neutral-900 dark:text-white">{item.description}</p>
                    {item.documentNumber && (
                      <p className="text-sm text-neutral-500">Doc: {item.documentNumber}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {item.bankAccount?.nickname || item.bankAccount?.bankName}
                  </td>
                  <td className={`p-4 text-right font-medium ${item.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'ENTRADA' ? '+' : '-'}{formatCurrency(item.amount)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.type === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.isReconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.isReconciled ? 'Conciliado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {!item.isReconciled && (
                      <button
                        onClick={() => handleReconcile(item.id)}
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Conciliar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Registro de Conciliação">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Conta Bancária</label>
            <select
              value={form.bankAccountId}
              onChange={e => setForm({ ...form, bankAccountId: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            >
              <option value="">Selecione...</option>
              {bankAccounts.data.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data</label>
              <input
                type="date"
                value={form.transactionDate}
                onChange={e => setForm({ ...form, transactionDate: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            />
          </div>
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nº Documento</label>
            <input
              type="text"
              value={form.documentNumber}
              onChange={e => setForm({ ...form, documentNumber: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
