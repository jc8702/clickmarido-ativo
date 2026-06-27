'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
      discount_percentage: 0,
      valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
      notes: '',
      payment_methods: '',
      execution_deadline: '',
      payment_method: 'PIX',
      installments: 1,
      margin_percentage: 0,
    }
  });

  const goBack = useCallback(() => {
    router.push('/quotations');
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const token = getToken();
        const res = await fetch(`/api/quotations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao carregar orçamento');
        const data = await res.json();

        // API returns items as QuotationItem[] from DB with product relation
        const dbItems = data.items || [];

        const mappedItems = dbItems.map((item: any) => ({
          name: item.product?.name || item.name || item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.unit_price || item.price || 0,
          cost_price: item.costPrice || item.cost_price || 0,
          markup: item.markup || 1,
          sku: item.product?.sku || item.sku || '',
          product_id: item.productId || item.product_id || '',
          type: item.product?.type || item.type || 'SERVICO',
        }));

        const rawPaymentMethod = String(data.paymentMethod || 'PIX').toUpperCase().replace(/\s+/g, '_');
        const validPaymentMethods: Record<string, string> = {
          'PIX': 'PIX',
          'DINHEIRO': 'DINHEIRO',
          'CARTAO_CREDITO': 'CARTAO_CREDITO',
          'CARTÃO DE CRÉDITO': 'CARTAO_CREDITO',
          'CARTAO DE CREDITO': 'CARTAO_CREDITO',
          'CARTÃO_DE_CRÉDITO': 'CARTAO_CREDITO',
        };
        const normalizedPaymentMethod = validPaymentMethods[rawPaymentMethod] || 'PIX';

        methods.reset({
          customer_id: data.customerId,
          items: mappedItems.length > 0 ? mappedItems : [{ name: '', quantity: 1, unit_price: 0, cost_price: 0, markup: 1, type: 'SERVICO' as const }],
          discount_percentage: Number(data.discountPercentage) || 0,
          valid_until: data.validUntil
            ? new Date(data.validUntil).toISOString().split('T')[0]
            : new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
          notes: typeof data.notes === 'string' && data.notes.startsWith('{') ? (() => { try { const p = JSON.parse(data.notes); return p.notes || data.notes; } catch { return data.notes; } })() : (data.notes || ''),
          payment_methods: data.paymentMethods || '',
          execution_deadline: data.executionDeadline || '',
          payment_method: normalizedPaymentMethod as 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO',
          installments: Number(data.installments) || 1,
          margin_percentage: Number(data.marginPercentage) || 0,
        });
      } catch (e) {
        setError('Erro ao carregar orçamento');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuotation();
  }, [id, getToken, methods]);

  const extractErrorMessages = (errors: any): string[] => {
    const messages: string[] = [];
    const walk = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.message) {
        messages.push(obj.message);
        return;
      }
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach((item: any) => walk(item));
        } else if (typeof obj[key] === 'object') {
          walk(obj[key]);
        }
      }
    };
    walk(errors);
    return messages;
  };

  const onSubmit = async (data: QuotationFormValues) => {
    setSaving(true);
    setError('');
    try {
      const token = getToken();

      // Recalculate total from items with Folga de Venda and Desconto percentual
      const subtotal = data.items.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1) * (item.unit_price || 0),
        0
      );
      const marginPercentage = data.margin_percentage || 0;
      const discountPercentage = data.discount_percentage || 0;
      
      // Folga de Venda: percentual adicionado ao subtotal
      const marginAmount = subtotal * (marginPercentage / 100);
      const subtotalWithMargin = subtotal + marginAmount;
      
      // Desconto: percentual aplicado sobre o subtotal com folga
      const discountAmount = subtotalWithMargin * (discountPercentage / 100);
      
      // Total final = subtotal + folga - desconto
      const total = subtotalWithMargin - discountAmount;

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: data.customer_id,
          items: data.items.map((item: any) => ({
            name: item.name,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            cost_price: Number(item.cost_price) || 0,
            markup: Number(item.markup) || 1,
            sku: item.sku || '',
            product_id: item.product_id || '',
            type: item.type || 'SERVICO',
          })),
          total,
          valid_until: data.valid_until,
          notes: data.notes || '',
          payment_methods: data.payment_methods || '',
          execution_deadline: data.execution_deadline || '',
          payment_method: data.payment_method || 'PIX',
          installments: data.installments || 1,
          margin_percentage: data.margin_percentage || 0,
          discount_percentage: data.discount_percentage || 0,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar');
      }
      router.push('/quotations');
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar orçamento');
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
        <button onClick={goBack} className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar</button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Editar Orçamento</h1>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit, (formErrors) => {
          const messages = extractErrorMessages(formErrors);
          setError(messages.length > 0 ? messages.join('. ') : 'Verifique os campos obrigatórios.');
        })} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded shadow border border-neutral-200 dark:border-neutral-700">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded text-sm">
              {error}
            </div>
          )}
          <CustomerPicker />

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Válido até *</label>
            <input type="date" {...methods.register('valid_until')} className="p-2 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100" />
            {methods.formState.errors.valid_until && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{methods.formState.errors.valid_until.message}</p>}
          </div>

          <ItemsBuilder />

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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Formas de Pagamento Aceito</label>
            <input
              type="text"
              {...methods.register('payment_methods')}
              defaultValue="PIX / Dinheiro / Cartão de Crédito"
              placeholder="Ex: PIX, Dinheiro, Cartão de Crédito"
              className="w-full p-2.5 border rounded bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
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
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
