'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseOrderSchema, PurchaseOrderFormValues } from '../../lib/validations/purchase-order.schema';
import { useVendors } from '../../hooks/useVendors';
import { useProducts } from '../../hooks/useProducts';
import { COST_CENTERS } from '../../lib/finance-options';

type Props = {
  initialData?: any;
  onSubmit: (data: PurchaseOrderFormValues) => void;
  isLoading: boolean;
  isEdit?: boolean;
};

export function PurchaseOrderForm({ initialData, onSubmit, isLoading, isEdit = false }: Props) {
  // Carregar fornecedores ativos (para o select)
  const { data: vendorsData } = useVendors(1, '', '', '', 'true', 'false');
  const vendors = (vendorsData?.data as any[]) || [];

  // Carregar produtos do tipo PEÇA
  const { data: productsData } = useProducts(1, '', 'PECA');
  const products = (productsData?.data as any[]) || [];

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialData || {
      vendorId: '',
      quotationId: '',
      serviceOrderId: '',
      expectedDeliveryDate: '',
      paymentTerms: '',
      paymentMethod: '',
      costCenter: '',
      requestedBy: '',
      deliveryAddress: '',
      discountAmount: 0,
      freightAmount: 0,
      taxAmount: 0,
      internalNotes: '',
      supplierTerms: '',
      items: [{ productId: '', description: '', quantity: 1, unit: 'un', unitPrice: 0, discountAmount: 0, taxAmount: 0, notes: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Assistir os valores dos itens e totais do formulário para cálculo dinâmico (UX apenas)
  const watchedItems = useWatch({ control, name: 'items' }) || [];
  const discountAmount = watch('discountAmount') || 0;
  const freightAmount = watch('freightAmount') || 0;
  const taxAmount = watch('taxAmount') || 0;

  // Monitorar fornecedor selecionado para sugerir termos padrão (apenas em modo de criação)
  const watchedVendorId = watch('vendorId');
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Na edição, não sobrescrever campos na primeira renderização
    if (isEdit && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;
    if (watchedVendorId && vendors.length > 0) {
      const selected = vendors.find((v: any) => v.id === watchedVendorId);
      if (selected) {
        if (selected.paymentTerms) setValue('paymentTerms', selected.paymentTerms);
        if (selected.address) setValue('deliveryAddress', selected.address);
      }
    }
  }, [watchedVendorId, vendors, setValue, isEdit]);

  // Recalcular subtotal e total estimado para exibição
  let calculatedSubtotal = 0;
  watchedItems.forEach((item: any) => {
    if (item) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discountAmount) || 0;
      const tax = parseFloat(item.taxAmount) || 0;
      calculatedSubtotal += (qty * price) - disc + tax;
    }
  });

  const calculatedTotal = calculatedSubtotal - parseFloat(discountAmount as any || 0) + parseFloat(freightAmount as any || 0) + parseFloat(taxAmount as any || 0);

  const handleProductSelect = (index: number, productId: string) => {
    if (!productId) {
      setValue(`items.${index}.description`, '');
      setValue(`items.${index}.unitPrice`, 0);
      setValue(`items.${index}.unit`, 'un');
      return;
    }

    const prod = products.find((p: any) => p.id === productId);
    if (prod) {
      setValue(`items.${index}.description`, prod.name);
      setValue(`items.${index}.unitPrice`, prod.price || 0);
      setValue(`items.${index}.unit`, prod.unit || 'un');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700">
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informações da Compra</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Escolha o fornecedor e defina os vínculos operacionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fornecedor *</label>
          <select 
            {...register('vendorId')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
          >
            <option value="">Selecione um Fornecedor...</option>
            {vendors.map((vendor: any) => (
              <option key={vendor.id} value={vendor.id} disabled={vendor.isBlocked}>
                {vendor.name} {vendor.tradeName ? `(${vendor.tradeName})` : ''} {vendor.isBlocked ? ' - [BLOQUEADO]' : ''}
              </option>
            ))}
          </select>
          {errors.vendorId && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.vendorId.message?.toString()}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Data Prevista de Entrega</label>
          <input 
            type="date"
            {...register('expectedDeliveryDate')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Solicitante / Comprador</label>
          <input 
            {...register('requestedBy')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Nome do solicitante" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Vínculo Orçamento (ID) - Opcional</label>
          <input 
            {...register('quotationId')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm" 
            placeholder="Deixe em branco se não houver"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Vínculo Ordem de Serviço (ID) - Opcional</label>
          <input 
            {...register('serviceOrderId')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm" 
            placeholder="Deixe em branco se não houver"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Centro de Custos</label>
          <select 
            {...register('costCenter')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="">Selecione</option>
            {COST_CENTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Forma de Pagamento</label>
          <input 
            {...register('paymentMethod')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Ex: PIX, Boleto, Depósito" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Condições de Pagamento</label>
          <input 
            {...register('paymentTerms')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Ex: 30 dias, à vista" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Endereço de Entrega</label>
          <input 
            {...register('deliveryAddress')} 
            className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" 
            placeholder="Endereço de entrega" 
          />
        </div>
      </div>

      {/* Seção de Itens da OC */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Itens do Pedido</h3>
          <button 
            type="button" 
            onClick={() => append({ productId: '', description: '', quantity: 1, unit: 'un', unitPrice: 0, discountAmount: 0, taxAmount: 0, notes: '' })}
            className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-semibold"
          >
            + Adicionar Item Livre
          </button>
        </div>
        
        {errors.items?.message && <p className="text-red-500 dark:text-red-400 text-xs mb-2 font-medium">{errors.items.message?.toString()}</p>}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800/40 relative">
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-2 right-2 text-red-500 dark:text-red-400 hover:text-red-700 text-xs font-semibold"
              >
                Remover
              </button>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-16">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Vincular Peça (Opcional)</label>
                  <select 
                    {...register(`items.${index}.productId`)} 
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs"
                  >
                    <option value="">Item Livre (Sem cadastro)...</option>
                    {products.map((prod: any) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (SKU: {prod.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Descrição / Nome do Item *</label>
                  <input 
                    {...register(`items.${index}.description`)} 
                    className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-medium" 
                    placeholder="Descrição do material ou serviço de compra"
                  />
                  {(errors.items as any)?.[index]?.description && <p className="text-red-500 text-2xs mt-1">{(errors.items as any)[index]?.description?.message?.toString()}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Qtd *</label>
                    <input 
                      type="number"
                      step="any"
                      {...register(`items.${index}.quantity`)} 
                      className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs text-center" 
                    />
                    {(errors.items as any)?.[index]?.quantity && <p className="text-red-500 text-2xs mt-1">{(errors.items as any)[index]?.quantity?.message?.toString()}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Unid *</label>
                    <input 
                      {...register(`items.${index}.unit`)} 
                      className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs text-center" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Vl. Unit *</label>
                    <input 
                      type="number"
                      step="any"
                      {...register(`items.${index}.unitPrice`)} 
                      className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs text-right font-medium" 
                    />
                    {(errors.items as any)?.[index]?.unitPrice && <p className="text-red-500 text-2xs mt-1">{(errors.items as any)[index]?.unitPrice?.message?.toString()}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pr-16 border-t border-neutral-200 dark:border-neutral-700/60 pt-2">
                <div>
                  <label className="block text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Desconto do Item (R$)</label>
                  <input 
                    type="number"
                    step="any"
                    {...register(`items.${index}.discountAmount`)} 
                    className="mt-1 block w-full p-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Imposto do Item (R$)</label>
                  <input 
                    type="number"
                    step="any"
                    {...register(`items.${index}.taxAmount`)} 
                    className="mt-1 block w-full p-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Notas do Item</label>
                  <input 
                    {...register(`items.${index}.notes`)} 
                    className="mt-1 block w-full p-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs" 
                    placeholder="Ref, tamanho, cor, etc."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais Gerais do Rodapé */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Observações Internas (OC)</label>
            <textarea 
              {...register('internalNotes')} 
              className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs" 
              rows={2}
              placeholder="Instruções internas..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Termos Gerais para o Fornecedor</label>
            <textarea 
              {...register('supplierTerms')} 
              className="mt-1 block w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs" 
              rows={2}
              placeholder="Condições contratuais do pedido..."
            ></textarea>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700/20 p-4 rounded border border-neutral-200 dark:border-neutral-700/60 flex flex-col justify-between">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-medium text-neutral-600 dark:text-neutral-400">
              <span>Subtotal dos Itens:</span>
              <span>{formatCurrency(calculatedSubtotal)}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-1">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">(-) Desconto (R$)</label>
                <input 
                  type="number" 
                  step="any"
                  {...register('discountAmount')} 
                  className="w-full p-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-xs font-semibold text-red-600" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">(+) Frete (R$)</label>
                <input 
                  type="number" 
                  step="any"
                  {...register('freightAmount')} 
                  className="w-full p-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-xs font-semibold" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">(+) Impostos (R$)</label>
                <input 
                  type="number" 
                  step="any"
                  {...register('taxAmount')} 
                  className="w-full p-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-xs font-semibold" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between items-center mt-3">
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Total Estimado OC:</span>
            <span className="text-xl font-black text-primary-600 dark:text-primary-400">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium disabled:opacity-50 transition-colors shadow"
        >
          {isLoading ? 'Salvando Pedido...' : 'Salvar Ordem de Compra'}
        </button>
      </div>
    </form>
  );
}
