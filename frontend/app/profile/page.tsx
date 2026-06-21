'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Navigation } from '@/components/Navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const authUser = user as { email?: string } | null;
  const [saved, setSaved] = useState(false);

  const defaultEmail = authUser?.email || 'jose@clickmarido.local';
  const [formData, setFormData] = useState({
    name: 'José',
    email: defaultEmail,
    phone: '(11) 99999-9999',
    company: 'Click Marido Serviços',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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
        user={authUser ? { name: 'Admin', email: authUser.email || 'admin@clickmarido.local' } : { name: 'Admin', email: 'admin@clickmarido.local' }}
        onLogout={logout}
      />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1">Meu Perfil</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Suas informações pessoais e da empresa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nome da empresa"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" isLoading={false}>
                {saved ? '✓ Salvo!' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {saved && (
          <div className="mt-4 animate-slide-down">
            <div className="p-3 bg-success-50 dark:bg-success-900/30 border-l-4 border-success-600 text-success-900 dark:text-success-200 rounded-md text-sm">
              Informações salvas com sucesso!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
