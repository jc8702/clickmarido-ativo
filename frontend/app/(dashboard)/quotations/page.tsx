'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuotations, useSendQuotation, useApproveQuotation } from '@/hooks/useQuotations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { CardShimmer } from '@/components/Shimmer';

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
  const authUser = user as { email: string } | null;
  
  const { data, isLoading, mutate } = useQuotations(undefined, 1);
  const [mounted, setMounted] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const quotations = (data?.data || []) as Quotation[];

  useEffect(() => {
    if (typeof window !== 'undefined' && quotations.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const found = quotations.find(q => q.id === id);
        if (found) {
          setSelectedQuotation(found);
        }
      }
    }
  }, [quotations]);

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

  const handleSend = async (id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'enviado' }),
      });
      if (response.ok) {
        mutate();
        // Atualiza drawer
        const updated = quotations.find(q => q.id === id);
        if (updated) setSelectedQuotation({ ...updated, status: 'enviado' });
      } else {
        alert('Erro ao enviar orçamento.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'aceito' }),
      });
      if (response.ok) {
        mutate();
        const updated = quotations.find(q => q.id === id);
        if (updated) setSelectedQuotation({ ...updated, status: 'aceito' });
      } else {
        alert('Erro ao aprovar orçamento.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Deseja realmente rejeitar este orçamento?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'rejeitado' }),
      });
      if (response.ok) {
        mutate();
        const updated = quotations.find(q => q.id === id);
        if (updated) setSelectedQuotation({ ...updated, status: 'rejeitado' });
      } else {
        alert('Erro ao rejeitar orçamento.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col relative overflow-x-hidden">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/customers', label: 'Clientes' },
          { href: '/quotations', label: 'Orçamentos' },
          { href: '/service-orders', label: 'Ordens de Serviço' },
          { href: '/payments', label: 'Pagamentos' },
          { href: '/warranties', label: 'Garantias' },
        ]}
        user={authUser ? { name: 'Admin', email: authUser.email } : { name: 'Admin', email: 'admin@clickmarido.local' }}
        onLogout={logout}
      />

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
            {columns.map((status) => (
              <div key={status} className="bg-neutral-100/60 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200/40 dark:border-neutral-700/40 min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm tracking-wide uppercase">
                    {statusLabels[status] || status}
                  </h3>
                  <Badge variant={statusColors[status] || 'neutral'} size="sm">
                    {getQuotationsByStatus(status).length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {getQuotationsByStatus(status).map((quotation) => (
                    <div 
                      key={quotation.id} 
                      onClick={() => setSelectedQuotation(quotation)}
                      className="cursor-pointer bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/70 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      <div className="mb-3">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight mb-1 truncate">
                          {quotation.customer?.name || 'Cliente'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          ID: {quotation.id.slice(-6).toUpperCase()}
                        </p>
                      </div>

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
                  {getQuotationsByStatus(status).length === 0 && (
                    <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs border border-dashed border-neutral-300/60 dark:border-neutral-600/60 rounded-xl">
                      Sem orçamentos
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Backdrop do Drawer */}
      {selectedQuotation && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1040] animate-fade-in"
          onClick={() => setSelectedQuotation(null)}
        />
      )}

      {/* Gaveta de Detalhes do Orçamento */}
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
                onClick={() => setSelectedQuotation(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Cliente */}
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

              {/* Status e Infos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Status Atual</h4>
                  <Badge variant={statusColors[selectedQuotation.status] || 'neutral'}>
                    {statusLabels[selectedQuotation.status] || selectedQuotation.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Data de Criação</h4>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                    {new Date(selectedQuotation.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Itens */}
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

              {/* Notas */}
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
