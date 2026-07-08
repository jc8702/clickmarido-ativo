'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  usePurchaseOrder, 
  useEmitPurchaseOrder, 
  useApprovePurchaseOrder, 
  useReceivePurchaseOrderItems, 
  useReturnPurchaseOrderItems,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder
} from '@/hooks/usePurchaseOrders';
import { PurchaseOrderStatusBadge } from '@/components/purchases/PurchaseOrderStatusBadge';
import { PurchaseOrderHistory } from '@/components/purchases/PurchaseOrderHistory';
import { PurchaseOrderFinancialPanel } from '@/components/purchases/PurchaseOrderFinancialPanel';
import { PurchaseOrderItemsTable } from '@/components/purchases/PurchaseOrderItemsTable';
import { VendorClassificationBadge } from '@/components/vendors/VendorClassificationBadge';
import { Shimmer } from '@/components/Shimmer';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

export default function PurchaseOrderDetailsPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error, mutate } = usePurchaseOrder(id);

  const { mutateAsync: emitOrder, isPending: isEmitting } = useEmitPurchaseOrder(id);
  const { mutateAsync: approveOrder, isPending: isApproving } = useApprovePurchaseOrder(id);
  const { mutateAsync: receiveItems, isPending: isReceiving } = useReceivePurchaseOrderItems(id);
  const { mutateAsync: returnItems, isPending: isReturning } = useReturnPurchaseOrderItems(id);
  const { mutateAsync: cancelOrder, isPending: isCancelling } = useCancelPurchaseOrder(id);
  const { mutateAsync: deleteOrder, isPending: isDeleting } = useDeletePurchaseOrder(id);

  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');

  const handleEmit = async () => {
    if (!confirm('Deseja emitir esta ordem de compra? O status mudará para "Emitida".')) return;
    try {
      await emitOrder();
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao emitir ordem de compra');
    }
  };

  const handleApprove = async () => {
    if (!confirm('Deseja aprovar esta ordem de compra? Isso gerará uma despesa pendente no financeiro.')) return;
    try {
      await approveOrder();
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar ordem de compra');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Informe o motivo do cancelamento da ordem de compra:');
    if (reason === null) return; // cancelado pelo prompt
    try {
      await cancelOrder(reason || undefined);
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar ordem de compra');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza absoluta que deseja EXCLUIR esta ordem de compra? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteOrder();
      router.push('/purchases');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ordem de compra');
    }
  };

  const handleReceiveItems = async (receivedData: { itemId: string; quantityReceived: number }[]) => {
    try {
      await receiveItems(receivedData);
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar recebimento');
      throw err;
    }
  };

  const handleReturnItems = async (returnedData: { itemId: string; quantityReturned: number }[]) => {
    if (!confirm('Deseja confirmar a devolução desses itens? O estoque correspondente será decrementado e o financeiro estornado.')) return;
    try {
      await returnItems(returnedData);
      mutate();
      alert('Devolução registrada com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar devolução');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-12 w-64" />
        <Shimmer className="h-96 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          Erro ao carregar ordem de compra: {error || 'Pedido de compra não encontrado'}
        </div>
      </div>
    );
  }

  const isEditable = order.status !== 'cancelada' && order.expense?.status !== 'paga';
  const isDeletable = order.expense?.status !== 'paga';

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex justify-between items-center">
        <Link 
          href="/purchases" 
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-semibold"
        >
          ← Voltar para Ordens de Compra
        </Link>
        <div className="flex space-x-2">
          {isEditable && (
            <Link
              href={`/purchases/${order.id}/edit`}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-750 text-neutral-700 dark:text-neutral-200 rounded text-xs font-semibold shadow transition-colors"
            >
              Editar OC
            </Link>
          )}
          {isDeletable && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-semibold shadow transition-colors"
            >
              Excluir OC
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-neutral-800 p-6 rounded border border-neutral-200 dark:border-neutral-700 shadow">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{order.number}</span>
            <PurchaseOrderStatusBadge status={order.status} />
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Fornecedor: <strong className="text-neutral-800 dark:text-neutral-200">{order.vendor.name}</strong> 
            <span className="ml-2">
              <VendorClassificationBadge classification={order.vendor.classification} isBlocked={order.vendor.isBlocked} />
            </span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap gap-x-4">
            <span>Emissão: {new Date(order.issueDate).toLocaleDateString('pt-BR')}</span>
            {order.expectedDeliveryDate && (
              <span>Prev. Entrega: {new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR')}</span>
            )}
            {order.deliveredAt && (
              <span className="text-emerald-600 font-semibold">Entregue em: {new Date(order.deliveredAt).toLocaleDateString('pt-BR')}</span>
            )}
            {order.requestedBy && <span>Solicitado por: {order.requestedBy}</span>}
          </div>
        </div>

        {/* Ações operacionais rápidas */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
          {order.status === 'rascunho' && (
            <>
              <button
                onClick={handleEmit}
                disabled={isEmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                ✉ Emitir Pedido
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                ✔ Aprovar Pedido
              </button>
            </>
          )}
          {order.status === 'emitida' && (
            <>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                ✔ Aprovar Pedido
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                ✖ Cancelar Pedido
              </button>
            </>
          )}
          {(order.status === 'aprovada' || order.status === 'parcialmente_recebida') && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow transition-colors"
            >
              ✖ Cancelar Pedido (Atualiza Financeiro)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Itens / Histórico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'items'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400'
                }`}
              >
                🛒 Peças e Insumos
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400'
                }`}
              >
                📝 Histórico de Auditoria
              </button>
            </nav>
          </div>

          {activeTab === 'items' ? (
            <PurchaseOrderItemsTable 
              items={order.items} 
              status={order.status} 
              onReceive={handleReceiveItems}
              isReceiving={isReceiving}
              onReturn={handleReturnItems}
              isReturning={isReturning}
            />
          ) : (
            <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700">
              <PurchaseOrderHistory events={order.events} />
            </div>
          )}
        </div>

        {/* Lado Direito: Painel Financeiro e Observações */}
        <div className="space-y-6">
          <PurchaseOrderFinancialPanel
            subtotal={order.subtotal}
            discountAmount={order.discountAmount}
            freightAmount={order.freightAmount}
            taxAmount={order.taxAmount}
            totalAmount={order.totalAmount}
            expenseId={order.expenseId}
            expense={order.expense}
          />

          {/* Vínculos Operacionais adicionais */}
          {(order.quotation || order.serviceOrder) && (
            <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700 space-y-4">
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Vínculos do CRM</h4>
              <div className="space-y-2 text-xs">
                {order.quotation && (
                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                    <span className="text-neutral-500">Orçamento Origem:</span>
                    <Link href={`/quotations?id=${order.quotationId}`} className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                      Ver Orçamento ➔
                    </Link>
                  </div>
                )}
                {order.serviceOrder && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-neutral-500">Ordem de Serviço:</span>
                    <Link href={`/service-orders?id=${order.serviceOrderId}`} className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                      Ver OS {order.serviceOrder.number} ➔
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endereço de Entrega e Termos do Fornecedor */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700 space-y-4">
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Instruções de Entrega & Termos</h4>
            <div className="space-y-3 text-xs">
              {order.deliveryAddress && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Local de Entrega:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold mt-0.5">{order.deliveryAddress}</p>
                </div>
              )}
              {order.paymentTerms && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Condições de Pagamento:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-semibold mt-0.5">{order.paymentTerms} {order.paymentMethod ? `via ${order.paymentMethod}` : ''}</p>
                </div>
              )}
              {order.supplierTerms && (
                <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Termos Comerciais:</span>
                  <p className="text-neutral-750 dark:text-neutral-350 italic mt-0.5 whitespace-pre-line">{order.supplierTerms}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
