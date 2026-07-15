'use client';

import { useState } from 'react';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  previsto: 'Previsto',
  aberto: 'Aberto',
  parcial: 'Parcial',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  previsto: 'bg-blue-100 text-blue-800',
  aberto: 'bg-yellow-100 text-yellow-800',
  parcial: 'bg-orange-100 text-orange-800',
  pago: 'bg-green-100 text-green-800',
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

export default function PagarPage() {
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const { data, isLoading, createAccount, makePayment } = useAccountsPayable(filters);
  const { data: bankAccounts } = useBankAccounts();
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    totalAmount: 0,
    dueDate: '',
    origin: 'MANUAL',
    vendorId: '',
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
  const [refundForm, setRefundForm] = useState({
    amount: 0,
    bankAccountId: '',
    notes: '',
    cancelAccount: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount(form);
      toast.success('Conta a pagar criada!');
      setShowModal(false);
      setForm({ title: '', description: '', totalAmount: 0, dueDate: '', origin: 'MANUAL', vendorId: '', bankAccountId: '', notes: '' });
    } catch (error) {
      toast.error('Erro ao criar conta');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await makePayment(selectedAccount.id, payForm);
      toast.success('Pagamento registrado!');
      setShowPayModal(false);
      setSelectedAccount(null);
      setPayForm({ amount: 0, paymentMethod: 'PIX', bankAccountId: '', paymentDate: '', notes: '' });
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      // Importante: extrair `refundPayment` do hook no início do componente.
      // O hook já exporta refundPayment mas não o extraímos na desestruturação
      await refundPayment(selectedAccount.id, refundForm);
      toast.success('Estorno registrado!');
      setShowRefundModal(false);
      setSelectedAccount(null);
      setRefundForm({ amount: 0, bankAccountId: '', notes: '', cancelAccount: true });
    } catch (error) {
      toast.error('Erro ao registrar estorno');
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

  const openRefundModal = (account: any) => {
    setSelectedAccount(account);
    setRefundForm({
      amount: Number(account.paidAmount),
      bankAccountId: account.bankAccountId || '',
      notes: '',
      cancelAccount: true,
    });
    setShowRefundModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contas a Pagar</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Títulos e pagamentos</p>
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
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Pago</p>
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
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Fornecedor</th>
              <th className="text-left p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Vencimento</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Valor</th>
              <th className="text-right p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Pago</th>
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
                    {account.vendor?.name || '-'}
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
                    <div className="flex justify-center gap-2">
                      {account.status !== 'pago' && account.status !== 'cancelado' && (
                        <button
                          onClick={() => openPayModal(account)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Pagar
                        </button>
                      )}
                      {Number(account.paidAmount) > 0 && account.status !== 'cancelado' && (
                        <button
                          onClick={() => openRefundModal(account)}
                          className="text-sm text-orange-600 hover:text-orange-800"
                        >
                          Estornar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Conta a Pagar">
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

      {/* Modal Pagar */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Pagamento">
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
            <Button type="submit">Confirmar Pagamento</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Estornar */}
      <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title="Estornar Pagamento">
        <form onSubmit={handleRefund} className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              O estorno criará uma transação de entrada (crédito) na conta bancária selecionada.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor do Estorno (Max: {selectedAccount ? formatCurrency(selectedAccount.paidAmount) : 'R$ 0,00'})</label>
            <input
              type="number"
              step="0.01"
              max={selectedAccount ? selectedAccount.paidAmount : 0}
              value={refundForm.amount}
              onChange={e => setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Receber dinheiro na Conta Bancária</label>
            <select
              value={refundForm.bankAccountId}
              onChange={e => setRefundForm({ ...refundForm, bankAccountId: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              required
            >
              <option value="">Selecione...</option>
              {bankAccounts?.data?.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cancelAccount"
              checked={refundForm.cancelAccount}
              onChange={e => setRefundForm({ ...refundForm, cancelAccount: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="cancelAccount" className="text-sm text-neutral-700 dark:text-neutral-300">
              Cancelar a conta a pagar após o estorno
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observações (Opcional)</label>
            <textarea
              value={refundForm.notes}
              onChange={e => setRefundForm({ ...refundForm, notes: e.target.value })}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowRefundModal(false)}>Cancelar</Button>
            <Button type="submit" variant="danger">Confirmar Estorno</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
