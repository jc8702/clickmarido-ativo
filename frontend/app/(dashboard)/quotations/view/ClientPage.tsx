'use client';

import React, { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicQuotation, useApproveQuotation, useRejectQuotation } from '../../../../hooks/useQuotations';

function QuotationContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const { data, isLoading, error } = usePublicQuotation(token || '');
  const { mutateAsync: approve, isPending: isApproving } = useApproveQuotation();
  const { mutateAsync: reject, isPending: isRejecting } = useRejectQuotation();

  const [approved, setApproved] = React.useState(false);
  const [rejected, setRejected] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectForm, setShowRejectForm] = React.useState(false);

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"><p>Token inválido ou não fornecido.</p></div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900"><p className="text-neutral-500 dark:text-neutral-400">Carregando orçamento...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded shadow text-center max-w-sm border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Ops!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">{error || 'Orçamento não encontrado.'}</p>
        </div>
      </div>
    );
  }

  if (approved || data.status === 'approved' || data.status === 'aceito') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-green-900/20 p-4">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded shadow text-center max-w-md w-full border-t-4 border-green-500 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">Orçamento Aprovado! ✅</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">Obrigado pela confiança, {data.customer_name}. Uma Ordem de Serviço foi gerada e nossa equipe entrará em contato em breve.</p>
        </div>
      </div>
    );
  }

  if (rejected || data.status === 'rejeitado') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded shadow text-center max-w-md w-full border-t-4 border-red-500 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Orçamento Reprovado</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">Entendemos, {data.customer_name}. Caso tenha alguma dúvida ou queira uma nova proposta, entre em contato conosco.</p>
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

  const handleReject = async () => {
    try {
      await reject(token, rejectReason);
      setRejected(true);
    } catch (err) {
      alert('Erro ao tentar rejeitar o orçamento. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Proposta de Serviço</h1>
          <p className="opacity-90 mt-1">Orçamento nº {data.number}</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Olá,</p>
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{data.customer_name}</p>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm">Segue abaixo o detalhamento dos serviços propostos. Esta proposta é válida até <strong>{new Date(data.valid_until).toLocaleDateString()}</strong>.</p>
            {data.executionDeadline && (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-sm">Prazo de execução: <strong>{data.executionDeadline}</strong></p>
            )}
            {data.paymentMethod && (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-sm">Forma de pagamento: <strong>
                {data.paymentMethod === 'CARTAO_CREDITO' 
                  ? `Cartão de Crédito ${data.installments || 1}x`
                  : data.paymentMethod === 'DINHEIRO' 
                    ? 'Dinheiro'
                    : 'PIX'
                }
              </strong></p>
            )}
          </div>

          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
                <tr>
                  <th className="p-3 font-medium text-neutral-600 dark:text-neutral-300">Serviço</th>
                  <th className="p-3 font-medium text-neutral-600 dark:text-neutral-300 text-center">Qtd</th>
                  <th className="p-3 font-medium text-neutral-600 dark:text-neutral-300 text-right">Preço Un.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {data.items.map((i: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 text-neutral-800 dark:text-neutral-200">{i.name}</td>
                    <td className="p-3 text-center text-neutral-600 dark:text-neutral-400">{i.quantity}</td>
                    <td className="p-3 text-right text-neutral-800 dark:text-neutral-200">R$ {Number(i.unit_price || i.unitPrice || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-neutral-600 dark:text-neutral-400">Subtotal: R$ {Number(data.subtotal || 0).toFixed(2)}</p>
            {data.marginPercentage > 0 && (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                + Folga ({data.marginPercentage}%): R$ {(Number(data.subtotal || 0) * (Number(data.marginPercentage) / 100)).toFixed(2)}
              </p>
            )}
            {data.discountPercentage > 0 && (
              <p className="text-red-500 dark:text-red-400">
                Desconto ({data.discountPercentage}%): - R$ {(() => {
                  const subtotal = Number(data.subtotal || 0);
                  const marginAmount = subtotal * (Number(data.marginPercentage || 0) / 100);
                  const subtotalWithMargin = subtotal + marginAmount;
                  return (subtotalWithMargin * (Number(data.discountPercentage) / 100)).toFixed(2);
                })()}
              </p>
            )}
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">Total: R$ {Number(data.total || 0).toFixed(2)}</p>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-4">
            {!showRejectForm ? (
              <>
                <button 
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isApproving ? 'Processando...' : 'Aceitar Orçamento'}
                </button>
                <button 
                  onClick={() => setShowRejectForm(true)}
                  disabled={isRejecting}
                  className="w-full py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors flex justify-center items-center gap-2"
                >
                  Reprovar Orçamento
                </button>
                <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">Ao aceitar, você concorda com a realização dos serviços listados acima.</p>
              </>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-4">
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Motivo da Reprovação (opcional)</h3>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Preço alto, prazo longo, não necessito mais do serviço..."
                  className="w-full p-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-2.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isRejecting ? 'Processando...' : 'Confirmar Reprovação'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicQuotationView() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"><p>Carregando...</p></div>}>
      <QuotationContent />
    </React.Suspense>
  );
}
