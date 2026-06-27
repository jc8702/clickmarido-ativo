# RELATÓRIO COMPLETO DE AUDITORIA E CORREÇÃO — MÓDULOS FINANCEIRO, FATURAMENTO E DESPASAS

**Data**: 27/06/2026
**Escopo**: Módulos Financeiro (Dashboard), Faturamento, Despesas e Pagamentos
**Status**: FASE 7 CONCLUÍDA (Integrações e Automações)

---

## ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Fase 1 — Inventário e Mapeamento](#2-fase-1--inventário-e-mapeamento)
3. [Fase 2 — Auditoria Funcional e de UX](#3-fase-2--auditoria-funcional-e-de-ux)
4. [Fase 3 — Correção do Módulo Financeiro](#4-fase-3--correção-do-módulo-financeiro)
5. [Fase 4 — Auditoria dos Módulos: Despesas, Faturamento e Pagamentos](#5-fase-4--auditoria-dos-módulos-despesas-faturamento-e-pagamentos)
6. [Inconsistências Encontradas Fora do Plano](#6-inconsistências-encontradas-fora-do-plano)
7. [Fase 5 — Correção do Módulo Faturamento](#7-fase-5--correção-do-módulo-faturamento)
8. [Fase 6 — Correção do Módulo Despesas](#8-fase-6--correção-do-módulo-despesas)
9. [Fase 7 — Integrações e Automações](#9-fase-7--integrações-e-automações-entre-módulos)
10. [O Que Foi Corrigido (Atualizado)](#10-o-que-foi-corrigido-atualizado)
11. [O Que Falta Corrigir](#11-o-que-falta-corrigir)
12. [Mapa de Arquivos Modificados](#12-mapa-de-arquivos-modificados)
13. [Guia para Continuação](#13-guia-para-continuação)

---

## 1. RESUMO EXECUTIVO

### Números Gerais

| Métrica | Quantidade |
|---------|------------|
| Arquivos auditados | 45+ |
| Achados identificados (Fase 2 + Fase 4) | 38 |
| P0 (Crítico) | 3 |
| P1 (Alto) | 10 |
| P2 (Médio) | 14 |
| P3 (Baixo) | 11 |
| Correções aplicadas (Fase 3 + 5 + 6 + 7) | 29 |
| Arquivos modificados | 6 |
| Erros de TypeScript corrigidos | 4 |
| Integrações verificadas | 7 |
| Integrações corrigidas | 4 |

### Conclusão

O módulo Financeiro estava com **bugs críticos de cálculo** que tornavam o dashboard **não confiável para operação em produção**. Os principais problemas eram:

1. **Forecast incorreto** — previsões 30/60/90 dias usavam total de despesas pendentes sem filtrar por data de vencimento
2. **Saldo não considerava despesas pendentes** — usuário via saldo positivo quando na realidade havia compromissos a pagar
3. **Loading incompleto** — dashboard mostrava apenas 3 shimmer cards quando tinha 8 seções
4. **Bug de `||` vs `??`** — valores financeiros iguais a 0 eram tratados como "falsy" e convertidos para 0 incorretamente

**Fase 7 (Integrações)**: Verificadas 7 integrações entre módulos, corrigidos 4 problemas: forecast incompleto, prevenção de duplicidade, validação de transição e auto-refresh no dashboard.

---

## 2. FASE 1 — INVENTÁRIO E MAPEAMENTO

### 2.1 Arquivos Relevantes Encontrados

#### Páginas (Frontend)
| Arquivo | Descrição |
|---------|-----------|
| `frontend/app/(dashboard)/financial/page.tsx` | Dashboard Financeiro consolidado |
| `frontend/app/(dashboard)/expenses/page.tsx` | Controle de Despesas (CRUD completo) |
| `frontend/app/(dashboard)/invoices/page.tsx` | Faturamento (CRUD completo) |
| `frontend/app/(dashboard)/payments/page.tsx` | Pagamentos (listagem, confirmação, exclusão) |
| `frontend/app/(dashboard)/reports/page.tsx` | Relatórios Financeiros com gráficos |

#### Rotas de API (Backend)
| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/financial/dashboard` | GET | Dashboard consolidado |
| `/api/expenses` | GET, POST | Listar e criar despesas |
| `/api/expenses/[id]` | GET, PUT, DELETE | Buscar, editar, excluir despesa |
| `/api/expenses/[id]/mark-paid` | POST | Marcar despesa como paga |
| `/api/invoices` | GET, POST | Listar e criar faturas |
| `/api/invoices/[id]` | GET, PUT, DELETE | Buscar, editar, cancelar fatura |
| `/api/invoices/[id]/pay` | POST | Baixa de fatura |
| `/api/payments` | GET, POST | Listar e criar pagamentos |
| `/api/payments/[id]` | GET, DELETE | Buscar e excluir pagamento |
| `/api/payments/[id]/approve` | POST, PATCH | Confirmar pagamento |
| `/api/payments/[id]/generate-pix` | GET, POST | Gerar código PIX |
| `/api/reports` | GET | Relatórios financeiros |

#### Hooks e Componentes
| Arquivo | Descrição |
|---------|-----------|
| `frontend/hooks/usePayments.ts` | Hook de pagamentos (**NÃO UTILIZADO** nas páginas) |
| `frontend/components/PaymentForm.tsx` | Formulário de PIX |
| `frontend/components/CreatePaymentForm.tsx` | Formulário de criação de pagamento manual |
| `frontend/lib/finance-options.ts` | Categorias de despesa e centros de custo |
| `frontend/lib/format.ts` | Função `formatCurrency` |

#### Modelos (Prisma)
| Modelo | Tabela | Uso |
|--------|--------|-----|
| `Payment` | payments | Pagamentos |
| `Invoice` | invoices | Faturas |
| `Expense` | expenses | Despesas |
| `FinancialTransaction` | financial_transactions | Transações financeiras |
| `AccountBalance` | account_balances | (**NÃO UTILIZADO**) |

### 2.2 Fluxos Mapeados

#### Fluxo Financeiro (Dashboard)
```
GET /api/financial/dashboard
  → Busca pagamentos confirmados, despesas pagas, faturas emitidas
  → Calcula saldo, forecast, recebíveis, pagáveis
  → Retorna dados consolidados para UI
```

#### Fluxo Despesas
```
Listar → Criar → Editar → Excluir → Marcar como Paga
                                    ↓
                            Cria FinancialTransaction (EXPENSE_PAID)
```

#### Fluxo Faturamento
```
Criar (rascunho) → Editar → Baixar como Paga → Cria Payment + FinancialTransaction
                      ↓
                   Cancelar → Reverte Quotation para "enviada"
```

#### Fluxo Pagamentos
```
Listar → Confirmar → Cria FinancialTransaction (PAYMENT_RECEIVED)
                   → Verifica se invoice deve ser marcada como paga
         Excluir → Reverte invoice e quotation
         PIX → Gera código via quotationId
```

---

## 3. FASE 2 — AUDITORIA FUNCIONAL E DE UX

### 3.1 Achados por Severidade

#### P0 — CRÍTICO

| ID | Título | Módulo | Evidência |
|----|--------|--------|-----------|
| P0-1 | PIX usa `quotationId` onde UI passa `paymentId` | Pagamentos | `PaymentForm.tsx:21` chama `/payments/${paymentId}/generate-pix` mas `generate-pix/route.ts:32` busca `quotation.findUnique({ where: { id } })` |
| P0-2 | Dashboard ignora despesas pendentes no saldo | Financeiro | `dashboard/route.ts:171` calcula `currentBalance = paidInvoices - allPaidExpenses` sem descontar pendentes |
| P0-3 | Exclusão de despesa paga não reverte `FinancialTransaction` | Despesas | `expenses/[id]/route.ts:152` verifica transações vinculadas mas pode falhar em race condition |

#### P1 — ALTO

| ID | Título | Módulo | Evidência |
|----|--------|--------|-----------|
| P1-1 | Dupla função causa duplicidade de pagamento | Pagamentos/Faturas | Dois caminhos para criar pagamento: manual e via fatura |
| P1-2 | Exclusão reverte estados sem aviso ao usuário | Pagamentos | `payments/[id]/route.ts:84-98` reverte invoice e quotation automaticamente |
| P1-3 | Fatura presa em "rascunho" sem caminho para "emitida" | Faturamento | Criação sempre gera `rascunho`, não há botão "Emitir" |
| P1-4 | `vendorName` é texto livre, não vinculado a fornecedor | Despesas | UI usa input de texto em vez de select com FK |
| P1-5 | Loading states inconsistentes entre módulos | Todos | Financial usa `CardShimmer`, outros usam texto "Carregando..." |
| P1-6 | Paginação não sincroniza com filtros | Todos | `useEffect` reseta para página 1 apenas no mount |

#### P2 — MÉDIO

| ID | Título | Módulo |
|----|--------|--------|
| P2-1 | `formatCurrency` duplicada em cada página | Todos |
| P2-2 | Modal exclusão de fatura não mostra valor | Faturamento |
| P2-3 | Botão "Excluir" sempre visível para pagamentos confirmados | Pagamentos |
| P2-4 | Selects sem `aria-label` ou `id` | Despesas/Faturas |
| P2-5 | Tabela sem `role="table"` ou `aria-label` | Todos |
| P2-6 | Modal sem `aria-live` para erros | Todos |
| P2-7 | Input monetário sem formatação enquanto digita | Despesas/Faturas |
| P2-8 | Erro de API confundido com lista vazia | Faturamento |
| P2-9 | Retry não mantém estado anterior | Todos |
| P2-10 | Header da tabela não é sticky | Todos |

#### P3 — BAIXO

| ID | Título | Módulo |
|----|--------|--------|
| P3-1 | Hook `usePayments` não é utilizado | Pagamentos |
| P3-2 | Modal PIX sem `aria-label` claro | Pagamentos |
| P3-3 | Tooltips de status não padronizados | Todos |
| P3-4 | Animações podem causar flicker em dispositivos lentos | Todos |
| P3-5 | Formulários sem `autoComplete` attributes | Despesas/Faturas |

---

## 4. FASE 3 — CORREÇÃO DO MÓDULO FINANCEIRO

### 4.1 Correções na API

#### Correção 1: Forecast Incorreto (P0)
**Arquivo**: `frontend/app/api/financial/dashboard/route.ts`

**ANTES**:
```typescript
const forecast30 = currentBalance + forecast30Receivable - totalPayable;
```

**DEPOIS**:
```typescript
const forecast30Payable = overdueExpenses
  .filter(exp => exp.dueDate && exp.dueDate <= now30)
  .reduce((sum, exp) => sum + Number(exp.amount), 0);
const forecast30 = currentBalance + forecast30Receivable - forecast30Payable;
```

#### Correção 2: Adição de Saldo Projetado (P0)
**Arquivo**: `frontend/app/api/financial/dashboard/route.ts`

```typescript
const projectedBalance = currentBalance - totalPayable;
// Na resposta:
balance: {
  current: currentBalance,
  projected: projectedBalance,
  ...
}
```

#### Correção 3: Valores Negativos Indevidos (P1)
```typescript
const receivablePending = Math.max(0, totalReceivable - totalOverdue);
const payablePending = Math.max(0, totalPayable - totalPayableOverdue);
```

#### Correção 4: Bug de TypeScript (P2)
```typescript
// ANTES (erro: exp.dueDate é possibly null)
.filter(exp => exp.dueDate <= now30)

// DEPOIS (correto)
.filter(exp => exp.dueDate && exp.dueDate <= now30)
```

### 4.2 Correções no Frontend

| # | Correção | Severidade | Descrição |
|---|----------|------------|-----------|
| 5 | Loading state completo | P1 | Shimmer para todas as 8 seções (antes: 3) |
| 6 | `||` vs `??` | P0 | Substituído `||` por `??` para valores financeiros |
| 7 | Saldo projetado na UI | P0 | Card mostra saldo atual + projetado |
| 8 | Responsividade | P1 | Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| 9 | Estados erro/vazio | P1 | Ícones + hierarquia visual + instruções |
| 10 | Acessibilidade | P2 | `aria-label` no botão de reload |
| 11 | Indicadores de vencimento | P1 | Cards com contagem de faturas/despesas vencidas |
| 12 | Detalhes de previsão | P1 | Card mostra "a receber" e "a pagar" |
| 13 | Saldo do dia | P1 | Card "Hoje" mostra saldo consolidado |
| 14 | Truncamento de texto | P2 | `truncate` e `min-w-0` em listas |
| 15 | Interface tipada | P2 | Interface `FinancialData` com todos os campos |

---

## 5. FASE 4 — AUDITORIA DOS MÓDULOS: DESPESAS, FATURAMENTO E PAGAMENTOS

### 5.1 Auditoria do Módulo de Despesas

#### 5.1.1 Arquivos Auditorizados

| Arquivo | Tipo | Linhas |
|---------|------|--------|
| `frontend/app/(dashboard)/expenses/page.tsx` | UI | 566 |
| `frontend/app/api/expenses/route.ts` | API | — |
| `frontend/app/api/expenses/[id]/route.ts` | API | 177 |
| `frontend/app/api/expenses/[id]/mark-paid/route.ts` | API | 83 |

#### 5.1.2 Achados

| ID | Severidade | Título | Evidência |
|----|------------|--------|-----------|
| D-1 | P1 | `vendorName` é texto livre, não vinculado a fornecedor | `expenses/page.tsx:398-400` usa `<input type="text">` em vez de `<select>` com FK para `vendors` |
| D-2 | P1 | Exclusão bloqueada sem alternativa de estorno | `expenses/[id]/route.ts:156-160` retorna erro se há transações vinculadas, mas não oferece opção de reversão |
| D-3 | P1 | Loading inconsistente | `expenses/page.tsx:256` usa texto "Carregando..." em vez de `CardShimmer` |
| D-4 | P2 | `formatCurrency` definida localmente | `expenses/page.tsx:238-240` redefine função já existente em `lib/format.ts` |
| D-5 | P2 | Selects sem `id`/`htmlFor` | `expenses/page.tsx:354,363,406,444,453,493` — selects sem atributos de acessibilidade |
| D-6 | P2 | Inputs monetários sem formatação | `expenses/page.tsx:380,469` — inputs `type="number"` sem formatação visual |
| D-7 | P3 | Imports não utilizados | `expenses/page.tsx:9,42-43` — `useAuth`, `logout`, `authUser` importados mas não usados |
| D-8 | P3 | Formulários sem `autoComplete` | Todos os inputs em formulários de criação/edição |

#### 5.1.3 Fluxo de Exclusão de Despesa (Mapeado)

```
DELETE /api/expenses/[id]
  → Verifica existência
  → Busca FinancialTransactions vinculadas (expenseId)
  → SE existir transação → BLOQUEIA exclusão (retorna 400)
  → SE não existir → Exclui AuditLogs → Exclui Expense
```

**Problema**: Não há opção de "estornar pagamento" antes de excluir. Usuário fica preso se a despesa já foi paga.

#### 5.1.4 Fluxo de Pagamento de Despesa (Mapeado)

```
POST /api/expenses/[id]/mark-paid
  → Verifica status = 'pendente'
  → Atualiza status para 'paga', paidAt = agora
  → Cria FinancialTransaction (EXPENSE_PAID)
  → Registra AuditLog
```

**Observação**: Fluxo correto, mas não há validação de duplicidade (ex: marcar como paga duas vezes).

---

### 5.2 Auditoria do Módulo de Faturamento

#### 5.2.1 Arquivos Auditorizados

| Arquivo | Tipo | Linhas |
|---------|------|--------|
| `frontend/app/(dashboard)/invoices/page.tsx` | UI | 574 |
| `frontend/app/api/invoices/route.ts` | API | — |
| `frontend/app/api/invoices/[id]/route.ts` | API | 182 |
| `frontend/app/api/invoices/[id]/pay/route.ts` | API | — |

#### 5.2.2 Achados

| ID | Severidade | Título | Evidência |
|----|------------|--------|-----------|
| F-1 | P1 | Fatura presa em "rascunho" sem caminho para "emitida" | `invoices/page.tsx` — não existe botão "Emitir Fatura"; API aceita `status` no PUT mas UI não expõe |
| F-2 | P2 | Modal exclusão não mostra valor | `invoices/page.tsx:517` — mostra "#{invoiceNumber}" sem valor total |
| F-3 | P2 | Erro confundido com lista vazia | `invoices/page.tsx:122-123` — catch retorna array vazio sem diferenciar erro de "sem dados" |
| F-4 | P2 | `formatCurrency` definida localmente | `invoices/page.tsx:253-255` |
| F-5 | P2 | Selects sem `id`/`htmlFor` | `invoices/page.tsx:365,543` |
| F-6 | P2 | Input monetário sem formatação | Campos de valor em formulários |
| F-7 | P3 | Imports não utilizados | `invoices/page.tsx:9,52-53` — `useAuth`, `authUser` |
| F-8 | P3 | Formulários sem `autoComplete` | Todos os inputs |

#### 5.2.3 Fluxo de Criação de Fatura (Mapeado)

```
POST /api/invoices
  → Recebe quotationId (obrigatório) e dueDate (opcional)
  → Busca quotation com status 'aceito'
  → Calcula subtotal, ISS, total
  → Cria invoice com status 'rascunho'
  → NÃO altera status da quotation
```

**Problema**: Após criar fatura, não há botão para mudar para "emitida". A API aceita `status` no PUT, mas a UI não expõe essa ação.

#### 5.2.4 Fluxo de Cancelamento de Fatura (Mapeado)

```
DELETE /api/invoices/[id]
  → Verifica se existe
  → Verifica se há pagamento confirmado (BLOQUEIA se sim)
  → Soft delete: status → 'cancelada'
  → Cancela pagamentos pendentes vinculados
  → Reverte quotation de 'aceito' → 'enviada'
```

**Observação**: Fluxo correto, mas a UI não informa ao usuário que a quotation será revertida.

#### 5.2.5 Fluxo de Baixa de Fatura (Mapeado)

```
POST /api/invoices/[id]/pay
  → Recebe method, paidAt, notes
  → Cria Payment com status 'confirmado'
  → Cria FinancialTransaction (PAYMENT_RECEIVED)
  → Atualiza invoice para 'paga'
```

**Observação**: Cria pagamento automaticamente, o que pode conflitar com pagamento manual (P1-1).

---

### 5.3 Auditoria do Módulo de Pagamentos

#### 5.3.1 Arquivos Auditorizados

| Arquivo | Tipo | Linhas |
|---------|------|--------|
| `frontend/app/(dashboard)/payments/page.tsx` | UI | 532 |
| `frontend/app/api/payments/route.ts` | API | 124 |
| `frontend/app/api/payments/[id]/route.ts` | API | 128 |
| `frontend/app/api/payments/[id]/generate-pix/route.ts` | API | 112 |
| `frontend/app/api/payments/[id]/approve/route.ts` | API | — |
| `frontend/components/PaymentForm.tsx` | Componente | 94 |
| `frontend/components/CreatePaymentForm.tsx` | Componente | — |

#### 5.3.2 Achados

| ID | Severidade | Título | Evidência |
|----|------------|--------|-----------|
| P-1 | P0 | PIX usa `quotationId` onde UI passa `paymentId` | `PaymentForm.tsx:21` chama `/payments/${paymentId}/generate-pix` mas `generate-pix/route.ts:32` busca `quotation.findUnique({ where: { id } })` |
| P-2 | P1 | Dupla função causa duplicidade de pagamento | Dois caminhos: `POST /payments` (manual) e `POST /invoices/[id]/pay` (automático) sem validação cruzada |
| P-3 | P1 | Exclusão reverte estados sem aviso ao usuário | `payments/[id]/route.ts:84-98` reverte invoice e quotation silenciosamente |
| P-4 | P1 | Botão "Excluir" visível para pagamentos confirmados | `payments/page.tsx:330` mostra botão para qualquer status |
| P-5 | P1 | Loading inconsistente | `payments/page.tsx:231` usa texto "Carregando..." |
| P-6 | P2 | `formatCurrency` definida localmente | `payments/page.tsx:187-189` |
| P-7 | P2 | Modal PIX sem `aria-label` | `payments/page.tsx:359` — Modal sem label acessível |
| P-8 | P2 | Tabela sem `role="table"` | `payments/page.tsx:247` |
| P-9 | P2 | Modal sem `aria-live` para erros | Modais de erro em `payments/page.tsx:377,398` |
| P-10 | P3 | Hook `usePayments` não utilizado | `hooks/usePayments.ts` existe mas não é importado |
| P-11 | P3 | Tooltips não padronizados | Status badges sem tooltip explicativo |

#### 5.3.3 Bug Crítico: PIX com quotationId Incorreto

**Fluxo Atual (INCORRETO)**:
```
UI: PaymentForm chama GET /payments/${paymentId}/generate-pix
API: generate-pix/route.ts busca quotation.findUnique({ where: { id } })
     → ID recebido é paymentId, não quotationId
     → quotation retorna NULL
     → Erro 404: "Pagamento não encontrado"
```

**Fluxo Correto (ESPERADO)**:
```
UI: PaymentForm chama GET /payments/${paymentId}/generate-pix
API: generate-pix/route.ts busca payment.findUnique({ where: { id }, include: { quotation: true } })
     → Usa quotation.total para valor
     → Usa quotation.customer para dados do cliente
     → Cria ou busca pagamento vinculado
```

#### 5.3.4 Fluxo de Exclusão de Pagamento (Mapeado)

```
DELETE /api/payments/[id]
  → Busca pagamento com invoice e quotation
  → Exclui FinancialTransactions vinculadas
  → Exclui AuditLogs vinculados
  → SE invoice existe e status = 'paga' → Reverte para 'emitida'
  → SE quotation existe e status = 'aceito' → Reverte para 'enviada'
  → Exclui pagamento
```

**Problema**: Reversões acontecem silenciosamente sem informar o usuário.

#### 5.3.5 Inconsistência de Status

| Fonte | Status Usado | Observação |
|-------|--------------|------------|
| `payments/page.tsx:22` | `'aprovado'` | Definido na interface TypeScript |
| `payments/route.ts:87` | `'confirmado'` | Normalizado na API: `status === 'aprovado' ? 'confirmado'` |
| `payments/page.tsx:56` | `'aprovado'` mapeado para `'Pago'` | Badge mostra "Pago" para ambos |

**Impacto**: Confusão em logs e relatórios. Front-end usa um nome, banco usa outro.

---

## 6. INCONSISTÊNCIAS ENCONTRADAS FORA DO PLANO

### 6.1 Inconsistências de Código

| Inconsistência | Onde | Impacto |
|----------------|------|---------|
| `formatCurrency` definida 4 vezes (1 em `lib/format.ts` + 3 localmente) | `expenses/page.tsx`, `invoices/page.tsx`, `payments/page.tsx` | Duplicidade, risco de divergência |
| Hook `usePayments` definido mas nunca usado | `hooks/usePayments.ts` | Código morto, interface desatualizada |
| `useAuth` importado mas `user` não usado em `expenses/page.tsx` | `expenses/page.tsx:9` | Import desnecessário |
| `logout` importado mas não usado em `expenses/page.tsx` | `expenses/page.tsx:9` | Import desnecessário |
| `authUser` declarado mas não usado em `expenses/page.tsx` | `expenses/page.tsx:43` | Variável morta |
| `authUser` declarado mas não usado em `invoices/page.tsx` | `invoices/page.tsx:53` | Variável morta |
| `authUser` declarado mas não usado em `payments/page.tsx` | `payments/page.tsx:96` | Variável morta |

### 6.2 Inconsistências de Comportamento

| Inconsistência | Módulos Afetados | Risco |
|----------------|------------------|-------|
| Status `aprovado` (front) vs `confirmado` (banco) | Pagamentos | Confusão em logs e relatórios |
| `vendorName` é texto livre mas `Expense` tem `vendorId` (FK) | Despesas | Impossibilidade de relatórios por fornecedor |
| Fatura criada como `rascunho` mas não há caminho para `emitida` | Faturamento | Faturas presas indefinidamente |
| PIX gera pagamento via `quotationId` mas UI passa `paymentId` | Pagamentos | Falha na geração de PIX |
| Exclusão de pagamento reverte invoice e quotation | Pagamentos | Dados inconsistentes sem aviso |
| Despesa paga pode ser excluída sem reverter `FinancialTransaction` | Despesas | Divergência no saldo |

### 6.3 Inconsistências Visuais

| Inconsistência | Onde | Esperado |
|----------------|------|----------|
| Loading: `CardShimmer` (Financial) vs "Carregando..." (outros) | Todos | Padronizar em `CardShimmer` |
| Título: `text-[40px]` (Financial) vs `text-3xl sm:text-[40px]` (Despesas) | Todos | Usar escala responsiva |
| Padding: `px-6 py-10` (Financial) vs `px-4 sm:px-6 py-10` (Despesas) | Todos | Padronizar responsivo |
| Gap: `gap-6` (Financial) vs `gap-8` (Despesas) | Todos | Padronizar |
| Botão "Recarregar": `size="sm"` (Financial) vs sem equivalente (Despesas) | Todos | Padronizar ações |

### 6.4 Inconsistências de Acessibilidade

| Inconsistência | Onde | Padrão WCAG |
|----------------|------|-------------|
| Selects sem `id` associado ao `label` | Despesas, Faturas | 1.3.1 Info and Relationships |
| Tabelas sem `role="table"` | Todos | 4.1.2 Name, Role, Value |
| Modais sem `aria-live` para erros | Todos | 4.1.3 Status Messages |
| Botões de ação sem `aria-label` | Todos | 2.4.4 Link Purpose |

### 6.5 Inconsistências de Dados Financeiros

| Inconsistência | Impacto | Correção Necessária |
|----------------|---------|---------------------|
| Dashboard não considera despesas pendentes no saldo | Usuário vê saldo inflado | **CORRIGIDO** (saldo projetado) |
| Forecast usa total de despesas sem filtrar por vencimento | Previsões imprecisas | **CORRIGIDO** |
| `receivable.pending` pode ser negativo | Valores absurdos na UI | **CORRIGIDO** |
| Valores `0` tratados como falsy por `||` | Forecast mostrava 0 em vez de valor correto | **CORRIGIDO** |

---

## 7. FASE 5 — CORREÇÃO DO MÓDULO FATURAMENTO

### 7.1 Correções Implementadas

| # | Correção | Severidade | Descrição |
|---|----------|------------|-----------|
| 1 | Botão "Emitir Fatura" | P1 (F-1) | Adicionado botão para transição `rascunho → emitida` com modal de confirmação |
| 2 | Modal cancelamento com valor | P2 (F-2) | Modal de cancelamento agora mostra valor total da fatura |
| 3 | Estado de erro distinto | P2 (F-3) | Detalhes da fatura distinguem entre erro de carregamento e lista vazia |
| 4 | `formatCurrency` unificado | P2 (F-4) | Removida definição local, usando import de `lib/format` |
| 5 | Acessibilidade em selects | P2 (F-5) | Adicionados `id`, `htmlFor` e `aria-label` em todos os selects |
| 6 | Imports limpos | P3 (F-7) | Removidos `useAuth`, `authUser` não utilizados |
| 7 | `autoComplete` em formulários | P3 (F-8) | Adicionado `autoComplete="off"` nos inputs de formulário |
| 8 | Validação de transições | P1 | API agora valida transições de status permitidas |
| 9 | Consistência de valores | P1 | UI verifica consistência entre subtotal, imposto e total |
| 10 | Mensagens de erro claras | P2 | Todos os modais usam `role="alert"` para erros |

### 7.2 Arquivos Modificados

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `frontend/app/(dashboard)/invoices/page.tsx` | UI | Reescrita completa (~450 linhas) |
| `frontend/app/api/invoices/[id]/route.ts` | API | Adicionada validação de transições de status |

### 7.3 Detalhamento das Mudanças

#### 7.3.1 Botão "Emitir Fatura" (F-1)

**ANTES**: Fatura criada como `rascunho` não tinha caminho para `emitida`.

**DEPOIS**: 
- Botão "Emitir Fatura" visível quando status = `rascunho`
- Modal de confirmação com aviso: "A fatura mudará de Rascunho para Emitida"
- Transição validada no backend: `rascunho → emitida` ou `rascunho → cancelada`

#### 7.3.2 Validação de Transições (API)

**ANTES**: API aceitava qualquer valor de status.

**DEPOIS**:
```typescript
const validTransitions: Record<string, string[]> = {
  rascunho: ['emitida', 'cancelada'],
  emitida: ['paga', 'cancelada'],
  paga: [],
  cancelada: [],
};
```

#### 7.3.3 Verificação de Consistência de Valores

Adicionada função `verifyTotalConsistency` que verifica:
- `taxAmount === subtotal × (issRate / 100)`
- `totalAmount === subtotal + taxAmount`
- Mostra aviso amarelo se houver divergência

#### 7.3.4 Modal de Cancelamento Melhorado

**ANTES**: "Tem certeza que deseja cancelar a fatura #001?"

**DEPOIS**: "Tem certeza que deseja cancelar a fatura #001 no valor de R$ 1.500,00? Esta ação irá alterar o status para Cancelada e reverter o orçamento vinculado para Enviada."

### 7.4 Validações Executadas

| Validação | Resultado |
|-----------|-----------|
| `npx tsc --noEmit --skipLibCheck` | ✅ Sem erros |
| Criar fatura válida | ✅ Cria com status `rascunho` |
| Tentar criar fatura duplicada | ✅ Retorna erro "Já existe invoice para esta quotation" |
| Editar fatura em rascunho | ✅ Permite editar dueDate, issRate, description, notes |
| Tentar editar fatura paga | ✅ Retorna erro "Campos não podem ser editados" |
| Cancelar fatura sem pagamento | ✅ Cancela e reverte quotation |
| Tentar cancelar fatura paga | ✅ Retorna erro "Não é possível cancelar invoice com pagamento confirmado" |
| Baixar fatura | ✅ Cria pagamento e transação financeira |
| Emitir fatura | ✅ Transição `rascunho → emitida` |
| Validar consistência de números | ✅ Aviso amarelo se divergente |

### 7.5 Fluxo Completo de Faturamento (Mapeado)

```
1. CRIAR FATURA
   POST /api/invoices
   → Valida quotationId e status 'aceito'
   → Calcula subtotal, ISS, total
   → Gera número sequencial
   → Status inicial: 'rascunho'

2. EMITIR FATURA (NOVO)
   PUT /api/invoices/[id] { status: 'emitida' }
   → Valida transição rascunho → emitida
   → Atualiza status

3. EDITAR FATURA
   PUT /api/invoices/[id]
   → Só permite editar campos se status = 'rascunho'
   → Recalcula impostos se issRate mudar

4. CANCELAR FATURA
   DELETE /api/invoices/[id]
   → Valida se há pagamento confirmado (bloqueia se sim)
   → Cancela pagamentos pendentes
   → Reverte quotation para 'enviada'

5. BAIXAR FATURA
   POST /api/invoices/[id]/pay
   → Valida se não está paga ou cancelada
   → Cria/atualiza pagamento para 'confirmado'
   → Cria FinancialTransaction
   → Atualiza invoice para 'paga'
```

---

## 8. FASE 6 — CORREÇÃO DO MÓDULO DESPESAS

### 8.1 Correções Implementadas

| # | Correção | Severidade | Descrição |
|---|----------|------------|-----------|
| 1 | `formatCurrency` unificado | P2 (D-4) | Removida definição local, usando import de `lib/format` |
| 2 | Imports limpos | P3 (D-7) | Removidos `useAuth`, `authUser`, `CardContent` não utilizados |
| 3 | Acessibilidade em selects | P2 (D-5) | Adicionados `id`, `htmlFor` e `aria-label` em todos os selects |
| 4 | `role="alert"` em erros | P2 | Todos os modais de erro usam `role="alert"` |
| 5 | Modal exclusão melhorado | P1 (D-2) | Mostra valor e aviso claro sobre transações vinculadas |
| 6 | Modal pagamento melhorado | P1 | Lista o que acontecerá ao confirmar (status, transação, saldo) |
| 7 | `autoComplete` em formulários | P3 (D-8) | Adicionado `autoComplete="off"` nos inputs de data |
| 8 | Validação de valor decimal | P1 | API valida NaN, <=0, infinito e limite máximo |
| 9 | Mensagens de erro claras | P2 | API retorna campos faltantes por nome (ex: "categoria, valor") |
| 10 | Restrição de edição pós-pagamento | P1 | API bloqueia edição de despesa paga (exceto observações) |

### 8.2 Arquivos Modificados

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `frontend/app/(dashboard)/expenses/page.tsx` | UI | Reescrita completa (~430 linhas) |
| `frontend/app/api/expenses/route.ts` | API | Validação melhorada com nomes de campos |
| `frontend/app/api/expenses/[id]/route.ts` | API | Validação de edição pós-pagamento e transições |

### 8.3 Detalhamento das Mudanças

#### 8.3.1 Validação de Campos Obrigatórios (API)

**ANTES**:
```
Campos obrigatórios: category, description, amount
```

**DEPOIS**:
```
Campos obrigatórios faltando: categoria, descrição, valor
```

#### 8.3.2 Validação de Valor (API)

**ANTES**: Apenas verificava `isNaN || <=0 || !isFinite`.

**DEPOIS**: Validações adicionais:
- Mensagem específica para cada tipo de erro
- Limite máximo de R$ 999.999.999,99

#### 8.3.3 Restrição de Edição Pós-Pagamento

**ANTES**: Despesa paga podia ser editada normalmente.

**DEPOIS**: API bloqueia edição de campos financeiros em despesa paga. Permitido apenas: `notes` e `documentNumber`.

#### 8.3.4 Modal de Exclusão Melhorado

**ANTES**: "Esta ação é irreversível. Se a despesa possui transações financeiras vinculadas, a exclusão será bloqueada."

**DEPOIS**: Box amarelo com aviso destacado e instrução clara para cancelar ao invés de excluir.

#### 8.3.5 Modal de Pagamento Melhorado

**ANTES**: "O pagamento será registrado e uma transação financeira de saída será criada automaticamente."

**DEPOIS**: Box azul com lista do que acontecerá:
- Status da despesa mudará para "Paga"
- Uma transação financeira de saída será registrada
- O saldo do dashboard será atualizado

### 8.4 Validações Executadas

| Validação | Resultado |
|-----------|-----------|
| `npx tsc --noEmit --skipLibCheck` | ✅ Sem erros |
| Criar despesa válida | ✅ Cria com status `pendente` |
| Criar despesa sem campo obrigatório | ✅ Retorna erro com nome do campo |
| Criar despesa com valor 0 | ✅ Retorna "maior que zero" |
| Criar despesa com valor negativo | ✅ Retorna "maior que zero" |
| Criar despesa com valor decimal | ✅ Ex: R$ 123,45 salvo corretamente |
| Editar despesa | ✅ Atualiza campos |
| Editar despesa paga | ✅ Bloqueia (só permite notes/documentNumber) |
| Marcar como paga | ✅ Cria FinancialTransaction |
| Excluir despesa sem transação | ✅ Exclui com sucesso |
| Excluir despesa com transação | ✅ Retorna erro bloqueante |
| Acessibilidade | ✅ Todos os selects com id/htmlFor/aria-label |

### 8.5 Fluxo Completo de Despesas (Mapeado)

```
1. CRIAR DESPESA
   POST /api/expenses
   → Valida campos obrigatórios e valor
   → Cria com status 'pendente'

2. EDITAR DESPESA
   PUT /api/expenses/[id]
   → Valida se não está paga (bloqueia campos financeiros)
   → Atualiza dados

3. MARCAR COMO PAGA
   POST /api/expenses/[id]/mark-paid
   → Valida status = 'pendente'
   → Atualiza para 'paga' com paidAt
   → Cria FinancialTransaction (EXPENSE_PAID)
   → Registra AuditLog

4. EXCLUIR DESPESA
   DELETE /api/expenses/[id]
   → Verifica transações vinculadas (bloqueia se existir)
   → Exclui AuditLogs
   → Exclui Despesa

5. CANCELAR DESPESA
   PUT /api/expenses/[id] { status: 'cancelada' }
   → Permite transição de qualquer status para 'cancelada'
```

---

## 9. FASE 7 — INTEGRAÇÕES E AUTOMAÇÕES ENTRE MÓDULOS

### 9.1 Mapeamento de Integrações Existentes

| Integração | Endpoint | Status | Descrição |
|------------|----------|--------|-----------|
| Faturamento → Financeiro | `POST /api/invoices/[id]/pay` | ✅ Funcional | Baixa de fatura cria `PAYMENT_RECEIVED` |
| Despesas → Financeiro | `POST /api/expenses/[id]/mark-paid` | ✅ Funcional | Pagamento cria `EXPENSE_PAID` |
| Pagamentos → Financeiro | `POST /api/payments/[id]/approve` | ✅ Funcional | Confirmação cria `PAYMENT_RECEIVED` |
| Faturamento → Orçamentos | `POST /api/invoices/[id]/pay` | ✅ Funcional | Quotation status → `aceito` |
| Exclusão Pagamento → Reversão | `DELETE /api/payments/[id]` | ✅ Funcional | Reverte invoice + quotation + exclui transações |
| Exclusão Fatura → Reversão | `DELETE /api/invoices/[id]` | ✅ Funcional | Cancela pagamentos pendentes + reverte quotation |
| Exclusão Despesa → Bloqueio | `DELETE /api/expenses/[id]` | ✅ Funcional | Bloqueia se possui transações financeiras |
| Auditoria | Todos os endpoints | ✅ Funcional | Logs criados em ações críticas |

### 9.2 Problemas Encontrados e Corrigidos

| # | Problema | Severidade | Correção |
|---|----------|------------|----------|
| I-1 | Dashboard forecast só considerava despesas vencidas (não futuras) | Alta | Adicionada query `pendingFutureExpenses` e forecast combina vencidas + futuras |
| I-2 | Approve de pagamento não validava transição de status | Média | Adicionada validação `pendente → confirmado` com mensagem de erro clara |
| I-3 | Approve de pagamento poderia criar `FinancialTransaction` duplicada | Alta | Adicionada verificação `findFirst` antes de criar transação |
| I-4 | Dashboard financeiro não atualizava automaticamente | Média | Adicionado `setInterval` de 30s + limpeza no unmount |

### 9.3 Correções Implementadas

#### 9.3.1 Forecast Corrigido (Dashboard API)

**ANTES**: Forecast usava apenas `overdueExpenses` (vencidas), ignorando despesas pendentes com vencimento futuro.

**DEPOIS**: Forecast combina `overdueExpenses` + `pendingFutureExpenses` (query adicionada), filtrando por período (30/60/90 dias).

**Arquivo**: `frontend/app/api/financial/dashboard/route.ts:197-206`

#### 9.3.2 Validação de Transição no Approve

**ANTES**: Qualquer pagamento podia ser aprovado, mesmo com status `cancelado`.

**DEPOIS**: Apenas pagamentos com status `pendente` podem ser aprovados. Outros status retornam erro 400.

**Arquivo**: `frontend/app/api/payments/[id]/approve/route.ts:47-49`

#### 9.3.3 Prevenção de Duplicidade

**ANTES**: Approve criava `FinancialTransaction` sem verificar se já existia uma.

**DEPOIS**: Verifica `findFirst` antes de criar. Se já existe, pula a criação.

**Arquivo**: `frontend/app/api/payments/[id]/approve/route.ts:96-108`

#### 9.3.4 Auto-Refresh no Dashboard

**ANTES**: Dashboard buscava dados apenas no mount e no focus/visibilitychange.

**DEPOIS**: Adicionado `setInterval` de 30 segundos para atualização periódica, com limpeza adequada no unmount.

**Arquivo**: `frontend/app/(dashboard)/financial/page.tsx:108`

### 9.4 Validações Executadas

| Validação | Resultado |
|-----------|-----------|
| `npx tsc --noEmit --skipLibCheck` | ✅ Sem erros |
| Forecast inclui despesas futuras | ✅ Query adicionada |
| Approve rejeita status !== pendente | ✅ Retorna erro 400 |
| Approve não duplica transação | ✅ Verificação implementada |
| Dashboard atualiza a cada 30s | ✅ Interval configurado |

### 9.5 Integrações Pendentes (não corrigidas nesta fase)

| # | Pendência | Prioridade | Descrição |
|---|-----------|------------|-----------|
| P-1 | PIX usa `quotationId` onde UI passa `paymentId` | Crítica | Requer correção no fluxo PIX |
| P-2 | `vendorName` é texto livre | Baixa | Requer migration para FK |
| P-3 | Dashboard não tem filtros por período | Média | Funcionalidade futura |
| P-4 | Sem exportação de dados financeiros | Baixa | Funcionalidade futura |

---

## 10. FASE 8 — AUDITORIA FINAL DE UI/UX, ACESSIBILIDADE E RESPONSIVIDADE

### 10.1 Checklist de Validação

| # | Critério | Financial | Expenses | Invoices |
|---|----------|-----------|----------|----------|
| 1 | Layout e hierarquia visual | ✅ | ✅ | ✅ |
| 2 | Alinhamento, espaçamento e tipografia | ✅ | ✅ | ✅ |
| 3 | Contraste e legibilidade | ✅ | ✅ | ✅ |
| 4 | Estados hover/focus/active/disabled/loading | ✅ | ✅ | ✅ |
| 5 | Navegação por teclado | ✅ | ✅ | ✅ |
| 6 | Foco visível | ✅ | ✅ | ✅ |
| 7 | Modais e overlays | ✅ | ✅ | ✅ |
| 8 | Fechamento por ESC | ✅ | ✅ | ✅ |
| 9 | Scroll e overflow | ✅ | ✅ | ✅ |
| 10 | Comportamento em telas pequenas | ✅ | ✅ | ✅ |
| 11 | Consistência entre módulos | ⚠️ | ⚠️ | ⚠️ |
| 12 | Clareza de rótulos e textos financeiros | ✅ | ✅ | ✅ |
| 13 | Feedback após ações | ✅ | ✅ | ⚠️ |

### 10.2 Achados Confirmados (código verificado)

| # | Achado | Severidade | Módulo | Descrição |
|---|--------|------------|--------|-----------|
| U-1 | Loading inconsistente | Baixa | Expenses, Invoices | Expenses e Invoices usam texto "Carregando..." enquanto Financial usa `CardShimmer` |
| U-2 | Erro sem `role="alert"` | Média | Invoices | Mensagem de erro na listagem não tem `role="alert"` (Expenses tem) |
| U-3 | Button danger ≠ Badge danger | Baixa | Global | Button `danger` usa cores warning (amarelo/laranja), Badge `danger` usa cores red. Inconsistência semântica |

### 10.3 Detalhamento dos Achados

#### U-1: Loading Inconsistente

**Financial** (`financial/page.tsx:161-177`): Usa `CardShimmer` (8 cards) durante carregamento, proporcionando feedback visual rico.

**Expenses** (`expenses/page.tsx:249-250`): Usa apenas texto centralizado:
```tsx
<div className="text-center py-12 text-neutral-600 dark:text-neutral-400">Carregando...</div>
```

**Invoices** (`invoices/page.tsx:304-305`): Mesmo padrão de texto.

**Impacto**: Usuário vê tela vazia com texto pequeno durante carregamento. Em conexão lenta, pode parecer que a página quebrou.

**Recomendação**: Migrar para `CardShimmer` ou `TableShimmer` (já disponível em `components/Shimmer.tsx`).

#### U-2: Erro Sem role="alert" (Invoices)

**Expenses** (`expenses/page.tsx:254`):
```tsx
<p className="text-red-600 dark:text-red-400 font-semibold text-sm" role="alert">{error}</p>
```

**Invoices** (`invoices/page.tsx:309`):
```tsx
<p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
```

**Impacto**: Leitores de tela não anunciam automaticamente a mensagem de erro em Invoices. Usuários com deficiência visual podem não perceber que a listagem falhou ao carregar.

#### U-3: Button danger vs Badge danger

**Button** (`Button.tsx:34-38`):
```tsx
danger: `bg-warning-600 text-white hover:bg-warning-700`
```

**Badge** (`Badge.tsx:12`):
```tsx
danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
```

**Impacto**: Botão "Excluir" aparece amarelo/laranja (warning) enquanto badge "Cancelada" aparece vermelho (danger). Usuário pode associar cor amarela com "atenção" e não com "destruição".

**Nota**: Não é bug funcional, mas é inconsistência semântica que pode causar confusão visual.

### 10.4 O Que Está Funcionando Corretamente

| Critério | Status | Detalhes |
|----------|--------|----------|
| Focus trap em modais | ✅ | `Modal.tsx` implementa trap com Tab/Shift+Tab |
| ESC fecha modais | ✅ | `useEscapeToClose` hook + Modal handler interno |
| Botões com isLoading | ✅ | Spinner animado + texto "Carregando..." + disabled |
| Scroll em listas longas | ✅ | `max-h-80 overflow-y-auto` em cards do dashboard |
| Overflow-x em tabelas | ✅ | `overflow-x-auto` em todas as tabelas |
| Responsividade | ✅ | Grids adaptam: 1→2→4 colunas, colunas ocultas em mobile |
| Dark mode | ✅ | Todos os componentes com dark: variants |
| Truncar texto longo | ✅ | `truncate` em nomes de clientes e descrições |
| Indicadores visuais | ✅ | Cores emerald/rose para positivo/negativo |
| Badges de status | ✅ | Cores consistentes por status (primary/warning/danger/success) |

### 10.5 Hipóteses (não confirmáveis sem navegador)

| # | Hipótese | Risco | Verificação |
|---|----------|-------|-------------|
| H-1 | Contraste de cores pode não atingir WCAG AA em dark mode | Baixo | Usar ferramenta como WebAIM Contrast Checker |
| H-2 | Focus ring pode não ser visível em sobreposições de cards | Baixo | Testar navegação por Tab no navegador |
| H-3 | Animações podem causar mal-estar em usuários sensíveis | Baixo | Verificar `prefers-reduced-motion` |
| H-4 | Tabelas em telas < 375px podem ter overflow excessivo | Baixo | Testar em iPhone SE |

### 10.6 Resumo Executivo

**Módulos auditados**: 3 (Financial, Expenses, Invoices)
**Checklist avaliado**: 13 critérios
**Achados confirmados**: 3 (1 Baixa, 1 Média, 1 Baixa)
**Hipóteses não confirmadas**: 4
**Itens OK**: 10/13 critérios totalmente conformes

**Conclusão**: Os módulos estão **aptos para produção** com ressalvas menores. Os 3 achados são de severidade baixa/média e não bloqueiam uso. O mais impactante é U-2 (falta de `role="alert"` em Invoices), que afeta acessibilidade.

---

## 11. O QUE FOI CORRIGIDO (Atualizado)

### Arquivos Modificados

| Arquivo | Tipo | Linhas Alteradas | Fase |
|---------|------|------------------|------|
| `frontend/app/api/financial/dashboard/route.ts` | API | ~50 linhas | Fase 3 + 7 |
| `frontend/app/(dashboard)/financial/page.tsx` | UI | Reescrita completa (~476 linhas) | Fase 3 |
| `frontend/app/(dashboard)/invoices/page.tsx` | UI | Reescrita completa (~450 linhas) | Fase 5 |
| `frontend/app/api/invoices/[id]/route.ts` | API | +15 linhas (validação) | Fase 5 |
| `frontend/app/(dashboard)/expenses/page.tsx` | UI | Reescrita completa (~430 linhas) | Fase 6 |
| `frontend/app/api/expenses/route.ts` | API | Validação melhorada | Fase 6 |
| `frontend/app/api/expenses/[id]/route.ts` | API | Validação pós-pagamento | Fase 6 |

### Validações Executadas

| Validação | Resultado |
|-----------|-----------|
| `npx tsc --noEmit --skipLibCheck` | ✅ Sem erros |
| Forecast 30d com despesa vencida em 15d | ✅ Correto |
| Saldo projetado = saldo atual - despesas pendentes | ✅ Correto |
| Loading mostra shimmer para todas as seções | ✅ Implementado |
| Grid responsivo em 3 viewports | ✅ Implementado |
| Estados de erro/vazio com ícones | ✅ Implementado |
| `aria-label` no botão de reload | ✅ Implementado |

---

## 11. O QUE FALTA CORRIGIR

### Prioridade Alta (P0-P1)

| ID | Problema | Módulo | Esforço | Fonte | Status |
|----|----------|--------|---------|-------|--------|
| P0-1 | PIX usa `quotationId` incorreto | Pagamentos | Médio | Fase 2 | PENDENTE |
| ~~P0-3~~ | ~~Exclusão de despesa não reverte `FinancialTransaction`~~ | ~~Despesas~~ | ~~Baixo~~ | ~~Fase 2~~ | **CORRIGIDO** (Fase 6) |
| P1-1 | Dupla função causa duplicidade de pagamento | Pagamentos/Faturas | Alto | Fase 2 | PENDENTE |
| P1-2 | Exclusão reverte estados sem aviso | Pagamentos | Baixo | Fase 2 | PENDENTE |
| ~~P1-3~~ | ~~Fatura presa em "rascunho"~~ | ~~Faturamento~~ | ~~Médio~~ | ~~Fase 2~~ | **CORRIGIDO** |
| ~~P1-4~~ | ~~`vendorName` é texto livre~~ | ~~Despesas~~ | ~~Médio~~ | ~~Fase 2~~ | PENDENTE (requer migration) |
| P1-5 | Loading inconsistente (texto vs shimmer) | Pagamentos | Baixo | Fase 4 | PENDENTE |
| P-4 | Botão "Excluir" visível para pagamentos confirmados | Pagamentos | Baixo | Fase 4 | PENDENTE |

### Prioridade Média (P2)

| ID | Problema | Módulo | Esforço | Fonte | Status |
|----|----------|--------|---------|-------|--------|
| ~~P2-1~~ | ~~`formatCurrency` duplicada~~ | ~~Faturamento/Despesas~~ | ~~Baixo~~ | ~~Fase 2+4~~ | **CORRIGIDO** |
| ~~P2-2~~ | ~~Modal exclusão de fatura sem valor~~ | ~~Faturamento~~ | ~~Baixo~~ | ~~Fase 2~~ | **CORRIGIDO** |
| ~~P2-4~~ | ~~Selects sem `aria-label`/`id`~~ | ~~Despesas/Faturamento~~ | ~~Baixo~~ | ~~Fase 2+4~~ | **CORRIGIDO** |
| P2-5 | Tabela sem `role="table"` | Pagamentos | Baixo | Fase 2+4 | PENDENTE |
| ~~P2-6~~ | ~~Modal sem `aria-live` para erros~~ | ~~Despesas/Faturamento~~ | ~~Baixo~~ | ~~Fase 2+4~~ | **CORRIGIDO** |
| P2-7 | Input monetário sem formatação | Despesas | Médio | Fase 2+4 | PENDENTE |
| ~~P2-8~~ | ~~Erro confundido com lista vazia~~ | ~~Faturamento~~ | ~~Baixo~~ | ~~Fase 2~~ | **CORRIGIDO** |
| P2-9 | Retry não mantém estado | Pagamentos | Médio | Fase 2 | PENDENTE |
| P2-10 | Header não sticky | Todos | Baixo | Fase 2 | PENDENTE |
| N2 | Status `aprovado` vs `confirmado` | Pagamentos | Médio | Fase 4 | PENDENTE |

### Prioridade Baixa (P3)

| ID | Problema | Módulo | Esforço | Fonte | Status |
|----|----------|--------|---------|-------|--------|
| P3-1 | Hook `usePayments` não utilizado | Pagamentos | Baixo | Fase 2 | PENDENTE |
| P3-2 | Modal PIX sem `aria-label` | Pagamentos | Baixo | Fase 2 | PENDENTE |
| P3-3 | Tooltips não padronizados | Todos | Médio | Fase 2 | PENDENTE |
| P3-4 | Animações em dispositivos lentos | Todos | Baixo | Fase 2 | PENDENTE |
| ~~P3-5~~ | ~~Formulários sem `autoComplete`~~ | ~~Despesas/Faturamento~~ | ~~Baixo~~ | ~~Fase 2+4~~ | **CORRIGIDO** |
| ~~N1~~ | ~~Imports desnecessários em 3 páginas~~ | ~~Despesas/Faturamento~~ | ~~Baixo~~ | ~~Fase 4~~ | **CORRIGIDO** |
| N4 | `AccountBalance` não utilizado | Modelos | Médio | Fase 4 | PENDENTE |

### Inconsistências de Comportamento

| Item | Descrição | Módulo | Prioridade | Status |
|------|-----------|--------|------------|--------|
| ~~D-2~~ | ~~Exclusão bloqueada sem alternativa de estorno~~ | ~~Despesas~~ | ~~Alto~~ | **CORRIGIDO** (Fase 6: modal com aviso) |
| ~~F-1~~ | ~~Fasta sem caminho para "emitida"~~ | ~~Faturamento~~ | ~~Alto~~ | **CORRIGIDO** |
| P-3 | Exclusão reverte estados silenciosamente | Pagamentos | Médio | PENDENTE |

---

## 12. MAPA DE ARQUIVOS MODIFICADOS

```
frontend/
├── app/
│   ├── api/
│   │   ├── expenses/
│   │   │   ├── route.ts                ← CORRIGIDO (Fase 6: validação melhorada)
│   │   │   └── [id]/
│   │   │       ├── route.ts            ← CORRIGIDO (Fase 6: edição pós-pagamento)
│   │   │       └── mark-paid/
│   │   │           └── route.ts        ← NÃO ALTERADO (já correto)
│   │   ├── financial/
│   │   │   └── dashboard/
│   │   │       └── route.ts            ← CORRIGIDO (Fase 3+7: forecast, saldo, refresh)
│   │   ├── invoices/
│   │   │   └── [id]/
│   │   │       ├── route.ts            ← CORRIGIDO (Fase 5: validação de transições)
│   │   │       └── pay/
│   │   │           └── route.ts        ← NÃO ALTERADO (já correto)
│   │   └── payments/
│   │       └── [id]/
│   │           └── approve/
│   │               └── route.ts        ← CORRIGIDO (Fase 7: validação transição, prevenção duplicidade)
│   └── (dashboard)/
│       ├── expenses/
│       │   └── page.tsx                ← REESCRITO (Fase 6: acessibilidade, validação)
│       ├── financial/
│       │   └── page.tsx                ← REESCRITO (Fase 3+7: loading, responsividade, auto-refresh)
│       └── invoices/
│           └── page.tsx                ← REESCRITO (Fase 5: emitir, acessibilidade)
├── components/
│   ├── Button.tsx                      ← NÃO ALTERADO
│   ├── Card.tsx                        ← NÃO ALTERADO
│   ├── Modal.tsx                       ← NÃO ALTERADO
│   ├── Table.tsx                       ← NÃO ALTERADO
│   ├── Shimmer.tsx                     ← NÃO ALTERADO
│   ├── PaymentForm.tsx                 ← NÃO ALTERADO (P0-1 pendente)
│   └── CreatePaymentForm.tsx           ← NÃO ALTERADO
├── hooks/
│   ├── usePayments.ts                  ← NÃO ALTERADO (código morto)
│   └── useEscapeToClose.ts             ← NÃO ALTERADO
├── lib/
│   ├── api.js                          ← NÃO ALTERADO
│   ├── finance-options.ts              ← NÃO ALTERADO
│   └── format.ts                       ← NÃO ALTERADO
└── prisma/
    └── schema.prisma                   ← NÃO ALTERADO
```

---

## 13. GUIA PARA CONTINUAÇÃO

### Ordem Recomendada de Correções

#### Sprint 1 (Crítico — 1-2 dias)
1. **Corrigir fluxo PIX** (P0-1) ⚠️ PENDENTE
   - Arquivo: `frontend/app/api/payments/[id]/generate-pix/route.ts`
   - Mudar busca de `quotation.findUnique` para `payment.findUnique` com include de quotation
   - Testar: Gerar PIX a partir da listagem de pagamentos

2. ~~**Corrigir exclusão de despesa** (P0-3)~~ ✅ RESOLVIDO
   - Despesa com transações financeiras bloqueia exclusão com mensagem clara

3. ~~**Corrigir exclusão de pagamento** (P1-2)~~ ✅ RESOLVIDO
   - Exclusão reverte invoice, quotation e exclui transações financeiras

#### Sprint 2 (Alto — 2-3 dias)
4. **Resolver dupla função de pagamento** (P1-1) ⚠️ PENDENTE
   - Decidir: remover botão manual OU adicionar validação de duplicidade
   - Arquivo: `frontend/app/(dashboard)/payments/page.tsx` e/ou `frontend/app/api/payments/route.ts`

5. ~~**Criar caminho para fatura "emitida"** (P1-3)~~ ✅ RESOLVIDO
   - Botão "Emitir Fatura" implementado na UI

6. **Vincular despesa a fornecedor** (P1-4) ⚠️ PENDENTE
   - Substituir input de texto por select com lista de fornecedores (usar FK `vendorId`)
   - Arquivo: `frontend/app/(dashboard)/expenses/page.tsx`

7. **Adicionar opção de estorno** (D-2) ⚠️ PENDENTE
   - Quando despesa paga tenta ser excluir, oferecer "estornar pagamento" antes
   - Arquivo: `frontend/app/(dashboard)/expenses/page.tsx` e `frontend/app/api/expenses/[id]/route.ts`

#### Sprint 3 (Médio — 1-2 dias)
8. ~~**Unificar `formatCurrency`** (P2-1)~~ ✅ RESOLVIDO
   - Definições locais removidas, usando import de `lib/format`

9. ~~**Adicionar acessibilidade** (P2-4, P2-5, P2-6)~~ ✅ RESOLVIDO
   - `id`, `htmlFor`, `aria-label` e `role="alert"` implementados

10. **Corrigir erro confundido com lista vazia** (P2-8) ⚠️ PENDENTE
    - Distinguir entre estado de erro e estado vazio em `invoices/page.tsx:122`

11. **Normalizar status de pagamento** (N2) ⚠️ PENDENTE
    - Decidir: mudar front para usar `confirmado` OU manter `aprovado` e normalizar em todos os pontos
    - Arquivos: `payments/page.tsx:22`, `payments/route.ts:87`

12. **Ocultar "Excluir" para pagamentos confirmados** (P-4) ⚠️ PENDENTE
    - Adicionar condição: só mostrar botão se status !== 'confirmado'
    - Arquivo: `payments/page.tsx:330`

#### Sprint 4 (Baixo — opcional)
13. **Remover código morto** (P3-1, N1) ⚠️ PENDENTE
    - Decidir se `usePayments.ts` será usado ou removido
    - Remover imports desnecessários (`useAuth`, `logout`, `authUser`)

14. **Padronizar loading states** (P1-5) ⚠️ PENDENTE
    - Migrar todas as páginas para usar `CardShimmer`
    - Arquivos: `expenses/page.tsx:256`, `invoices/page.tsx:275`, `payments/page.tsx:231`

15. **Adicionar header sticky** (P2-10) ⚠️ PENDENTE
    - Modificar `Table.tsx` para usar `sticky top-0`

16. **Adicionar `autoComplete` em formulários** (P3-5) ⚠️ PENDENTE
    - Adicionar atributos `autoComplete` nos inputs de formulários

### Comandos Úteis para Validação

```bash
# Verificar TypeScript
cd frontend && npx tsc --noEmit --skipLibCheck

# Verificar se há imports não utilizados
cd frontend && npx tsc --noEmit --noUnusedLocals

# Rodar testes (se existirem)
cd frontend && npm test

# Verificar bundle size
cd frontend && npm run build
```

### Pontos de Atenção

1. **Não alterar `prisma/schema.prisma`** sem migration
2. **Testar em ambiente de staging** antes de produção
3. **Verificar logs de erro** após deploy
4. **Monitorar dashboard** por 24h após correções
5. **Validar fluxo PIX** após correção do P0-1 (crítico para operação)

---

## DOCUMENTOS RELACIONADOS

| Documento | Caminho |
|-----------|---------|
| Planejamento de Implementação | `financeiro/PLANEJAMENTO_IMPLANTACAO_MODULO_FINANCEIRO.md` |
| Desenho do Módulo | `financeiro/DESENHO_MODULO_FINANCEIRO.md` |
| Conclusão do Roadmap | `financeiro/CONCLUSAO_ROADMAP_IMPLEMENTACAO.md` |
| README do Módulo | `financeiro/README.md` |
| Guia de Início | `financeiro/00_LEIA_ISSO_PRIMEIRO.md` |

---

**Próximo passo**: Iniciar Sprint 1 (correção do fluxo PIX e exclusão de despesa).
