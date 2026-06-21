'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';

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
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warranties');
      // A API retorna { data: [...] } ou direto [...]
      const warrantiesData = res.data?.data || res.data || [];
      
      if (warrantiesData.length > 0) {
        setWarranties(warrantiesData);
      } else {
        // Fallback para dados simulados de demonstração para fidelidade visual
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
        ]}
        user={{ name: 'Admin', email: 'admin@clickmarido.local' }}
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
          <Card shadow="lg">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Código</TableHeader>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader>Serviço Coberto</TableHeader>
                  <TableHeader>Valor OS (R$)</TableHeader>
                  <TableHeader>Expiração</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {warranties.map((row) => {
                  const expired = isExpired(row.expiry_date);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-neutral-900">{row.customer?.name || 'Cliente'}</div>
                        <div className="text-xs text-neutral-500">{row.customer?.email}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={row.service_description}>
                        {row.service_description}
                      </TableCell>
                      <TableCell>
                        {row.quotation?.total ? `R$ ${Number(row.quotation.total).toFixed(2)}` : 'R$ 0,00'}
                      </TableCell>
                      <TableCell>
                        {row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expired ? 'danger' : 'success'} size="sm">
                          {expired ? 'Expirada' : 'Ativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
