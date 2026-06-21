'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuotation, useSendQuotation } from '../../../../hooks/useQuotations';

export default function ViewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data, isLoading } = useQuotation(id);
  const { mutateAsync: sendQ, isPending } = useSendQuotation();

  if (isLoading) return <div className="p-8 text-neutral-900 dark:text-neutral-100">Carregando...</div>;
  if (!data) return <div className="p-8 text-neutral-900 dark:text-neutral-100">Não encontrado.</div>;

  const handleSend = async (method: string) => {
    await sendQ(data.id, method);
    alert(`Enviado via ${method.toUpperCase()} com sucesso!`);
    router.refresh();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotations" className="text-primary-600 dark:text-primary-400 hover:underline">&larr; Voltar</Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Orçamento {data.number}</h1>
        </div>
        {data.status === 'draft' && (
          <div className="flex gap-2">
            <button onClick={() => handleSend('whatsapp')} disabled={isPending} className="bg-success-600 text-white px-4 py-2 rounded hover:bg-success-700 text-sm font-medium">Enviar WhatsApp</button>
            <button onClick={() => handleSend('email')} disabled={isPending} className="bg-neutral-800 dark:bg-neutral-700 text-white px-4 py-2 rounded hover:bg-neutral-900 dark:hover:bg-neutral-600 text-sm font-medium">Enviar E-mail</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow space-y-6">
        <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-4">
          <div><p className="text-neutral-500 dark:text-neutral-400 text-sm">Cliente</p><p className="font-medium text-neutral-900 dark:text-neutral-100">{data.customer_name}</p></div>
          <div><p className="text-neutral-500 dark:text-neutral-400 text-sm">Status</p><p className="font-medium uppercase text-neutral-900 dark:text-neutral-100">{data.status}</p></div>
          <div><p className="text-neutral-500 dark:text-neutral-400 text-sm">Link de Aprovação Público</p>
            <a href={`/quotations/view?token=${data.approval_link}`} target="_blank" className="text-primary-600 dark:text-primary-400 hover:underline text-sm break-all">
              /quotations/view?token={data.approval_link}
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4 text-neutral-900 dark:text-neutral-100">Itens</h3>
          <ul className="space-y-2">
            {data.items.map((i: any, idx: number) => (
              <li key={idx} className="flex justify-between border-b border-neutral-200 dark:border-neutral-700 py-2 text-sm">
                <span className="text-neutral-800 dark:text-neutral-200">{i.quantity}x {i.name}</span>
                <span className="text-neutral-900 dark:text-neutral-100">R$ {i.unit_price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded text-right space-y-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Subtotal: R$ {data.subtotal}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Desconto: R$ {data.discount}</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">Total: R$ {data.total}</p>
        </div>
      </div>
    </div>
  );
}
