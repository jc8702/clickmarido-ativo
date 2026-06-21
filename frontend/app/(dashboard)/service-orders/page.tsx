'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Navigation } from '@/components/Navigation';
import ServiceOrderForm from '../../../components/ServiceOrderForm';
import CreateServiceOrderForm from '../../../components/CreateServiceOrderForm';
import { useAuth } from '@/hooks/useAuth';

interface ServiceOrder {
  id: string;
  customerId: string;
  customer_name: string;
  scheduled_date: string;
  status: 'agendada' | 'em_progresso' | 'concluida' | 'cancelada';
  amount: number;
}

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  agendada: 'primary',
  em_progresso: 'warning',
  concluida: 'success',
  cancelada: 'danger',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  em_progresso: 'Em Progresso',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export default function ServiceOrdersPage() {
  const { user, logout } = useAuth();
  const authUser = user as { email: string } | null;
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Erro ao buscar ordens de serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await api.patch(`/service-orders/${id}/start`);
      fetchOrders();
    } catch (err) {
      alert('Erro ao iniciar a OS.');
    }
  };

  const selectedOrder = orders.find(o => o.id === activeModalId);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/customers', label: 'Clientes' },
          { href: '/quotations', label: 'Orçamentos' },
          { href: '/products', label: 'Serviços e Peças' },
          { href: '/service-orders', label: 'Ordens de Serviço' },
          { href: '/payments', label: 'Pagamentos' },
          { href: '/warranties', label: 'Garantias' },
        ]}
        user={authUser ? { name: 'Admin', email: authUser.email } : { name: 'Admin', email: 'admin@clickmarido.local' }}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Ordens de Serviço</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Gerenciamento e execução dos serviços agendados</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
            + Criar Ordem Manual
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400 animate-fade-in">Carregando...</div>
        ) : orders.length === 0 ? (
          <Card gradient="none" shadow="md">
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Nenhuma ordem de serviço encontrada</div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 dark:border-neutral-700 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>ID (Ref)</TableHeader>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader>Data Prevista</TableHeader>
                  <TableHeader>Valor (R$)</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {orders.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <TableCell className="font-medium">
                      <Link 
                        href={`/quotations?id=${row.id}`} 
                        className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline bg-neutral-100/80 dark:bg-neutral-700/80 px-2 py-1 rounded font-bold"
                      >
                        {row.id.slice(-6).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/customers?id=${row.customerId}`} 
                        className="font-semibold text-neutral-800 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                      >
                        {row.customer_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-neutral-600 dark:text-neutral-400">
                      {row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold text-neutral-800 dark:text-neutral-200">
                      {row.amount ? `R$ ${Number(row.amount).toFixed(2)}` : 'R$ 0,00'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[row.status] || 'neutral'} size="sm" className="shadow-sm">
                        {statusLabels[row.status] || row.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {row.status === 'agendada' && (
                          <Button variant="primary" size="sm" onClick={() => handleStart(row.id)}>
                            Iniciar
                          </Button>
                        )}
                        {row.status === 'em_progresso' && (
                          <Button variant="secondary" size="sm" onClick={() => setActiveModalId(row.id)}>
                            Concluir
                          </Button>
                        )}
                        {row.status !== 'agendada' && row.status !== 'em_progresso' && (
                          <span className="text-neutral-400 dark:text-neutral-500 text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </main>

      <Modal
        isOpen={activeModalId !== null}
        onClose={() => setActiveModalId(null)}
        title="Concluir Ordem de Serviço"
      >
        {selectedOrder && (
          <ServiceOrderForm
            so={selectedOrder}
            onCancel={() => setActiveModalId(null)}
            onSuccess={() => {
              setActiveModalId(null);
              fetchOrders();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Agendar Nova Ordem de Serviço"
      >
        <CreateServiceOrderForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchOrders();
          }}
        />
      </Modal>
    </div>
  );
}
