# 🎯 ULTRAPROMPT 3: LAYOUTS + NAVIGATION REDESENHADA

**Executor:** DeepSeek V4 Flash ou Gemini  
**Tempo estimado:** 40-50 minutos  
**Saída esperada:** 3 layouts completamente redesenhados + navegação moderna

---

## 📋 CONTEXTO

Tu és um **Product Designer** especializado em:
- Layouts responsivos e elegantes
- Navegação intuitiva
- Hierarquias visuais claras
- Uso de gradientes e animações
- Mobile-first thinking

**Usa o Design System e Componentes já criados:**
- Paleta: Roxo, Verde, Laranja
- Componentes: Button, Card, Input, Badge, Modal, Toast, Navigation, Table

---

## ✅ MISSÃO

### LAYOUT 1: Dashboard Redesenhada

**Arquivo:** `frontend/app/(dashboard)/dashboard/page.tsx`

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';
import { useState } from 'react';

export default function Dashboard() {
  const [stats] = useState({
    revenue: 12500,
    clients: 24,
    quotations: 8,
    pending: 3,
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/dashboard/customers', label: 'Clientes' },
          { href: '/dashboard/quotations', label: 'Orçamentos' },
        ]}
        user={{ name: 'José', email: 'jose@clickmarido.local' }}
      />

      <main className="max-w-7xl mx-auto px-lg py-xl">
        {/* Header */}
        <div className="mb-2xl">
          <h1 className="h1 mb-md text-neutral-900">Bem-vindo, José</h1>
          <p className="text-neutral-600">Visão geral do seu negócio esta semana</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-2xl">
          {[
            { label: 'Receita', value: `R$ ${stats.revenue}`, icon: '💰', gradient: 'bg-gradient-hero' },
            { label: 'Clientes', value: stats.clients, icon: '👥', gradient: 'bg-gradient-accent' },
            { label: 'Orçamentos', value: stats.quotations, icon: '📋', gradient: 'bg-gradient-subtle' },
            { label: 'Pendentes', value: stats.pending, icon: '⏳', gradient: 'bg-gradient-warning' },
          ].map((stat, i) => (
            <Card key={i} gradient="none" shadow="md">
              <div className={`${stat.gradient} rounded-lg p-lg mb-lg text-white text-2xl`}>{stat.icon}</div>
              <p className="text-sm text-neutral-600 mb-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-lg">
            {/* Recent Quotations */}
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos Recentes</CardTitle>
                <CardDescription>Últimos 5 orçamentos criados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-md">
                  {[
                    { client: 'João Silva', amount: 2500, status: 'pending' },
                    { client: 'Maria Santos', amount: 1800, status: 'approved' },
                    { client: 'Carlos Oliveira', amount: 3200, status: 'sent' },
                  ].map((q, i) => (
                    <div key={i} className="flex items-center justify-between p-md bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">{q.client}</p>
                        <p className="text-sm text-neutral-600">R$ {q.amount}</p>
                      </div>
                      <Badge variant={q.status === 'approved' ? 'success' : 'primary'}>
                        {q.status === 'pending' ? 'Pendente' : q.status === 'approved' ? 'Aprovado' : 'Enviado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-lg">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-md">
                  <Button fullWidth>Novo Orçamento</Button>
                  <Button variant="secondary" fullWidth>Novo Cliente</Button>
                  <Button variant="outline" fullWidth>Ver Relatórios</Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card gradient="subtle">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-md">
                  <div>
                    <p className="text-sm text-neutral-600 mb-sm">Taxa de Conversão</p>
                    <div className="w-full bg-neutral-300 rounded-full h-2">
                      <div className="bg-gradient-hero h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <p className="text-xs text-neutral-600 mt-sm">72%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

### LAYOUT 2: Customers Page Redesenhada

**Arquivo:** `frontend/app/(dashboard)/customers/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers] = useState([
    { id: 1, name: 'João Silva', email: 'joao@example.com', phone: '11 99999999', orders: 5 },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', phone: '11 99999998', orders: 3 },
    { id: 3, name: 'Carlos Oliveira', email: 'carlos@example.com', phone: '11 99999997', orders: 8 },
  ]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/dashboard/customers', label: 'Clientes' },
          { href: '/dashboard/quotations', label: 'Orçamentos' },
        ]}
      />

      <main className="max-w-7xl mx-auto px-lg py-xl">
        {/* Header com Search */}
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="h1 mb-md text-neutral-900">Clientes</h1>
            <p className="text-neutral-600">{filtered.length} clientes cadastrados</p>
          </div>
          <Button>Novo Cliente</Button>
        </div>

        {/* Search Bar */}
        <div className="mb-lg">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabela Redesenhada */}
        <Card shadow="lg">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nome</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Telefone</TableHeader>
                <TableHeader>Orçamentos</TableHeader>
                <TableHeader>Ações</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">
                      {customer.orders}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-sm">
                      <Button size="xs" variant="outline">
                        Editar
                      </Button>
                      <Button size="xs" variant="danger">
                        Deletar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
```

---

### LAYOUT 3: Quotations Page Redesenhada

**Arquivo:** `frontend/app/(dashboard)/quotations/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Navigation } from '@/components/Navigation';

export default function QuotationsPage() {
  const [quotations] = useState([
    {
      id: 1,
      client: 'João Silva',
      amount: 2500,
      status: 'pending',
      date: '2026-06-20',
      items: 3,
    },
    {
      id: 2,
      client: 'Maria Santos',
      amount: 1800,
      status: 'approved',
      date: '2026-06-19',
      items: 2,
    },
    {
      id: 3,
      client: 'Carlos Oliveira',
      amount: 3200,
      status: 'sent',
      date: '2026-06-18',
      items: 5,
    },
  ]);

  const statusColors = {
    pending: 'warning',
    sent: 'primary',
    approved: 'success',
    rejected: 'danger',
  };

  const statusLabels = {
    pending: 'Pendente',
    sent: 'Enviado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        logo={<div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Click Marido</div>}
        links={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/dashboard/customers', label: 'Clientes' },
          { href: '/dashboard/quotations', label: 'Orçamentos' },
        ]}
      />

      <main className="max-w-7xl mx-auto px-lg py-xl">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="h1 mb-md text-neutral-900">Orçamentos</h1>
            <p className="text-neutral-600">{quotations.length} orçamentos</p>
          </div>
          <Button>Novo Orçamento</Button>
        </div>

        {/* Kanban View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {['pending', 'sent', 'approved', 'rejected'].map((status) => (
            <div key={status}>
              <h3 className="font-semibold text-neutral-900 mb-md capitalize">{statusLabels[status as keyof typeof statusLabels]}</h3>
              <div className="space-y-md">
                {quotations
                  .filter((q) => q.status === status)
                  .map((quotation) => (
                    <Card key={quotation.id} interactive className="animate-fade-in">
                      <div className="mb-md">
                        <p className="font-semibold text-neutral-900">{quotation.client}</p>
                        <p className="text-sm text-neutral-600">R$ {quotation.amount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600">{quotation.items} itens</span>
                        <Badge variant={statusColors[status as keyof typeof statusColors] as any} size="sm">
                          {statusLabels[status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## ✅ CHECKLIST

- [ ] Dashboard com stats cards + recent items
- [ ] Customers page com search + tabela
- [ ] Quotations Kanban view
- [ ] Navigation bar em todos os layouts
- [ ] Animações fade-in e scale-in funcionando
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Cores e gradientes aplicados consistentemente
- [ ] Acessibilidade verificada

---

**Próximo passo:** ULTRAPROMPT 4: Formulários Redesenhados

**✨ LAYOUTS MODERNOS E FUNCIONAIS.**
