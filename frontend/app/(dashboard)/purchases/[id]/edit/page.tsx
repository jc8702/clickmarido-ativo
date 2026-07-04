'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { usePurchaseOrder, useUpdatePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';
import { Shimmer } from '@/components/Shimmer';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPurchaseOrderPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error, mutate } = usePurchaseOrder(id);
  const { mutateAsync: updateOrder, isPending, error: updateError } = useUpdatePurchaseOrder(id);

  const handleSubmit = async (formData: any) => {
    try {
      await updateOrder(formData);
      mutate();
      router.push(`/purchases/${id}`);
    } catch (err) {
      console.error('Error updating purchase order:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-10 w-64" />
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

  // Bloquear acesso se não estiver nos status permitidos
  const editableStatuses = ['rascunho', 'emitida', 'aprovada', 'parcialmente_recebida'];
  const canEdit = editableStatuses.includes(order.status) && order.expense?.status !== 'paga';
  if (!canEdit) {
    return (
      <div className="p-6 min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded">
          Não é possível editar esta ordem de compra. Ordens totalmente recebidas, canceladas ou cuja despesa no financeiro já foi paga estão bloqueadas para alteração.
        </div>
        <Link href={`/purchases/${order.id}`} className="mt-4 inline-block text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Voltar para Detalhes do Pedido
        </Link>
      </div>
    );
  }

  // Formatar dados iniciais de todos os campos editáveis
  const formattedOrder = {
    ...order,
    vendorId: order.vendorId || order.vendor?.id || '',
    quotationId: order.quotationId || '',
    serviceOrderId: order.serviceOrderId || '',
    expectedDeliveryDate: order.expectedDeliveryDate 
      ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] 
      : '',
    items: order.items.map((item: any) => ({
      productId: item.productId || '',
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      notes: item.notes || ''
    }))
  };

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex items-center space-x-3">
        <Link 
          href={`/purchases/${order.id}`} 
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-semibold"
        >
          ← Cancelar e Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Editar Ordem de Compra: {order.number}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Modifique as quantidades, preços e termos comerciais.</p>
      </div>

      {updateError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          {updateError}
        </div>
      )}

      <PurchaseOrderForm initialData={formattedOrder} onSubmit={handleSubmit} isLoading={isPending} isEdit={true} />
    </div>
  );
}
