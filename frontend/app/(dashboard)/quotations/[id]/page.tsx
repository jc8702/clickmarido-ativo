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

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!data) return <div className="p-8">Não encontrado.</div>;

  const handleSend = async (method: string) => {
    await sendQ(data.id, method);
    alert(`Enviado via ${method.toUpperCase()} com sucesso!`);
    router.refresh();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotations" className="text-blue-600 hover:underline">&larr; Voltar</Link>
          <h1 className="text-2xl font-bold text-gray-900">Orçamento {data.number}</h1>
        </div>
        {data.status === 'draft' && (
          <div className="flex gap-2">
            <button onClick={() => handleSend('whatsapp')} disabled={isPending} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium">Enviar WhatsApp</button>
            <button onClick={() => handleSend('email')} disabled={isPending} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 text-sm font-medium">Enviar E-mail</button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow space-y-6">
        <div className="grid grid-cols-2 gap-4 border-b pb-4">
          <div><p className="text-gray-500 text-sm">Cliente</p><p className="font-medium">{data.customer_name}</p></div>
          <div><p className="text-gray-500 text-sm">Status</p><p className="font-medium uppercase">{data.status}</p></div>
          <div><p className="text-gray-500 text-sm">Link de Aprovação Público</p>
            <a href={`/quotations/view?token=${data.approval_link}`} target="_blank" className="text-blue-600 hover:underline text-sm break-all">
              /quotations/view?token={data.approval_link}
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4">Itens</h3>
          <ul className="space-y-2">
            {data.items.map((i: any, idx: number) => (
              <li key={idx} className="flex justify-between border-b py-2 text-sm">
                <span>{i.quantity}x {i.name}</span>
                <span>R$ {i.unit_price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded text-right space-y-1">
          <p className="text-sm text-gray-600">Subtotal: R$ {data.subtotal}</p>
          <p className="text-sm text-gray-600">Desconto: R$ {data.discount}</p>
          <p className="text-xl font-bold text-gray-900 mt-2">Total: R$ {data.total}</p>
        </div>
      </div>
    </div>
  );
}
