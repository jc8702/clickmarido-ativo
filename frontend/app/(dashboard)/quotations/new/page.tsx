'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotationSchema, QuotationFormValues } from '../../../../lib/validations/quotation.schema';
import { useCreateQuotation } from '../../../../hooks/useQuotations';
import { CustomerPicker } from '../../../../components/quotations/CustomerPicker';
import { ItemsBuilder } from '../../../../components/quotations/ItemsBuilder';

export default function NewQuotationPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateQuotation();

  const methods = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customer_id: '',
      items: [{ name: '', quantity: 1, unit_price: 0 }],
      discount: 0,
      valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: QuotationFormValues) => {
    try {
      await mutateAsync(data);
      alert('Orçamento criado com sucesso!');
      router.push('/quotations');
    } catch (e) {
      alert('Erro ao criar orçamento');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/quotations" className="text-blue-600 hover:underline">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento</h1>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded shadow">
          <CustomerPicker />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Válido até *</label>
            <input type="date" {...methods.register('valid_until')} className="p-2 border rounded" />
            {methods.formState.errors.valid_until && <p className="text-red-500 text-xs mt-1">{methods.formState.errors.valid_until.message}</p>}
          </div>

          <ItemsBuilder />

          <div className="pt-6 flex justify-end">
            <button type="submit" disabled={isPending} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50">
              {isPending ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
