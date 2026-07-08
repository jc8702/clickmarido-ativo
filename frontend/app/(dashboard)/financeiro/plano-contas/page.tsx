'use client';

import { useState } from 'react';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  { value: 'RECEITA', label: 'Receita', color: 'text-green-600' },
  { value: 'DESPESA', label: 'Despesa', color: 'text-red-600' },
  { value: 'FINANCEIRO', label: 'Financeiro', color: 'text-blue-600' },
  { value: 'IMPOSTO', label: 'Imposto', color: 'text-purple-600' },
];

export default function PlanoContasPage() {
  const { data, isLoading, createAccount, updateAccount, deleteAccount } = useChartOfAccounts();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'RECEITA',
    parentId: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, form);
        toast.success('Conta atualizada!');
      } else {
        await createAccount(form);
        toast.success('Conta criada!');
      }
      setShowModal(false);
      setEditingAccount(null);
      setForm({ code: '', name: '', type: 'RECEITA', parentId: '', isActive: true });
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId || '',
      isActive: account.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await deleteAccount(id);
      toast.success('Conta excluída!');
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const renderAccount = (account: any, level = 0) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === account.type);
    return (
      <div key={account.id}>
        <div
          className="flex items-center justify-between py-2 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg"
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-neutral-500">{account.code}</span>
            <span className={`font-medium ${typeInfo?.color || ''}`}>{account.name}</span>
            {!account.isActive && (
              <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">Inativo</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">{typeInfo?.label}</span>
            <button
              onClick={() => handleEdit(account)}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(account.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Excluir
            </button>
          </div>
        </div>
        {account.children?.map((child: any) => renderAccount(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Plano de Contas</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Classificação financeira do negócio</p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setShowModal(true); }}>
          Nova Conta
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">Carregando...</div>
        ) : data.data.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            Nenhuma conta cadastrada. Crie a primeira conta do plano.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.data.map(account => renderAccount(account))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingAccount(null); }}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Código</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              placeholder="Ex: 1.01.001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
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
              {ACCOUNT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm text-neutral-700 dark:text-neutral-300">Ativa</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingAccount(null); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingAccount ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
