import React, { useState } from 'react';
import { useBankAccounts } from '@/hooks/useBankAccounts';

type Props = {
  items: {
    id: string;
    productId?: string | null;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    subtotal: number;
    receivedQuantity: number;
    status: string;
    notes?: string | null;
    product?: {
      name: string;
      sku: string;
      type: string;
    } | null;
  }[];
  status: string;
  onReceive?: (receivedData: { itemId: string; quantityReceived: number }[]) => Promise<void>;
  isReceiving?: boolean;
  onReturn?: (returnedData: { itemId: string; quantityReturned: number }[], bankAccountId?: string) => Promise<void>;
  isReturning?: boolean;
};

export function PurchaseOrderItemsTable({ items = [], status, onReceive, isReceiving = false, onReturn, isReturning = false }: Props) {
  const { data: bankAccountsData } = useBankAccounts();
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [receiveMode, setReceiveMode] = useState(false);
  const [returnMode, setReturnMode] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleQtyChange = (itemId: string, val: string, maxAvailable: number) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setQuantities(prev => ({ ...prev, [itemId]: 0 }));
    } else if (num > maxAvailable) {
      setQuantities(prev => ({ ...prev, [itemId]: maxAvailable }));
    } else {
      setQuantities(prev => ({ ...prev, [itemId]: num }));
    }
  };

  const handleSaveReceive = async () => {
    if (!onReceive) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, qty]) => ({ itemId, quantityReceived: qty }));

      if (payload.length === 0) {
        alert('Insira uma quantidade maior que zero em pelo menos um item para salvar.');
        setSubmitting(false);
        return;
      }

      await onReceive(payload);
      setReceiveMode(false);
      setQuantities({});
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar recebimento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReturn = async () => {
    if (!onReturn) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, qty]) => ({ itemId, quantityReturned: qty }));

      if (payload.length === 0) {
        alert('Insira uma quantidade maior que zero em pelo menos um item para salvar.');
        setSubmitting(false);
        return;
      }

      await onReturn(payload, selectedBankAccountId || undefined);
      setReturnMode(false);
      setQuantities({});
      setSelectedBankAccountId('');
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar devolução');
    } finally {
      setSubmitting(false);
    }
  };

  const canReceive = (status === 'aprovada' || status === 'parcialmente_recebida') && !!onReceive && !returnMode;
  const canReturn = (status === 'recebida' || status === 'parcialmente_recebida') && !!onReturn && !receiveMode;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded shadow overflow-hidden border border-neutral-200 dark:border-neutral-700">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/40">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase">Itens da Ordem de Compra</h4>
        <div className="flex space-x-2">
          {canReceive && !receiveMode && (
            <button
              onClick={() => setReceiveMode(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow transition-colors"
            >
              📦 Receber Itens
            </button>
          )}
          {canReturn && !returnMode && (
            <button
              onClick={() => setReturnMode(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow transition-colors"
            >
              🔄 Devolver Itens
            </button>
          )}

          {receiveMode && (
            <div className="flex space-x-2">
              <button
                disabled={submitting}
                onClick={handleSaveReceive}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                {submitting ? 'Salvando...' : 'Confirmar Entrega'}
              </button>
              <button
                disabled={submitting}
                onClick={() => {
                  setReceiveMode(false);
                  setQuantities({});
                }}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {returnMode && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedBankAccountId}
                onChange={e => setSelectedBankAccountId(e.target.value)}
                className="border border-neutral-350 dark:border-neutral-600 rounded px-2 py-1 text-xs bg-white dark:bg-neutral-800 text-neutral-850 dark:text-neutral-200 border-neutral-300 font-medium"
                disabled={submitting}
              >
                <option value="">-- Selecione a Conta de Reembolso --</option>
                {bankAccountsData?.data?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nickname || acc.bankName} (Saldo: R$ {Number(acc.currentBalance).toFixed(2)})
                  </option>
                ))}
              </select>
              <button
                disabled={submitting}
                onClick={handleSaveReturn}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                {submitting ? 'Processando...' : 'Confirmar Devolução'}
              </button>
              <button
                disabled={submitting}
                onClick={() => {
                  setReturnMode(false);
                  setQuantities({});
                  setSelectedBankAccountId('');
                }}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
          <thead className="bg-neutral-50/50 dark:bg-neutral-700/30 text-neutral-500 dark:text-neutral-400 font-medium">
            <tr>
              <th className="px-6 py-3 text-left">Item / Produto</th>
              <th className="px-6 py-3 text-center">Unidade</th>
              <th className="px-6 py-3 text-right">Qtd. Pedida</th>
              <th className="px-6 py-3 text-right">Qtd. Recebida</th>
              <th className="px-6 py-3 text-right">Vl. Unitário</th>
              <th className="px-6 py-3 text-right">Desconto / Imposto</th>
              <th className="px-6 py-3 text-right">Subtotal</th>
              {receiveMode && <th className="px-6 py-3 text-center bg-amber-500/10 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 font-bold">Qtd. a Entregar</th>}
              {returnMode && <th className="px-6 py-3 text-center bg-purple-500/10 dark:bg-purple-500/5 text-purple-700 dark:text-purple-400 font-bold">Qtd. a Devolver</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 text-neutral-800 dark:text-neutral-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={receiveMode || returnMode ? 8 : 7} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  Nenhum item cadastrado nesta ordem de compra.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const maxReceiveAvailable = Math.max(0, item.quantity - item.receivedQuantity);
                const maxReturnAvailable = Number(item.receivedQuantity) || 0;
                return (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.description}</div>
                      {item.product && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          SKU: {item.product.sku} | Tipo: {item.product.type}
                        </div>
                      )}
                      {item.notes && <div className="text-xs text-neutral-400 dark:text-neutral-500 italic mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400">{item.unit}</td>
                    <td className="px-6 py-4 text-right font-medium">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={item.receivedQuantity >= item.quantity ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-600 dark:text-neutral-400'}>
                        {item.receivedQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right text-xs">
                      {item.discountAmount > 0 && <div className="text-red-500">Desc: -{formatCurrency(item.discountAmount)}</div>}
                      {item.taxAmount > 0 && <div className="text-neutral-500">Imp: +{formatCurrency(item.taxAmount)}</div>}
                      {item.discountAmount === 0 && item.taxAmount === 0 && <span>-</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(item.subtotal)}
                    </td>
                    {receiveMode && (
                      <td className="px-6 py-4 text-center bg-amber-500/10 dark:bg-amber-500/5 align-middle">
                        {maxReceiveAvailable === 0 ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Tudo entregue</span>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={maxReceiveAvailable}
                              step="any"
                              value={quantities[item.id] !== undefined ? quantities[item.id] : ''}
                              onChange={(e) => handleQtyChange(item.id, e.target.value, maxReceiveAvailable)}
                              placeholder={`Máx: ${maxReceiveAvailable}`}
                              className="w-20 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-center text-xs bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantities(prev => ({ ...prev, [item.id]: maxReceiveAvailable }))}
                              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-600 text-[10px] rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
                            >
                              Tudo
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    {returnMode && (
                      <td className="px-6 py-4 text-center bg-purple-500/10 dark:bg-purple-500/5 align-middle">
                        {maxReturnAvailable === 0 ? (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">Nenhum recebido</span>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={maxReturnAvailable}
                              step="any"
                              value={quantities[item.id] !== undefined ? quantities[item.id] : ''}
                              onChange={(e) => handleQtyChange(item.id, e.target.value, maxReturnAvailable)}
                              placeholder={`Máx: ${maxReturnAvailable}`}
                              className="w-20 p-1 border border-neutral-300 dark:border-neutral-600 rounded text-center text-xs bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantities(prev => ({ ...prev, [item.id]: maxReturnAvailable }))}
                              className="px-2 py-1 bg-neutral-200 dark:bg-neutral-600 text-[10px] rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
                            >
                              Tudo
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
