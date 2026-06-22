# Exemplos de Integração - ProductPicker com Páginas de Orçamentos

## 1. Página de Novo Orçamento (new/page.tsx)

Exemplo completo de página para criar novo orçamento com ProductPicker integrado.

### Localização
`frontend/app/(dashboard)/quotations/new/page.tsx`

### Código Atualizado

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProductPicker } from '@/components/quotations/ProductPicker';
import { QuotationItemsTable } from '@/components/quotations/QuotationItemsTable';
import { useAddQuotationItem } from '@/hooks/useQuotationItems';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface QuotationItemRow {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const authUser = user as { email: string } | null;

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const { mutateAsync: addItem } = useAddQuotationItem();

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customers?limit=999', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCustomers(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Calcular total
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Handle add product via picker
  const handleAddProduct = async (product: any, quantity: number) => {
    if (!selectedCustomer) {
      alert('Selecione um cliente primeiro');
      return;
    }

    try {
      // Note: Este é um fluxo simplificado. Em produção, você pode:
      // 1. Criar o orçamento primeiro se não existir
      // 2. Depois adicionar itens
      // Por enquanto, vamos apenas adicionar à lista local
      
      const newItem: QuotationItemRow = {
        id: `temp-${Date.now()}`, // Será substituído após criar orçamento
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
        },
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        notes: '',
      };

      setItems([...items, newItem]);
      setShowPicker(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao adicionar item');
    }
  };

  // Handle save quotation
  const handleSaveQuotation = async () => {
    if (!selectedCustomer) {
      alert('Selecione um cliente');
      return;
    }

    if (items.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem('token');

      // 1. Criar orçamento
      const quotationResponse = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          notes: quotationNotes,
          status: 'rascunho',
        }),
      });

      if (!quotationResponse.ok) {
        throw new Error('Erro ao criar orçamento');
      }

      const quotation = await quotationResponse.json();
      const quotationId = quotation.id;

      // 2. Adicionar itens
      for (const item of items) {
        try {
          await addItem(quotationId, item.product.id, item.quantity, item.notes);
        } catch (error) {
          console.error('Erro ao adicionar item:', error);
        }
      }

      alert('Orçamento criado com sucesso!');
      router.push(`/quotations/${quotationId}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar orçamento');
    } finally {
      setIsCreating(false);
    }
  };

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
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
        user={{ name: 'Admin', email: authUser.email }}
        onLogout={logout}
      />

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Novo Orçamento
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Crie um novo orçamento selecionando um cliente e adicionando itens
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card shadow="lg">
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Selecionar Cliente *
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    disabled={loadingCustomers}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingCustomers ? 'Carregando clientes...' : 'Selecione um cliente'}
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card shadow="lg">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Itens do Orçamento</CardTitle>
                <Button
                  onClick={() => setShowPicker(true)}
                  disabled={!selectedCustomer}
                  className="text-sm"
                >
                  + Adicionar Item
                </Button>
              </CardHeader>
              <CardContent>
                <QuotationItemsTable 
                  items={items} 
                  onItemUpdated={() => {
                    // Atualizar total se necessário
                  }}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card shadow="lg">
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={quotationNotes}
                  onChange={(e) => setQuotationNotes(e.target.value)}
                  placeholder="Observações adicionais sobre o orçamento..."
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary - Right Side */}
          <div>
            <Card shadow="lg" className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Quantidade de Itens
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {items.length}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Total
                  </p>
                  <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                    R$ {total.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleSaveQuotation}
                    disabled={isCreating || !selectedCustomer || items.length === 0}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {isCreating ? 'Salvando...' : 'Salvar Orçamento'}
                  </Button>
                  <Button
                    onClick={() => router.push('/quotations')}
                    className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Product Picker Modal */}
      {showPicker && (
        <ProductPicker
          onSelect={handleAddProduct}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
```

---

## 2. Página de Visualização de Orçamento ([id]/page.tsx)

Atualizar para exibir itens como relação normalizada.

### Localização
`frontend/app/(dashboard)/quotations/[id]/page.tsx`

### Mudanças Necessárias

**Antes (quebrado com JSON):**
```tsx
const getQuotationItems = (itemsField: string | QuotationItem[]): QuotationItem[] => {
  try {
    return typeof itemsField === 'string' 
      ? JSON.parse(itemsField) 
      : itemsField || [];
  } catch {
    return [];
  }
};

const quotation = await fetchQuotation(id);
const items = getQuotationItems(quotation.items);
```

**Depois (correto com relação):**
```tsx
// Buscar na API incluindo items relacionados
const response = await fetch(`/api/quotations/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const quotation = await response.json();

// items agora é um array de QuotationItem[]
const items = quotation.items; // Já é normalizado!

return (
  <div>
    <QuotationItemsTable 
      items={items}
      onItemUpdated={() => refetch()}
    />
  </div>
);
```

---

## 3. API Route Update - GET /api/quotations/[id]

Para retornar items como relação, ajustar o endpoint:

### Localização
`frontend/app/api/quotations/[id]/route.ts`

### Código

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ... validação ...

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        warranties: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error) {
    // ...
  }
}
```

---

## 4. API Route Update - POST /api/quotations

Ao criar orçamento, não incluir items (serão adicionados via /api/quotation-items).

### Localização
`frontend/app/api/quotations/route.ts`

### Código

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... validação ...

    const body = await request.json();
    const { customerId, notes, status } = body;

    const quotation = await prisma.quotation.create({
      data: {
        customerId,
        notes: notes || '',
        status: status || 'rascunho',
        items: {}, // Não incluir items inicialmente
        total: 0,
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    // ...
  }
}
```

---

## 5. Atualizar página Quotations List

Para exibir item count em vez de JSON:

### Antes:
```tsx
const itemCount = JSON.parse(quotation.items || '[]').length;
```

### Depois:
```tsx
const itemCount = quotation.items?.length || 0;
```

---

## Notas de Implementação

1. **Ordem importa:** Criar orçamento primeiro, depois adicionar items
2. **Validação:** ProductPicker valida que cliente está selecionado
3. **Rollback:** Se erro ao adicionar item, o orçamento já existe (considerar compensação)
4. **UX:** Mostrar loading enquanto adiciona items
5. **Erro handling:** Exibir toast/alert para falhas individuais

---

## Checklist de Testes

- [ ] Criar novo orçamento com 1 item
- [ ] Adicionar 5+ itens via ProductPicker
- [ ] Buscar produtos por nome/SKU/categoria
- [ ] Filtrar por tipo (SERVICO/PECA)
- [ ] Editar quantidade de item
- [ ] Remover item (verificar recálculo do total)
- [ ] Visualizar orçamento criado
- [ ] Validar total é calculado corretamente

---