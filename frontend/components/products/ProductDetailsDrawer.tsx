'use client';

import React, { useState, useEffect } from 'react';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  price: number;
  unit: string;
  category: string;
  active: boolean;
  vendorId?: string;
  vendor?: {
    id: string;
    name: string;
    cnpjCpf?: string;
  };
}

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailsDrawer({ product, onClose }: Props) {
  useEscapeToClose(product !== null, onClose);

  const [historyData, setHistoryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${product.id}/purchase-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erro ao carregar histórico do SKU');
        const data = await response.json();
        setHistoryData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [product]);

  if (!product) return null;

  const timeline = historyData?.timeline || [];
  const stats = historyData?.stats || { totalSpent: 0, totalQty: 0, avgPrice: 0, lastPurchasePrice: null, lastPurchaseVendor: null };

  // Calcular margem de lucro com base no preço médio de compra
  const sellingPrice = product.price;
  const avgCost = stats.avgPrice;
  const markupPercentage = sellingPrice > 0 && avgCost > 0 
    ? ((sellingPrice - avgCost) / sellingPrice) * 100 
    : null;

  return (
    <div className="fixed inset-0 z-[1050] flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 h-full shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-start bg-neutral-50 dark:bg-neutral-850">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                SKU: {product.sku}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                product.type === 'SERVICO'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {product.type === 'SERVICO' ? 'Serviço' : 'Peça'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                product.active
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
              }`}>
                {product.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              {product.name}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Família/Categoria: {product.category || 'Não definida'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Corpo principal scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Card de Informações e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-700/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-750">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Preço de Venda</span>
              <span className="text-3xl font-bold text-neutral-950 dark:text-neutral-50">
                R$ {sellingPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-1">
                Cobrado por {product.unit}
              </span>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-700/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-750 flex flex-col justify-between">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Fornecedor Padrão</span>
                <span className="text-md font-semibold text-neutral-900 dark:text-neutral-100">
                  {product.vendor?.name || 'Nenhum atrelado'}
                </span>
              </div>
              {product.vendor?.cnpjCpf && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  CNPJ: {product.vendor.cnpjCpf}
                </span>
              )}
            </div>
          </div>

          {/* Card de Métricas de Compra */}
          {product.type === 'PECA' && (
            <div className="bg-neutral-50 dark:bg-neutral-700/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-750">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Resumo Financeiro de Compras</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Total Gasto</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    R$ {stats.totalSpent.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Qtd. Comprada</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.totalQty} {product.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Custo Médio</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    R$ {stats.avgPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Margem Bruta</span>
                  <span className={`text-lg font-bold block ${markupPercentage && markupPercentage > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    {markupPercentage !== null ? `${markupPercentage.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
              {stats.lastPurchasePrice && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-xs text-neutral-550 dark:text-neutral-400">
                  <span>Último preço pago: <strong>R$ {stats.lastPurchasePrice.toFixed(2).replace('.', ',')}</strong></span>
                  <span>Fornecedor: <strong>{stats.lastPurchaseVendor}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span>Timeline e Histórico do SKU</span>
              {isLoading && (
                <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 animate-pulse">
                  (Atualizando...)
                </span>
              )}
            </h3>

            {isLoading && !historyData ? (
              <div className="py-10 text-center text-neutral-500 dark:text-neutral-400">
                <span className="inline-block animate-spin text-xl mr-2">⚙️</span> Carregando timeline...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-neutral-450 dark:text-neutral-500 border-2 border-dashed border-neutral-100 dark:border-neutral-750 rounded-xl">
                Nenhum evento registrado para este SKU ainda.
              </div>
            ) : (
              <div className="relative border-l-2 border-neutral-200 dark:border-neutral-700 ml-4 pl-6 space-y-6">
                {timeline.map((event: any) => {
                  let dotColor = 'bg-neutral-400';
                  let eventIcon = '📝';

                  if (event.type === 'CREATION') {
                    dotColor = 'bg-purple-500';
                    eventIcon = '✨';
                  } else if (event.type === 'VENDOR_CHANGE') {
                    dotColor = 'bg-amber-500';
                    eventIcon = '🔄';
                  } else if (event.type === 'PURCHASE') {
                    dotColor = event.status === 'recebido' ? 'bg-green-500' : 'bg-blue-500';
                    eventIcon = '🛒';
                  }

                  return (
                    <div key={event.id} className="relative">
                      {/* Bolinha na timeline */}
                      <span className={`absolute -left-[31px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-neutral-800 text-[10px] ${dotColor} text-white`}>
                        {eventIcon}
                      </span>
                      
                      <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-750/50 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start flex-col sm:flex-row gap-1 mb-2">
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            {event.description}
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {new Date(event.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {event.type === 'PURCHASE' && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-xs">
                            <div>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Fornecedor</span>
                              <strong className="text-neutral-900 dark:text-neutral-100">{event.vendorName}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Quantidade</span>
                              <strong className="text-neutral-900 dark:text-neutral-100">
                                {event.quantity} {event.unit}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Preço Unitário</span>
                              <strong className="text-neutral-950 dark:text-neutral-50">
                                R$ {event.unitPrice.toFixed(2).replace('.', ',')}
                              </strong>
                            </div>
                            <div className="col-span-2 sm:col-span-3 mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 flex justify-between">
                              <span>Subtotal: <strong>R$ {event.subtotal.toFixed(2).replace('.', ',')}</strong></span>
                              <span className={`font-semibold capitalize ${
                                event.status === 'recebido' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : event.status === 'rascunho'
                                    ? 'text-neutral-500 dark:text-neutral-400'
                                    : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                Status: {event.status}
                              </span>
                            </div>
                          </div>
                        )}

                        {event.type === 'VENDOR_CHANGE' && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Alterado por: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{event.createdBy}</span>
                          </p>
                        )}

                        {event.type === 'CREATION' && (
                          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Preço Inicial Cadastrado:
                            </span>
                            <strong className="text-neutral-900 dark:text-neutral-100">
                              R$ {event.price.toFixed(2).replace('.', ',')}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé do Drawer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
