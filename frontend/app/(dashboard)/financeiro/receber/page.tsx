'use client';

import { useState } from 'react';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  previsto: 'Previsto',
  aberto: 'Aberto',
  parcial: 'Parcial',
  baixado: 'Baixado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  previsto: 'bg-blue-100 text-blue-800',
  aberto: 'bg-yellow-100 text-yellow-800',
  parcial: 'bg-orange-100 text-orange-800',
  baixado: 'bg-green-100 text-green-800',
  vencido: 'bg-red-100 text-red-800',
  cancelado: 'bg-neutral-100 text-neutral-800',
};

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CARTAO', label: 'Cartão' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
];

export default function ReceberPage() {
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const { data, isLoading, createAccount, receivePayment } = useAccountsReceivable(filters);
  const { data: bankAccounts } = useBankAccounts();
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    totalAmount: 0,
    dueDate: '',
    origin: 'MANUAL',
    customerId: '',
    bankAccountId: '',
    notes: '',
  });
  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentMethod: 'PIX',
    bankAccountId: '',
    paymentDate: '',
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount(form);
      toast.success('Conta a receber criada!');
      setShowModal(false);
      setForm({ title: '', description: '', totalAmount: 0, dueDate: '', origin: 'MANUAL', customerId: '', bankAccountId: '', notes: '' });
    } catch (error) {
      toast.error('Erro ao criar conta');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await receivePayment(selectedAccount.id, payForm);
      toast.success('Recebimento registrado!');
      setShowPayModal(false);
      setSelectedAccount(null);
      setPayForm({ amount: 0, paymentMethod: 'PIX', bankAccountId: '', paymentDate: '', notes: '' });
    } catch (error) {
      toast.error('Erro ao registrar recebimento');
    }
  };

  const openPayModal = (account: any) => {
    setSelectedAccount(account);
    setPayForm({
      amount: Number(account.totalAmount) - Number(account.paidAmount),
      paymentMethod: 'PIX',
      bankAccountId: account.bankAccountId || '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowPayModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contas a Receber</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Títulos e recebimentos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Nova Conta</Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Pendente</p>
          <p className="text-xl font-bold text-yellow-600">{formatCurrency(data.summary.totalPending)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Recebido</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalPaid)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Vencidos</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(data.summary.totalOverdue)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Títulos</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.meta.total}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Título</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Cliente</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Vencimento</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Valor</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Recebido</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="text-center p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Carregando...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Nenhum título encontrado</td></tr>
            ) : (
              data.data.map((account) => (
                <tr key={account.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-4">
                    <p className="font-medium text-neutral-900 dark:text-white">{account.title}</p>
                    <p className="text-sm text-neutral-500">{account.origin}</p>
                  </td>
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {account.customer?.name || '-'}
                  </td>
                  <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right font-medium text-neutral-900 dark:text-white">
                    {formatCurrency(account.totalAmount)}
                  </td>
                  <td className="p-4 text-right text-sm text-neutral-600 dark:text-neutral-400">
                    {formatCurrency(account.paidAmount)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[account.status] || ''}`}>
                      {STATUS_LABELS[account.status] || account.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {account.status !== 'baixado' && account.status !== 'cancelado' && (
                      <button
                        onClick={() => openPayModal(account)}
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Receber
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Conta a Receber">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                value={form.totalAmount}
                onChange={e => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Vencimento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Conta Bancária</label>
            <select
              value={form.bankAccountId}
              onChange={e => setForm({ ...form, bankAccountId: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            >
              <option value="">Selecione...</option>
              {bankAccounts.data.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Receber */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Recebimento">
        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              value={payForm.amount}
              onChange={e => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Forma de Pagamento</label>
            <select
              value={payForm.paymentMethod}
              onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Conta Bancária</label>
            <select
              value={payForm.bankAccountId}
              onChange={e => setPayForm({ ...payForm, bankAccountId: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            >
              <option value="">Selecione...</option>
              {bankAccounts.data.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data</label>
            <input
              type="date"
              value={payForm.paymentDate}
              onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowPayModal(false)}>Cancelar</Button>
            <Button type="submit">Confirmar Recebimento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
