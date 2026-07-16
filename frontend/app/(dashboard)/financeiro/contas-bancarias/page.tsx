'use client';

import { useState } from 'react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  { value: 'CORRENTE', label: 'Corrente' },
  { value: 'POUPANCA', label: 'Poupança' },
  { value: 'INVESTIMENTO', label: 'Investimento' },
  { value: 'PAGAMENTO', label: 'Conta de Pagamento' },
];

export default function ContasBancariasPage() {
  const { data, isLoading, createAccount, updateAccount, deleteAccount, adjustBalance, getTransactions } = useBankAccounts();
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<any>(null);
  const [balanceForm, setBalanceForm] = useState({ currentBalance: 0, notes: '' });
  const [form, setForm] = useState({
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'CORRENTE',
    nickname: '',
    initialBalance: 0,
    color: '#3b82f6',
    isDefault: false,
    notes: '',
  });

  // Estados para movimentações expansíveis
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, any[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState<Record<string, boolean>>({});

  const handleToggleExpand = async (accountId: string) => {
    if (expandedAccountId === accountId) {
      setExpandedAccountId(null);
      return;
    }
    
    setExpandedAccountId(accountId);
    
    if (!transactions[accountId]) {
      setLoadingTransactions(prev => ({ ...prev, [accountId]: true }));
      try {
        const txs = await getTransactions(accountId);
        setTransactions(prev => ({ ...prev, [accountId]: txs }));
      } catch (error) {
        toast.error('Erro ao carregar movimentações');
        console.error(error);
      } finally {
        setLoadingTransactions(prev => ({ ...prev, [accountId]: false }));
      }
    }
  };

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
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleAdjustBalanceClick = (account: any) => {
    setAdjustingAccount(account);
    setBalanceForm({ currentBalance: Number(account.currentBalance) || 0, notes: '' });
    setShowBalanceModal(true);
  };

  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount) return;
    try {
      await adjustBalance(adjustingAccount.id, balanceForm.currentBalance, balanceForm.notes);
      toast.success('Saldo ajustado com sucesso!');
      setShowBalanceModal(false);
      setAdjustingAccount(null);
      // Limpar cache de transações para forçar recarga, já que o ajuste cria uma nova transação
      setTransactions(prev => {
        const updated = { ...prev };
        delete updated[adjustingAccount.id];
        return updated;
      });
    } catch (error) {
      toast.error('Erro ao ajustar saldo');
    }
  };

  const resetForm = () => {
    setForm({
      bankName: '',
      agency: '',
      accountNumber: '',
      accountType: 'CORRENTE',
      nickname: '',
      initialBalance: 0,
      color: '#3b82f6',
      isDefault: false,
      notes: '',
    });
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setForm({
      bankName: account.bankName,
      agency: account.agency,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      nickname: account.nickname || '',
      initialBalance: account.initialBalance,
      color: account.color || '#3b82f6',
      isDefault: account.isDefault,
      notes: account.notes || '',
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contas Bancárias</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Gerencie suas contas e saldos</p>
        </div>
        <Button onClick={() => { setEditingAccount(null); resetForm(); setShowModal(true); }}>
          Nova Conta
        </Button>
      </div>

      {/* Saldo Total */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <p className="text-sm opacity-80">Saldo Total</p>
        <p className="text-3xl font-bold">{formatCurrency(data.totalBalance)}</p>
        <p className="text-sm opacity-80 mt-1">{data.count} contas ativas</p>
      </div>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          ))
        ) : data.data.length === 0 ? (
          <div className="col-span-full text-center py-8 text-neutral-500">
            Nenhuma conta bancária cadastrada
          </div>
        ) : (
          data.data.map((account) => (
            <div
              key={account.id}
              onClick={() => handleToggleExpand(account.id)}
              className={`bg-white dark:bg-neutral-900 rounded-xl border p-4 relative cursor-pointer transition-all duration-300 ${
                expandedAccountId === account.id
                  ? 'border-primary-500 dark:border-primary-400 shadow-md ring-1 ring-primary-500/20'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
              }`}
            >
              {account.isDefault && (
                <span className="absolute top-2 right-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                  Padrão
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: account.color || '#3b82f6' }}
                />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {account.nickname || account.bankName}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {account.bankName}
                    {account.agency ? ` • Ag. ${account.agency}` : ''}
                    {account.accountNumber ? ` • Cc. ${account.accountNumber}` : ''}
                    {account.accountType === 'PAGAMENTO' ? ' (Pagamento)' : ''}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                {formatCurrency(account.currentBalance)}
              </p>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAdjustBalanceClick(account)}
                  className="text-sm text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 font-medium"
                >
                  Ajustar Saldo
                </button>
                <button
                  onClick={() => handleEdit(account)}
                  className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-500 dark:hover:text-primary-400 font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 font-medium"
                >
                  Excluir
                </button>
              </div>

              {/* Painel de Transações Expandido */}
              {expandedAccountId === account.id && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                    Movimentações Recentes
                  </p>
                  
                  {loadingTransactions[account.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : !transactions[account.id] || transactions[account.id].length === 0 ? (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 py-2 text-center">
                      Nenhuma movimentação nesta conta
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {transactions[account.id].map((tx) => (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-50 dark:border-neutral-800/40 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 px-1 rounded transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 mr-2">
                            <span className={`font-semibold shrink-0 ${
                              tx.type === 'DEBIT' 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {tx.type === 'DEBIT' ? '-' : '+'} {formatCurrency(tx.amount)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide shrink-0 ${
                              tx.identifier.startsWith('OC-')
                                ? 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30'
                                : tx.identifier.startsWith('OS-')
                                ? 'bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30'
                                : tx.identifier.startsWith('INV-')
                                ? 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}>
                              {tx.identifier}
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-400 truncate" title={tx.description}>
                              {tx.description}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">
                            {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingAccount(null); }}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Banco</label>
            <input
              type="text"
              value={form.bankName}
              onChange={e => setForm({ ...form, bankName: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              placeholder="Ex: Itaú, Bradesco, Nubank..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Agência</label>
              <input
                type="text"
                value={form.agency}
                onChange={e => setForm({ ...form, agency: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Conta</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
            <select
              value={form.accountType}
              onChange={e => setForm({ ...form, accountType: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Apelido</label>
            <input
              type="text"
              value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              placeholder="Ex: Conta principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Saldo Inicial</label>
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={e => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Cor</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm text-neutral-700 dark:text-neutral-300">Conta padrão</label>
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

      <Modal
        isOpen={showBalanceModal}
        onClose={() => { setShowBalanceModal(false); setAdjustingAccount(null); }}
        title="Ajustar Saldo da Conta"
      >
        <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
          <p className="text-sm text-neutral-500 mb-2">
            Isso atualizará o saldo e criará uma transação de ajuste financeiro no livro caixa para garantir a integridade.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Novo Saldo Atual</label>
            <input
              type="number"
              step="0.01"
              value={balanceForm.currentBalance}
              onChange={e => setBalanceForm({ ...balanceForm, currentBalance: parseFloat(e.target.value) || 0 })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Motivo do Ajuste (Opcional)</label>
            <input
              type="text"
              value={balanceForm.notes}
              onChange={e => setBalanceForm({ ...balanceForm, notes: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              placeholder="Ex: Correção de saldo, taxa bancária, etc."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowBalanceModal(false); setAdjustingAccount(null); }}>
              Cancelar
            </Button>
            <Button type="submit">
              Ajustar Saldo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
