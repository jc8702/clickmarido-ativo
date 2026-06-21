'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/useQuotations';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  rascunho: 'neutral',
  pendente: 'warning',
  enviado: 'primary',
  aceito: 'success',
  rejeitado: 'danger',
  aprovado: 'success',
  pending: 'warning',
  sent: 'primary',
  approved: 'success',
  rejected: 'danger',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  enviado: 'Enviado',
  aceito: 'Aprovado',
  rejeitado: 'Rejeitado',
  aprovado: 'Aprovado',
  pending: 'Pendente',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const columns = ['pendente', 'enviado', 'aceito', 'rejeitado'];

export default function QuotationsPage() {
  const { user, logout } = useAuth();
  const authUser = user as { email: string } | null;
  const { data, isLoading, mutate } = useQuotations(undefined, 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    mutate();
  }, [mutate]);

  if (!mounted) return null;

  const quotations = data?.data || [];

  const getQuotationsByStatus = (status: string) =>
    quotations.filter((q: any) => q.status === status);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 mb-1">Orçamentos</h1>
            <p className="text-neutral-600">{quotations.length} orçamentos</p>
          </div>
          <Link href="/quotations/new">
            <Button>Novo Orçamento</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-neutral-600 animate-fade-in">Carregando...</div>
        ) : quotations.length === 0 ? (
          <Card gradient="none" shadow="md">
            <div className="text-center py-12 text-neutral-500">Nenhum orçamento encontrado</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {columns.map((status) => (
              <div key={status}>
                <h3 className="font-semibold text-neutral-900 mb-4 capitalize">
                  {statusLabels[status] || status}
                </h3>
                <div className="space-y-4">
                  {getQuotationsByStatus(status).map((quotation: any) => (
                    <Link key={quotation.id} href={`/quotations/${quotation.id}`}>
                      <Card interactive className="animate-fade-in">
                        <div className="mb-4">
                          <p className="font-semibold text-neutral-900">{quotation.customer?.name || 'Cliente'}</p>
                          <p className="text-sm text-neutral-600">
                            R$ {quotation.total?.toFixed(2) || '0,00'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('pt-BR') : ''}
                          </span>
                          <Badge variant={statusColors[quotation.status] || 'neutral'} size="sm">
                            {statusLabels[quotation.status] || quotation.status}
                          </Badge>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
