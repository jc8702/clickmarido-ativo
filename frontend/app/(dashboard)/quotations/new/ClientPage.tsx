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
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      customer_id: '',
      items: [{ name: '', quantity: 1, unit_price: 0 }],
      discount: 0,
      valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
      notes: '',
      payment_methods: '',
      execution_deadline: '',
      payment_method: 'PIX',
      installments: 1,
      margin_percentage: 0,
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
    <div className="p-8 max-w-4xl mx-auto bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/quotations" className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Novo Orçamento</h1>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700">
          <CustomerPicker />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Válido até *</label>
            <input type="date" {...methods.register('valid_until')} className="p-2 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100" />
            {methods.formState.errors.valid_until && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{methods.formState.errors.valid_until.message}</p>}
          </div>

          <ItemsBuilder />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Prazo de Execução</label>
              <input
                type="text"
                {...methods.register('execution_deadline')}
                placeholder="Ex: 5 dias úteis, Conforme agendamento"
                className="w-full p-2.5 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Formas de Pagamento</label>
              <input
                type="text"
                {...methods.register('payment_methods')}
                placeholder="Ex: PIX, Cartão de Crédito, Boleto"
                className="w-full p-2.5 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observações / Escopo da Proposta</label>
            <textarea 
              rows={4} 
              {...methods.register('notes')} 
              placeholder="Descreva aqui observações, prazos especiais, termos da garantia ou detalhes do escopo..." 
              className="w-full p-2.5 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

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
