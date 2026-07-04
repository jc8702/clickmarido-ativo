'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useVendors } from '@/hooks/useVendors';
import { useAuth } from '@/hooks/useAuth';
import { PurchaseOrderStatusBadge } from '@/components/purchases/PurchaseOrderStatusBadge';
import { Shimmer } from '@/components/Shimmer';

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: vendorsData } = useVendors(1, '', '', '', 'true');
  const vendors = vendorsData?.data || [];

  const { data, isLoading, error, mutate } = usePurchaseOrders({
    page,
    search,
    status,
    vendorId,
    dateFrom,
    dateTo
  });

  const { getToken } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Tem certeza absoluta que deseja EXCLUIR a ordem de compra ${number}? Esta ação não pode ser desfeita e removerá eventuais despesas vinculadas no financeiro.`)) return;

    setDeletingId(id);
    try {
      const token = getToken();
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao excluir ordem de compra');
      }

      alert('Ordem de compra excluída com sucesso!');
      mutate();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ordem de compra');
    } finally {
      setDeletingId(null);
    }
  };

  const orders = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ordens de Compra</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Emissão e controle de pedidos de compra de insumos e ferramentas.</p>
        </div>
        <Link 
          href="/purchases/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-semibold text-sm shadow transition-colors"
        >
          + Emitir Ordem de Compra
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded shadow border border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Buscar por Código / Comprador</label>
            <input
              type="text"
              placeholder="Ex: OC-2026-000001..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Fornecedor</label>
            <select
              value={vendorId}
              onChange={(e) => {
                setVendorId(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Todos</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Status da OC</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="emitida">Emitida</option>
              <option value="aprovada">Aprovada</option>
              <option value="parcialmente_recebida">Parcialmente Recebida</option>
              <option value="recebida">Recebida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Data De</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Data Até</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <Shimmer className="h-64 w-full" />
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
          Erro ao listar ordens de compra: {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded shadow overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700/30 text-neutral-600 dark:text-neutral-300 font-medium">
                <tr>
                  <th className="px-6 py-3 text-left">Código OC</th>
                  <th className="px-6 py-3 text-left">Fornecedor</th>
                  <th className="px-6 py-3 text-left">Emissão</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Solicitante</th>
                  <th className="px-6 py-3 text-right">Itens</th>
                  <th className="px-6 py-3 text-right">Valor Total</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 text-neutral-800 dark:text-neutral-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-neutral-500 dark:text-neutral-400">
                      Nenhuma ordem de compra encontrada.
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const isEditable = ['rascunho', 'emitida', 'aprovada', 'parcialmente_recebida'].includes(order.status) && order.expense?.status !== 'paga';
                    const isDeletable = ['rascunho', 'emitida', 'cancelada', 'aprovada'].includes(order.status) && order.expense?.status !== 'paga';

                    return (
                      <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                        <td className="px-6 py-4 font-semibold text-primary-600 dark:text-primary-400">
                          <Link href={`/purchases/${order.id}`}>
                            {order.number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {order.vendor?.name}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(order.issueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <PurchaseOrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                          {order.requestedBy || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {order._count?.items || 0}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <Link 
                              href={`/purchases/${order.id}`} 
                              className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-semibold text-xs shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-750 transition-colors"
                            >
                              Ver
                            </Link>
                            {isEditable && (
                              <Link 
                                href={`/purchases/${order.id}/edit`} 
                                className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/60 text-primary-600 dark:text-primary-400 rounded font-semibold text-xs shadow-sm hover:bg-primary-100 dark:hover:bg-primary-950/40 transition-colors"
                              >
                                Editar
                              </Link>
                            )}
                            {isDeletable && (
                              <button 
                                onClick={() => handleDelete(order.id, order.number)}
                                disabled={deletingId === order.id}
                                className="px-2 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 rounded font-semibold text-xs shadow-sm hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                              >
                                {deletingId === order.id ? 'Excluindo...' : 'Excluir'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {meta.totalPages > 1 && (
            <div className="bg-neutral-50 dark:bg-neutral-700/30 px-6 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Mostrando página {meta.page} de {meta.totalPages} ({meta.total} registros)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Anterior
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-semibold disabled:opacity-50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
