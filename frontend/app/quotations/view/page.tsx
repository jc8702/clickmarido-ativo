'use client';

import React, { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicQuotation, useApproveQuotation } from '../../../hooks/useQuotations';

export default function PublicQuotationView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { data, isLoading, error } = usePublicQuotation(token || '');
  const { mutateAsync: approve, isPending } = useApproveQuotation();

  const [approved, setApproved] = React.useState(false);

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Token inválido ou não fornecido.</p></div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Carregando orçamento...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center max-w-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Ops!</h2>
          <p className="text-gray-600">{error || 'Orçamento não encontrado.'}</p>
        </div>
      </div>
    );
  }

  if (approved || data.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white p-8 rounded shadow text-center max-w-md w-full border-t-4 border-green-500">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Orçamento Aprovado! ✅</h2>
          <p className="text-gray-600 mb-6">Obrigado pela confiança, {data.customer_name}. Uma Ordem de Serviço foi gerada e nossa equipe entrará em contato em breve.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await approve(token);
      setApproved(true);
    } catch (err) {
      alert('Erro ao tentar aprovar o orçamento. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Proposta de Serviço</h1>
          <p className="opacity-90 mt-1">Orçamento nº {data.number}</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div>
            <p className="text-gray-600 text-sm">Olá,</p>
            <p className="text-lg font-medium text-gray-900">{data.customer_name}</p>
            <p className="mt-2 text-gray-600 text-sm">Segue abaixo o detalhamento dos serviços propostos. Esta proposta é válida até <strong>{new Date(data.valid_until).toLocaleDateString()}</strong>.</p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 font-medium text-gray-600">Serviço</th>
                  <th className="p-3 font-medium text-gray-600 text-center">Qtd</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Preço Un.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((i: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 text-gray-800">{i.name}</td>
                    <td className="p-3 text-center text-gray-600">{i.quantity}</td>
                    <td className="p-3 text-right text-gray-800">R$ {i.unit_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-gray-600">Subtotal: R$ {data.subtotal.toFixed(2)}</p>
            {data.discount > 0 && <p className="text-red-500">Desconto: - R$ {data.discount.toFixed(2)}</p>}
            <p className="text-2xl font-bold text-gray-900 mt-2">Total: R$ {data.total.toFixed(2)}</p>
          </div>

          <div className="border-t pt-6">
            <button 
              onClick={handleApprove}
              disabled={isPending}
              className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isPending ? 'Processando...' : 'Aceitar Orçamento'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">Ao aceitar, você concorda com a realização dos serviços listados acima.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
