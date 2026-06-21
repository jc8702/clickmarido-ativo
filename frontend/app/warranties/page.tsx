'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';

interface Warranty {
  id: string;
  quotationId: string;
  customerId: string;
  service_description: string;
  expiry_date: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  quotation?: {
    total: number;
    status: string;
  };
}

export default function WarrantiesPage() {
  const { user, logout } = useAuth();
  const authUser = user as { email: string } | null;
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWarrantyId, setActiveWarrantyId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warranties');
      const warrantiesData = res.data?.data || res.data || [];
      
      if (warrantiesData.length > 0) {
        setWarranties(warrantiesData);
      } else {
        // Fallback de demonstração
        setWarranties([
          {
            id: 'war_1',
            quotationId: 'quot_1',
            customerId: 'cust_1',
            service_description: 'Instalação Elétrica Completa e Manutenção de Disjuntores',
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            customer: {
              name: 'João Silva',
              email: 'joao@example.com',
              phone: '11 99999999',
            },
            quotation: {
              total: 2500,
              status: 'aceito',
            }
          },
          {
            id: 'war_2',
            quotationId: 'quot_2',
            customerId: 'cust_2',
            service_description: 'Reparo Hidráulico Geral no Banheiro Principal',
            expiry_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000).toISOString(),
            customer: {
              name: 'Maria Santos',
              email: 'maria@example.com',
              phone: '11 99999998',
            },
            quotation: {
              total: 1800,
              status: 'aceito',
            }
          }
        ]);
      }
    } catch (err) {
      console.error('Erro ao listar garantias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const isExpired = (expiryDateStr: string) => {
    return new Date(expiryDateStr) < new Date();
  };

  const handleClaimWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarrantyId || !notes) return;
    setClaimLoading(true);
    try {
      await api.post(`/warranties/${activeWarrantyId}/claim`, { notes });
      alert('Ordem de Serviço de reparo em garantia (R$ 0,00) criada e agendada com sucesso!');
      setActiveWarrantyId(null);
      setNotes('');
      fetchWarranties();
    } catch (err) {
      console.error(err);
      alert('Erro ao acionar garantia.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 mb-1">Garantias</h1>
            <p className="text-neutral-600">Histórico de vigência e cobertura dos serviços prestados</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 animate-fade-in">Carregando...</div>
        ) : warranties.length === 0 ? (
          <Card gradient="none" shadow="md">
            <div className="text-center py-12 text-neutral-500">Nenhuma garantia registrada</div>
          </Card>
        ) : (
          <Card shadow="lg" className="border border-neutral-100 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Código</TableHeader>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader>Serviço Coberto</TableHeader>
                  <TableHeader>Valor OS (R$)</TableHeader>
                  <TableHeader>Expiração</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {warranties.map((row) => {
                  const expired = isExpired(row.expiry_date);
                  return (
                    <TableRow key={row.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <TableCell className="font-medium font-mono text-xs text-neutral-500">
                        {row.id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/customers?id=${row.customerId}`} 
                          className="font-semibold text-neutral-800 hover:text-primary-600 hover:underline transition-colors"
                        >
                          <div className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{row.customer?.name || 'Cliente'}</div>
                          <div className="text-xs text-neutral-500 font-normal">{row.customer?.email}</div>
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-neutral-600 font-medium" title={row.service_description}>
                        {row.service_description}
                      </TableCell>
                      <TableCell className="font-bold text-neutral-800">
                        <Link 
                          href={`/quotations?id=${row.quotationId}`} 
                          className="hover:text-primary-600 hover:underline transition-colors"
                        >
                          {row.quotation?.total ? `R$ ${Number(row.quotation.total).toFixed(2)}` : 'R$ 0,00'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expired ? 'danger' : 'success'} size="sm" className="shadow-sm">
                          {expired ? 'Expirada' : 'Ativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!expired ? (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => {
                              setActiveWarrantyId(row.id);
                              setNotes('');
                            }}
                          >
                            Acionar Garantia
                          </Button>
                        ) : (
                          <span className="text-neutral-400 text-xs font-semibold">Sem cobertura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        )}
      </main>

      <Modal
        isOpen={activeWarrantyId !== null}
        onClose={() => setActiveWarrantyId(null)}
        title="Acionar Garantia de Reparo"
      >
        <form onSubmit={handleClaimWarranty} className="space-y-4 text-neutral-800">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Descreva detalhadamente a falha técnica ou reclamação do cliente. Isso gerará uma nova Ordem de Serviço agendada com valor R$ 0,00 para execução do reparo.
          </p>
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Notas da Falha / Problema Reclamado
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 focus:outline-none transition-all duration-200 rounded-lg text-sm font-semibold text-neutral-800 shadow-sm placeholder:text-neutral-400"
              rows={4}
              placeholder="Descreva o que houve (ex: O disjuntor voltou a desarmar ao ligar o chuveiro)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button variant="outline" type="button" onClick={() => setActiveWarrantyId(null)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={claimLoading}>
              Agendar Reparo (OS)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
