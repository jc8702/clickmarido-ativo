'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/useQuotations';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/hooks/useAuth';
import { CardShimmer } from '@/components/Shimmer';

import { useEscapeToClose } from '@/hooks/useEscapeToClose';

interface QuotationItem {
  description: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Quotation {
  id: string;
  customerId: string;
  total: number;
  status: string;
  notes: string;
  createdAt: string;
  items: string | QuotationItem[];
  customer?: Customer;
}

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  rascunho: 'neutral',
  pendente: 'warning',
  enviado: 'primary',
  aceito: 'success',
  aprovado: 'success',
  rejeitado: 'danger',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  enviado: 'Enviado',
  aceito: 'Aprovado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const columns = ['rascunho', 'pendente', 'enviado', 'aceito', 'rejeitado'];

export default function QuotationsPage() {
  const { user, logout } = useAuth();
  const authUser = user as { name?: string; email: string; role: string } | null;

  const { data, isLoading, mutate } = useQuotations(undefined, 1);
  const [mounted, setMounted] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  useEscapeToClose(selectedQuotation !== null, () => setSelectedQuotation(null));

  useEffect(() => {
    setMounted(true);
  }, []);

  const quotations = (data?.data || []) as Quotation[];

  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && quotations.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const found = quotations.find(q => q.id === id);
        if (found) {
          setSelectedQuotation(found);
        }
      }
    }
  }, [mounted, quotations]);

  const closeDrawer = useCallback(() => {
    setSelectedQuotation(null);
  }, []);

  if (!mounted) return null;

  const getQuotationsByStatus = (status: string) =>
    quotations.filter((q: any) => q.status === status);

  const getQuotationItems = (itemsField: string | QuotationItem[]): QuotationItem[] => {
    try {
      return typeof itemsField === 'string'
        ? JSON.parse(itemsField)
        : itemsField || [];
    } catch {
      return [];
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        mutate();
        if (selectedQuotation?.id === id) {
          setSelectedQuotation(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, quotationId: string) => {
    e.dataTransfer.setData('text/plain', quotationId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(quotationId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const quotationId = e.dataTransfer.getData('text/plain');
    if (quotationId && targetStatus) {
      updateStatus(quotationId, targetStatus);
    }
    setDraggedId(null);
    setDragOverStatus(null);
  };

  const handleSend = async (id: string) => {
    setActionLoading(true);
    try {
      await updateStatus(id, 'enviado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await updateStatus(id, 'aceito');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Deseja realmente rejeitar este orçamento?')) return;
    setActionLoading(true);
    try {
      await updateStatus(id, 'rejeitado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!confirm('Deseja realmente excluir este orçamento definitivamente?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        mutate();
        closeDrawer();
      } else {
        alert('Erro ao excluir orçamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir orçamento.');
    } finally {
      setActionLoading(false);
    }
  };

  const getValidityStatus = (createdAtString: string, status: string) => {
    if (status === 'aceito' || status === 'aprovado' || status === 'rejeitado') return null;
    const createdDate = new Date(createdAtString);
    const today = new Date();
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 15) {
      return { label: 'Expirado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    } else if (diffDays > 12) {
      return { label: `Expira em ${15 - diffDays} dias`, color: 'bg-yellow-100 text-yellow-850 dark:bg-yellow-900/30 dark:text-yellow-300' };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col relative overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Orçamentos</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {isLoading ? 'Carregando orçamentos...' : `Quadro Kanban com ${quotations.length} orçamentos`}
            </p>
          </div>
          <Link href="/quotations/new">
            <Button className="shadow-md hover:shadow-lg transition-all duration-300">
              + Novo Orçamento
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                <CardShimmer />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
            {columns.map((status) => {
              const items = getQuotationsByStatus(status);
              const isDragOver = dragOverStatus === status;

              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`bg-neutral-100/60 dark:bg-neutral-800/60 p-4 rounded-2xl border transition-colors duration-200 min-h-[500px] ${
                    isDragOver
                      ? 'border-primary-400 dark:border-primary-500 bg-primary-50/40 dark:bg-primary-900/20'
                      : 'border-neutral-200/40 dark:border-neutral-700/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm tracking-wide uppercase">
                      {statusLabels[status] || status}
                    </h3>
                    <Badge variant={statusColors[status] || 'neutral'} size="sm">
                      {items.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((quotation) => (
                      <div
                        key={quotation.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, quotation.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedQuotation(quotation)}
                        className={`cursor-grab active:cursor-grabbing bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/70 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600 select-none ${
                          draggedId === quotation.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <div className="mb-3">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight mb-1 truncate">
                            {quotation.customer?.name || 'Cliente'}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            ID: {quotation.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        {getValidityStatus(quotation.createdAt, quotation.status) && (
                          <div className="mb-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              getValidityStatus(quotation.createdAt, quotation.status)!.color
                            }`}>
                              {getValidityStatus(quotation.createdAt, quotation.status)!.label}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('pt-BR') : ''}
                          </span>
                          <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
                            R$ {quotation.total?.toFixed(2) || '0,00'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs border border-dashed border-neutral-300/60 dark:border-neutral-600/60 rounded-xl">
                        Sem orçamentos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedQuotation && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1040] animate-fade-in"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-neutral-800 shadow-2xl z-[1050] transition-transform duration-300 transform flex flex-col ${
          selectedQuotation ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedQuotation && (
          <>
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-50 dark:from-neutral-700 to-white dark:to-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Detalhes do Orçamento</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">ID: {selectedQuotation.id}</p>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Cliente</h4>
                <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">{selectedQuotation.customer?.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{selectedQuotation.customer?.email}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{selectedQuotation.customer?.phone}</div>
                  </div>
                  <Link href={`/customers`}>
                    <Button size="xs" variant="outline">Ver Ficha</Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Status Atual</h4>
                  <Badge variant={statusColors[selectedQuotation.status] || 'neutral'}>
                    {statusLabels[selectedQuotation.status] || selectedQuotation.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Validade</h4>
                  {getValidityStatus(selectedQuotation.createdAt, selectedQuotation.status) ? (
                    <span className={`text-[11px] px-2 py-1 rounded font-bold uppercase ${
                      getValidityStatus(selectedQuotation.createdAt, selectedQuotation.status)!.color
                    }`}>
                      {getValidityStatus(selectedQuotation.createdAt, selectedQuotation.status)!.label}
                    </span>
                  ) : (
                    <span className="text-xs text-green-605 dark:text-green-400 font-bold uppercase">Válido</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Data de Criação</h4>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                    {new Date(selectedQuotation.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Itens do Serviço</h4>
                <div className="border border-neutral-100 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-neutral-800">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700">
                        <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300">Descrição</th>
                        <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 text-center">Qtd</th>
                        <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getQuotationItems(selectedQuotation.items).map((item, idx) => (
                        <tr key={idx} className="border-b border-neutral-50 dark:border-neutral-700 last:border-0">
                          <td className="p-3 font-medium text-neutral-800 dark:text-neutral-200">{item.description}</td>
                          <td className="p-3 text-center text-neutral-600 dark:text-neutral-400">{item.quantity}</td>
                          <td className="p-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Observações</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 italic border-l-4 border-primary-500">
                    "{selectedQuotation.notes}"
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Valor Total</span>
                <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                  R$ {selectedQuotation.total?.toFixed(2) || '0,00'}
                </span>
              </div>

              <div className="flex gap-2">
                {selectedQuotation.status === 'rascunho' && (
                  <Button
                    className="flex-1"
                    onClick={() => handleSend(selectedQuotation.id)}
                    isLoading={actionLoading}
                  >
                    Enviar ao Cliente
                  </Button>
                )}
                {(selectedQuotation.status === 'rascunho' || selectedQuotation.status === 'enviado' || selectedQuotation.status === 'pendente') && (
                  <>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleApprove(selectedQuotation.id)}
                      isLoading={actionLoading}
                    >
                      Aprovar (Gerar OS)
                    </Button>
                    <Button
                      variant="danger"
                      className="px-4"
                      onClick={() => handleReject(selectedQuotation.id)}
                      isLoading={actionLoading}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                {selectedQuotation.status === 'aceito' && (
                  <div className="w-full text-center py-2.5 bg-success-50 dark:bg-success-900/30 text-success-800 dark:text-success-200 font-bold rounded-lg border border-success-200 dark:border-success-800 text-sm">
                    ✓ Serviço Aprovado & Ordem de Serviço Criada!
                  </div>
                )}
                {selectedQuotation.status === 'rejeitado' && (
                  <div className="w-full text-center py-2.5 bg-danger-50 dark:bg-red-900/30 text-danger-800 dark:text-red-200 font-bold rounded-lg border border-danger-200 dark:border-red-800 text-sm">
                    ✕ Orçamento Rejeitado
                  </div>
                )}
                <Button
                  variant="secondary"
                  className="px-4"
                  onClick={() => {
                    window.location.href = `/quotations/${selectedQuotation.id}`;
                  }}
                >
                  Editar Itens
                </Button>
                <Button
                  variant="danger"
                  className="px-4"
                  onClick={() => handleDeleteQuotation(selectedQuotation.id)}
                  isLoading={actionLoading}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
