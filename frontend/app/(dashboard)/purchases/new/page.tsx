'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';
import { 
  useCreatePurchaseOrder, 
  useCreatePurchaseOrderFromQuotation, 
  useCreatePurchaseOrderFromServiceOrder 
} from '@/hooks/usePurchaseOrders';
import { useVendors } from '@/hooks/useVendors';
import { Shimmer } from '@/components/Shimmer';
import Link from 'next/link';

function NewPurchaseOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams ? searchParams.get('quotationId') : null;
  const serviceOrderId = searchParams ? searchParams.get('serviceOrderId') : null;

  const { mutateAsync: createOrder, isPending, error } = useCreatePurchaseOrder();
  const { mutateAsync: createFromQuotation, isPending: isPendingQuotation } = useCreatePurchaseOrderFromQuotation(quotationId || '');
  const { mutateAsync: createFromServiceOrder, isPending: isPendingServiceOrder } = useCreatePurchaseOrderFromServiceOrder(serviceOrderId || '');

  const { data: vendorsData } = useVendors(1, '', '', '', 'true', 'false');
  const vendors = vendorsData?.data || [];

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const isImportMode = !!quotationId || !!serviceOrderId;

  const handleSubmit = async (data: any) => {
    try {
      const order = await createOrder(data);
      router.push(`/purchases/${order.id}`);
    } catch (err) {
      console.error('Error creating purchase order:', err);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      setImportError('Selecione um fornecedor para gerar o pedido.');
      return;
    }
    setImportError(null);

    try {
      let order;
      if (quotationId) {
        order = await createFromQuotation(selectedVendorId);
      } else if (serviceOrderId) {
        order = await createFromServiceOrder(selectedVendorId);
      }
      if (order?.id) {
        router.push(`/purchases/${order.id}`);
      }
    } catch (err: any) {
      setImportError(err.message || 'Erro ao gerar ordem de compra importada.');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex items-center space-x-3">
        <Link 
          href="/purchases" 
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-semibold"
        >
          ← Voltar para Ordens de Compra
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {isImportMode ? 'Importar Ordem de Compra' : 'Nova Ordem de Compra'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {isImportMode 
            ? `Gerando pedido de compra a partir do ${quotationId ? 'Orçamento' : 'Ordem de Serviço'} selecionado.`
            : 'Preencha os itens e condições comerciais para emitir o pedido.'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          {error}
        </div>
      )}

      {importError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          {importError}
        </div>
      )}

      {isImportMode ? (
        <form onSubmit={handleImportSubmit} className="bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700 space-y-4 max-w-lg">
          <h3 className="text-md font-bold text-neutral-900 dark:text-neutral-100">Selecionar Fornecedor para Importação</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Apenas peças e componentes cadastrados como "PEÇA" serão importados automaticamente.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fornecedor *</label>
            <select 
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="mt-1 block w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Selecione...</option>
              {vendors.map((vendor: any) => (
                <option key={vendor.id} value={vendor.id} disabled={vendor.isBlocked}>
                  {vendor.name} {vendor.isBlocked ? ' - [BLOQUEADO]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPendingQuotation || isPendingServiceOrder}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded text-sm shadow transition-colors"
            >
              {isPendingQuotation || isPendingServiceOrder ? 'Gerando...' : 'Gerar Ordem de Compra ➔'}
            </button>
          </div>
        </form>
      ) : (
        <PurchaseOrderForm onSubmit={handleSubmit} isLoading={isPending} />
      )}
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-96 w-full" />
      </div>
    }>
      <NewPurchaseOrderContent />
    </Suspense>
  );
}
