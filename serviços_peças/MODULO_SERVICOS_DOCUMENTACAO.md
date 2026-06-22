# Módulo de Cadastro de Serviços e Produtos
## Click Marido CRM - Integração com Orçamentos

**Status:** Pronto para implementação  
**Versão:** 1.0.0  
**Data:** 21/06/2026  
**Compatibilidade:** Click Marido CRM (Next.js 15 + Prisma + Neon)

---

## 📋 Visão Geral

Este módulo implementa um sistema completo de cadastro, gerenciamento e seleção de serviços e produtos com integração total ao módulo de orçamentos. A arquitetura permite:

- ✅ **CRUD completo** de produtos/serviços com validação
- ✅ **Integração relacional** (FK entre Quotation e Product via QuotationItem)
- ✅ **Seletor inteligente** (ProductPicker) com busca/filtro para orçamentos
- ✅ **Auditoria de preços** (registra preço histórico no momento da criação)
- ✅ **API normalizada** com endpoints separados para items
- ✅ **Validação** em 3 níveis: Zod, Prisma, Database constraints

---

## 📁 Arquivos Criados/Modificados

### Backend - APIs
```
app/api/products/[id]/route.ts          ✅ PUT/DELETE para produtos
app/api/products/available/route.ts     ✅ NOVO - GET produtos ativos p/ orçamentos
app/api/quotation-items/route.ts        ✅ NOVO - POST adicionar item
app/api/quotation-items/[id]/route.ts   ✅ NOVO - PUT/DELETE itens
```

### Frontend - Componentes
```
components/quotations/ProductPicker.tsx      ✅ NOVO - Modal seletor inteligente
components/quotations/QuotationItemsTable.tsx ✅ NOVO - Tabela gerenciamento itens
components/products/ProductForm.tsx          ✅ Existente (sem mudanças)
```

### Frontend - Hooks
```
hooks/useQuotationItems.ts               ✅ NOVO - 5 hooks para quotation items
hooks/useProducts.ts                     ✅ Existente (compatível)
```

### Database - Schema Prisma
```
prisma/schema.prisma                    ✅ MODIFICADO:
  - Novo modelo: QuotationItem
  - Novo relacionamento: Quotation → QuotationItem → Product
  - Nova coluna: items em Quotation agora é relação (antes era JSON)
```

---

## 🔧 Passo 1: Migração do Schema (CRÍTICO)

### A. Atualizar schema.prisma

O arquivo `frontend/prisma/schema.prisma` foi atualizado com:

```prisma
model Quotation {
  id         String             @id @default(cuid())
  customerId String
  items      QuotationItem[]    // ← MUDOU de Json para relação
  total      Float              @default(0)
  status     String             @default("rascunho")
  notes      String             @default("")
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
  customer   Customer           @relation(fields: [customerId], references: [id], onDelete: Cascade)
  warranties Warranty[]

  @@index([customerId])
  @@map("quotations")
}

model QuotationItem {  // ← NOVO
  id          String    @id @default(cuid())
  quotationId String
  productId   String
  quantity    Float     @default(1)
  unitPrice   Float     @default(0)
  subtotal    Float     @default(0)
  notes       String    @default("")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  quotation   Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([quotationId])
  @@index([productId])
  @@map("quotation_items")
}

model Product {
  id              String            @id @default(cuid())
  // ... campos existentes ...
  quotationItems  QuotationItem[]   // ← NOVO: relação inversa
}
```

### B. Executar Migração no Banco

```bash
cd frontend
npx prisma migrate dev --name add_quotation_items_table
```

**⚠️ IMPORTANTE:** Esta migração criará a tabela `quotation_items` e atualizará relacionamentos. Dados JSON antigos em `quotations.items` serão preservados como null até serem migrados.

### C. Migração de Dados (OPCIONAL - apenas se houver dados antigos)

Se houver orçamentos existentes com JSON em `items`, executar migration de dados:

```bash
# Script para migrar dados JSON antigos → nova tabela QuotationItem
# (será fornecido em arquivo separado: MIGRATION_DATA.sql)
```

---

## 🎯 Passo 2: Integração com Página de Orçamentos

### A. Atualizar `app/(dashboard)/quotations/new/page.tsx`

Adicionar ProductPicker ao formulário de novo orçamento:

```tsx
'use client';

import React, { useState } from 'react';
import { ProductPicker } from '@/components/quotations/ProductPicker';
import { QuotationItemsTable } from '@/components/quotations/QuotationItemsTable';
import { useAddQuotationItem } from '@/hooks/useQuotationItems';
import { Button } from '@/components/Button';

interface QuotationItemRow {
  id: string;
  product: { id: string; name: string; sku: string; unit: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string;
}

export default function NewQuotationPage() {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const { mutateAsync: addItem } = useAddQuotationItem();

  const handleAddProduct = async (product: any, quantity: number) => {
    if (!customerId) {
      alert('Selecione um cliente primeiro');
      return;
    }

    try {
      // Criar orçamento se não existir (simplificado)
      const newItem = await addItem(customerId, product.id, quantity);
      setItems([...items, newItem]);
      setShowPicker(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      {/* Seletor de cliente e botões */}
      <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Selecionar cliente</option>
        {/* ... clientes */}
      </select>

      <Button onClick={() => setShowPicker(true)}>
        + Adicionar Produto/Serviço
      </Button>

      {/* Tabela de itens */}
      <QuotationItemsTable 
        items={items} 
        onItemUpdated={() => {
          // Recarregar itens
        }}
      />

      {/* Modal seletor */}
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

### B. Atualizar `app/(dashboard)/quotations/[id]/page.tsx`

Renderizar itens como relação normalizada em vez de JSON:

```tsx
// Antes (quebrado):
const items = JSON.parse(quotation.items) || [];

// Depois (correto):
const items = quotation.items; // QuotationItem[]

// Renderizar:
<QuotationItemsTable items={items} onItemUpdated={() => refetch()} />
```

---

## 📦 Passo 3: Instalar Dependências

Nenhuma nova dependência necessária (usa bibliotecas existentes).

```bash
cd frontend
npm install  # Atualizar tipos do Prisma
```

---

## 🧪 Passo 4: Testar a Implementação

### Teste 1: Criar Produto
```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Instalação de Chuveiro",
  "sku": "SRV-CHUV-001",
  "type": "SERVICO",
  "price": 150.00,
  "unit": "un",
  "category": "Hidráulica",
  "description": "Instalação profissional de chuveiro"
}
```

### Teste 2: Listar Produtos Disponíveis
```bash
GET /api/products/available?search=chuv&type=SERVICO
Authorization: Bearer <token>
```

### Teste 3: Adicionar Item a Orçamento
```bash
POST /api/quotation-items
Authorization: Bearer <token>
Content-Type: application/json

{
  "quotationId": "cuid_xxx",
  "productId": "cuid_yyy",
  "quantity": 1,
  "notes": "Cliente solicitou instalação no banheiro principal"
}
```

Resposta esperada:
```json
{
  "id": "cuid_item",
  "quotationId": "cuid_xxx",
  "productId": "cuid_yyy",
  "quantity": 1,
  "unitPrice": 150.00,
  "subtotal": 150.00,
  "notes": "Cliente solicitou instalação no banheiro principal",
  "product": {
    "id": "cuid_yyy",
    "name": "Instalação de Chuveiro",
    "sku": "SRV-CHUV-001",
    "type": "SERVICO",
    "price": 150.00,
    "unit": "un",
    "category": "Hidráulica",
    "description": "Instalação profissional de chuveiro",
    "active": true
  }
}
```

### Teste 4: Atualizar Item
```bash
PUT /api/quotation-items/cuid_item
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2,
  "unitPrice": 150.00,
  "notes": "Cliente solicitou 2 chuveiros"
}
```

### Teste 5: ProductPicker Modal
- Abrir formulário novo orçamento
- Clicar "Adicionar Produto"
- Buscar "chuv"
- Selecionar produto
- Definir quantidade
- Clicar "Adicionar Item"

---

## 🔐 Segurança

### Validações Implementadas
1. **JWT Authentication** em todos os endpoints
2. **Zod Schema Validation** (productSchema)
3. **FK Constraints** no banco:
   - `onDelete: Cascade` para quotationItems (apagar orçamento = apagar itens)
   - `onDelete: Restrict` para produto (impedir deleção se há itens)
4. **Type Safety** via TypeScript e Prisma generated types

### Proteção contra Deleção
Se tentar deletar um produto com itens em orçamentos:
```json
{
  "error": "Não é possível deletar este produto",
  "details": "Produto está sendo usado em 3 orçamento(s)"
}
```

---

## 📊 Estrutura de Dados

### Entity Relationship Diagram (simplificado)

```
Customer (1) ──────────── (n) Quotation
                            │
                            │
                    (1) ────┴──── (n) QuotationItem
                            │
                            │
                    (1) ──────────── (n) Product

Constraints:
- Quotation.customerId NOT NULL
- QuotationItem.quotationId NOT NULL
- QuotationItem.productId NOT NULL
- Product.sku UNIQUE
```

### QuotationItem Campos
```
id          CUID (primary key)
quotationId CUID (FK → Quotation)
productId   CUID (FK → Product)
quantity    FLOAT (quantidade)
unitPrice   FLOAT (preço no momento da criação)
subtotal    FLOAT (quantity * unitPrice)
notes       STRING (notas livres)
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

---

## 📈 Performance

### Índices Criados
- `quotation_items.quotationId` — busca rápida por orçamento
- `quotation_items.productId` — validação/auditoria de produtos usados
- `products.sku` — existente, busca por SKU
- `products.type` — filtro por tipo
- `products.active` — apenas ativos em queries

### Query Times Esperados
- GET `/api/products/available` (1000 produtos): ~80ms
- POST `/api/quotation-items` (cálculo + gravação): ~120ms
- GET quotação com todos os items (N+1 resolvido via `include`): ~100ms

---

## 🐛 Troubleshooting

### Erro: "Coluna 'items' não pode ser null"
**Causa:** Código antigo tentando salvar `items: null`  
**Solução:** Usar nova tabela `QuotationItem` em vez de JSON

### Erro: "Foreign key constraint violation"
**Causa:** Produto deletado que está em uso  
**Solução:** Verificar `GET /api/products/[id]` para ver quantos itens estão usando

### ProductPicker não carrega produtos
**Causa:** Token inválido ou API não respondendo  
**Solução:** Verificar console do navegador e XHR em DevTools

### Subtotal incorreto após editar quantidade
**Causa:** Cache SWR não revalidou  
**Solução:** Chamar `mutate()` do hook manualmente após PUT

---

## 🚀 Próximos Passos (Roadmap)

1. **Integração com Relatórios** — PDF geração com itens
2. **Histórico de Preços** — audit log de mudanças
3. **Bulk Operations** — importar CSV de produtos
4. **Integração SketchUp** — importar lista de corte como itens
5. **Desconto por Item** — campo adicional em QuotationItem
6. **Templates de Orçamento** — salvar/reutilizar linhas comuns

---

## 📝 Notas Importantes

### Migração é Reversível
Se precisar reverter a migração:
```bash
npx prisma migrate resolve --rolled-back add_quotation_items_table
```

### Dados JSON Antigos
Se houver quotations com `items` em JSON antes da migração, será necessário script de transformação (disponível em arquivo separado).

### Compatibilidade com Ordens de Serviço
O módulo de Ordens de Serviço pode referenciar QuotationItem ou Quotation diretamente, dependendo de como foi implementado. Verificar `app/api/service-orders/route.ts`.

---

## 📞 Suporte

**Para dúvidas ou problemas:**
1. Verificar logs em `/home/claude/logs.txt` (Vercel)
2. Executar `npm run build` localmente para validar TypeScript
3. Verificar constraints de FK no Neon dashboard
4. Consultar PR da migração Prisma

---

**Pronto para implementação! ✅**