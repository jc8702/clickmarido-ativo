'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quotationSchema, QuotationFormValues } from '../../../../lib/validations/quotation.schema';
import { CustomerPicker } from '../../../../components/quotations/CustomerPicker';
import { ItemsBuilder } from '../../../../components/quotations/ItemsBuilder';
import { useAuth } from '@/hooks/useAuth';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const methods = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      customer_id: '',
      items: [{ name: '', quantity: 1, unit_price: 0, type: 'SERVICO' as const }],
      discount: 0,
      valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const token = getToken();
        const res = await fetch(`/api/quotations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao carregar orçamento');
        const data = await res.json();

        const parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);

        methods.reset({
          customer_id: data.customerId,
          items: parsedItems.map((item: any) => ({
            name: item.name || item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            sku: item.sku || '',
            product_id: item.product_id || '',
            type: item.type || 'SERVICO',
          })),
          discount: data.discount || 0,
          valid_until: data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : '',
        });
      } catch (e) {
        setError('Erro ao carregar orçamento');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuotation();
  }, [id, getToken, methods]);

  const onSubmit = async (data: QuotationFormValues) => {
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: data.items,
          notes: data.discount ? `Desconto: R$ ${data.discount}` : '',
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      router.push('/quotations');
    } catch (e) {
      alert('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <div className="text-center py-12 text-neutral-500">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <div className="text-center py-12 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/quotations" className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar</Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Editar Orçamento</h1>
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

          <div className="pt-6 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
