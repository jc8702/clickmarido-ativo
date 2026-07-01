# CORREÇÕES SISTEMA — TODOS OS MÓDULOS

## Visão Geral

Documento de implementação para estabilização e evolução do sistema ClickMarido. Cobertura de todos os módulos com correções críticas, normalização, testes e roadmap completo.

**Status atual (30/06/2026):**
- 54 rotas migradas para auth centralizado (`lib/auth.ts`)
- Enums restaurados no schema (LeadStatus, LeadFunnelStage)
- Build Vercel funcional (86 páginas)
- Commit `60b87ac` enviado para `origin/main`

**Arquivo de referência:** `RESUMO_PROJETO.md`

---

## 1. ACHADOS POR SEVERIDADE

### P0 — Críticos

#### 1.1 Inconsistência de Status Críticos entre Módulos

Há uso misto de valores como `confirmado`, `pago`, `emitida`, `gerada`, `aceito`, `aprovado`, `concluida` em rotas e dashboard. Isso pode quebrar somatórios, automações, webhooks e relatórios financeiros.

**Impacto:** Números divergentes e automações silenciosamente erradas.

#### 1.2 Risco de Divergência entre Fonte da Verdade do Financeiro e Telas Agregadas

O sistema usa `Payment`, `Invoice` e `FinancialTransaction` em paralelo, mas nem sempre com o mesmo vocabulário de status. Se um módulo considerar "confirmado" e outro "pago", o caixa e os relatórios podem divergir.

#### 1.3 Autenticação Heterogênea em Rotas Críticas

Existem rotas com `validateToken`, outras com `verifyAuth`, e crons/webhooks com segredos próprios. Isso aumenta a chance de bypass, comportamento inconsistente e manutenção difícil.

### P1 — Altos

#### 1.4 Documentação Defasada em Relação ao Código Real

O README ainda fala como MVP simples, enquanto o projeto já tem lead scoring, CRM, automações, WhatsApp, financeiro e compras avançados.

#### 1.5 Automação Forte, mas Pouco Observável

Webhooks e crons existem, mas não há evidência clara de fila, retry controlado, idempotência central e monitoramento uniforme em todas as integrações.

#### 1.6 Integrações de WhatsApp e Mensagens com Acoplamento Desigual

Há rotas e utilitários funcionais, mas a organização parece menos consistente do que pagamentos e financeiro.

#### 1.7 Testes Insuficientes para Fluxos Críticos

O pacote mostra testes e relatórios, mas faltam evidências de cobertura sistemática dos fluxos mais arriscados: webhook de pagamento, fechamento de OS, criação de OC e transições de lead.

### P2 — Médios

#### 1.8 Experiência de Produto Pode Ficar Confusa em Áreas Muito Densas

O sistema tem bastante capacidade, mas algumas telas e rotas provavelmente precisam de simplificação e guiamento.

#### 1.9 IA Já Começou, mas Ainda Está Pontual

Existe estimativa de preço, porém a IA ainda não está "embutida" nos fluxos operacionais de ponta a ponta.

#### 1.10 Padronização de Nomenclatura e Domínio Ainda Incompleta

O crescimento do produto parece ter gerado variações de naming que merecem limpeza.

---

## 2. INVENTÁRIO COMPLETO DE STATUS POR ENTIDADE

### 2.1 Prisma Schema (Fonte da Verdade)

Todos os status dos modelos principais são `String` sem validação no banco — qualquer valor é aceito.

| Modelo | Campo | Default | Valores Aceitos (schema) |
|--------|-------|---------|--------------------------|
| Quotation | `status` | `"rascunho"` | *any string* |
| ServiceOrder | `status` | `"agendada"` | *any string* |
| Payment | `status` | `"pendente"` | *any string* |
| Invoice | `status` | `"rascunho"` | *any string* |
| Expense | `status` | `"pendente"` | *any string* |
| PurchaseOrder | `status` | `"rascunho"` | *any string* |
| PurchaseOrderItem | `status` | `"pendente"` | *any string* |
| Appointment | `status` | `"agendada"` | *any string* |
| Lead | `status` | `FRIO` | enum LeadStatus |
| Lead | `funnelStage` | `NOVO_LEAD` | enum LeadFunnelStage |
| LeadAppointment | `status` | `AGENDADO` | enum AppointmentStatus |

### 2.2 Quotation (Orçamento)

| Valor | API Routes | Frontend | Kanban | Label UI |
|-------|-----------|----------|--------|----------|
| `rascunho` | POST create | statusColors | ✓ | Rascunho / Novo |
| `pendente` | — | statusColors | ✓ | Pendente / Em Análise |
| `enviado` | quotation-expiry-check | statusColors | ✓ | Enviado / Em Negociação |
| `aceito` | [id]/route.ts (auto-create OS) | handleApprove | ✓ | Aceito / Ganho / Aprovado |
| `aprovado` | — | statusColors / ClientPage | — | Aprovado |
| `rejeitado` | [id]/route.ts / reject route | handleReject | ✓ | Rejeitado / Reprovado / Perdido |
| `cancelado` | quotation-expiry-check | — | — | (usado apenas no cron) |

**Inconsistências:**
- `aceito` vs `aprovado`: ambos mapeiam para "Aprovado". API usa `aceito`, frontend aceita ambos.
- `rejeitado` vs `reprovado`: API usa `rejeitado`, mas `ClientPage` mostra label "Reprovado".
- `cancelado` usado no cron mas sem coluna Kanban nem label.

### 2.3 ServiceOrder (Ordem de Serviço)

| Valor | API Routes | Frontend (service-orders/) | Dashboard |
|-------|-----------|---------------------------|-----------|
| `agendada` | POST create (default) | statusBadgeVariant | — |
| `em_execucao` | PATCH /start | statusBadgeVariant | — |
| `concluida` | PATCH /complete | statusBadgeVariant | statusBadgeVariant |
| `cancelada` | — | statusBadgeVariant | statusBadgeVariant |
| `em_progresso` | — | — | statusBadgeVariant (DASHBOARD!) |

**Inconsistência crítica:** `em_execucao` (service-orders/page.tsx) vs `em_progresso` (dashboard/page.tsx). Dashboard NUNCA vai mostrar OS em andamento corretamente.

### 2.4 Payment (Pagamento)

| Valor | API Routes | Frontend | Webhook |
|-------|-----------|----------|---------|
| `pendente` | POST /approve (validates) | statusLabels | — |
| `confirmado` | POST /approve, POST /invoices/[id]/pay | statusLabels | webhook MP (via mapMpStatusToInternal) |
| `aprovado` | — | statusLabels / CreatePaymentForm | — |
| `pago` | — | — | webhook Asaas |
| `cancelado` | DELETE invoices/[id] | — | — |

**Inconsistência crítica:** `aprovado` vs `confirmado` vs `pago` — TRÊS valores para "pagamento realizado".
- CreatePaymentForm envia `aprovado` como default
- POST /payments normaliza: `aprovado` → `confirmado`
- webhook Asaas grava `pago`
- webhook MP grava `confirmado`
- Resultado: statuses `aprovado`, `confirmado` e `pago` coexistem no banco

### 2.5 Invoice (Nota Fiscal)

| Valor | API Routes | Frontend |
|-------|-----------|----------|
| `rascunho` | POST create (default) | statusLabels |
| `emitida` | PUT [id] | statusLabels |
| `paga` | POST [id]/pay, PUT [id]/approve | statusLabels |
| `cancelada` | DELETE [id] | statusLabels |

### 2.6 PurchaseOrder (Ordem de Compra)

| Valor | API Routes | Frontend (StatusBadge) |
|-------|-----------|----------------------|
| `rascunho` | POST create (default) | configs |
| `emitida` | POST /emit | configs |
| `aprovada` | POST /approve | configs |
| `parcialmente_recebida` | POST /receive | configs |
| `recebida` | POST /receive | configs |
| `cancelada` | POST /cancel | configs |

**PurchaseOrderItem status:**
| Valor | API Routes |
|-------|-----------|
| `pendente` | default |
| `recebido_total` | POST /receive |
| `recebido_parcial` | POST /receive |
| `cancelado` | POST /cancel |

**Inconsistência:** `products/[id]/purchase-history` compara `status === 'recebido'` mas o valor correto é `recebida`. Gênero feminino vs masculino.

### 2.7 Expense (Despesa)

| Valor | API Routes | Frontend |
|-------|-----------|----------|
| `pendente` | POST create (default) | statusLabels |
| `paga` | POST /mark-paid | statusLabels |
| `cancelada` | POST /cancel (from PO cancel) | statusLabels |

### 2.8 Appointment (Agendamento)

| Valor | API Routes (transitions) | Frontend |
|-------|-------------------------|----------|
| `agendada` | validTransitions origin | getStatusColor |
| `confirmada` | validTransitions | — |
| `em_andamento` | validTransitions | — |
| `concluida` | validTransitions | — |
| `cancelada` | validTransitions | — |
| `nao_compareceu` | validTransitions | — |

**Problema:** Dois sistemas de status conflitantes:
- Appointment usa String: `agendada`, `confirmada`, `em_andamento`, `concluida`
- LeadAppointment usa enum: `AGENDADO`, `REAGENDADO`, `CONFIRMADO`, `FALTOU`, `REALIZADO`

### 2.9 Lead (CRM)

Módulo Lead usa **enums Prisma** (validados no banco):

| Enum | Valores |
|------|---------|
| LeadStatus | FRIO, MORNO, QUENTE, URGENTE, PRONTO_ORCAMENTO |
| LeadFunnelStage | NOVO_LEAD, EM_TRIAGEM, QUALIFICADO, EM_FOLLOWUP, AGENDADO, ENCAMINHADO_ORCAMENTO, DESCARTADO, SEM_CONTATO, EM_CONTATO, CONTATO_REALIZADO, LEAD_QUALIFICADO, LEAD_NAO_QUALIFICADO, REUNIAO_AGENDADA, COMPARECEU, PROPOSTA_SOLICITADA, PROPOSTA_ENVIADA, EM_NEGOCIACAO, GANHO, PERDIDO, SEM_RESPOSTA, REATIVADO |
| AppointmentStatus | AGENDADO, REAGENDADO, CONFIRMADO, FALTOU, REALIZADO |

---

## 3. INVENTÁRIO COMPLETO DE AUTENTICAÇÃO

### 3.1 Padrões de Auth Existentes

| Função | Arquivo | Tipo | Retorno | Uso |
|--------|---------|------|---------|-----|
| `validateToken` | `lib/auth.ts` | Síncrona | `{ userId, email, role } \| null` | Maioria das rotas |
| `verifyAuth` | `lib/auth.ts` | Async | `{ success, user, error }` | Rotas mais novas |
| `verifyToken` | `lib/auth.ts` | Síncrona | `decoded \| null` | Uso interno |
| `decodeToken` | Local em 3+ arquivos | Síncrona | `decoded \| null` | service-orders, users |
| `getUserId` | `components/whatsapp/utils/auth.ts` | Síncrona | `userId \| null` | WhatsApp |

### 3.2 Rotas SEM Autenticação (Vulnerabilidades)

| Rota | Arquivo | Risco |
|------|---------|-------|
| `GET /api/analytics` | `analytics/route.ts` | Dados mock hardcoded sem auth |
| `GET /api/cron/sla` | `cron/sla/route.ts` | Qualquer pessoa executa cron |
| `GET /api/reviews/summary` | `reviews/summary/route.ts` | Vazamento de dados |
| `GET /api/reviews/technician/[id]` | `reviews/technician/[technicianId]/route.ts` | Vazamento de dados |
| `GET/PATCH/DELETE /api/appointments/[id]` | `appointments/[id]/route.ts` | CRUD completo sem auth + mass assignment |
| `PUT /api/appointments/[id]/status` | `appointments/[id]/status/route.ts` | Alteração de status sem auth |
| `GET /api/appointments/conflicts` | `appointments/conflicts/route.ts` | Vazamento de agenda |
| `GET /api/appointments/technician/[id]/week` | `appointments/technician/[technicianId]/week/route.ts` | Vazamento de agenda |

### 3.3 Bug Crítico no Cron SLA-Check

**Arquivo:** `app/api/cron/sla-check/route.ts:27`

```typescript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Se `CRON_SECRET` não estiver definido, a verificação é completamente bypassada.

### 3.4 Rotas Cron — Auth

| Rota | Auth | Status |
|------|------|--------|
| `/api/cron/daily-report` | `CRON_SECRET` Bearer | OK |
| `/api/cron/warranty-expiry-check` | `CRON_SECRET` Bearer | OK |
| `/api/cron/quotation-expiry-check` | `CRON_SECRET` Bearer | OK |
| `/api/cron/payment-reminders` | `CRON_SECRET` Bearer | OK |
| `/api/cron/sla-check` | `CRON_SECRET` Bearer | BUGADO |
| `/api/cron/sla` | NENHUM | VULNERÁVEL |

### 3.5 Webhooks — Auth

| Rota | Auth | Status |
|------|------|--------|
| `/api/webhooks/asaas` | HMAC SHA-256 com `ASAAS_WEBHOOK_SECRET` | OK |
| `/api/payments/webhook-mp` | HMAC com `MERCADO_PAGO_WEBHOOK_SECRET` | OK |

### 3.6 PrismaClient Singleton

14 arquivos ainda usam `new PrismaClient()` em vez de `import { prisma } from '@/lib/prisma'`:

1. `app/api/appointments/[id]/status/route.ts`
2. `app/api/appointments/[id]/route.ts`
3. `app/api/appointments/technician/[technicianId]/week/route.ts`
4. `app/api/customers/[id]/route.ts`
5. `app/api/users/[id]/route.ts`
6. `app/api/whatsapp/labels/[id]/route.ts`
7. `app/api/reviews/technician/[technicianId]/route.ts`
8. `app/api/payments/[id]/create-pix/route.ts`
9. `app/api/payments/[id]/create-boleto/route.ts`
10. `app/api/warranties/[id]/claim/route.ts`
11. `app/api/service-orders/[id]/materials/route.ts`
12. `app/api/service-orders/[id]/signature/route.ts`
13. `app/api/service-orders/[id]/start/route.ts`
14. `app/api/products/[id]/route.ts`

---

## 4. INVENTÁRIO DE TESTES

### 4.1 Testes Existentes (Jest)

| Arquivo | Testes | O que testa |
|---------|--------|-------------|
| `__tests__/lib/pricing-engine.test.ts` | 5 | `estimateServicePrice`: preco base, historico, urgencia, risco/altura, desconto simples |
| `__tests__/lib/finance-options.test.ts` | 10 | Categorias de despesa, centros de custo, funcoes de label |

### 4.2 Testes Ad-hoc (Scripts Manuais)

| Arquivo | O que faz |
|---------|-----------|
| `tests/api/test-suite.js` | Testa login, rotas protegidas, produtos, clientes, pagamentos contra URL de produção |
| `test_prisma_update.js` | Testa criacao/atualizacao de lead via Prisma |
| `test_prisma_put_flow.js` | Testa fluxo PUT de lead |
| `test_db.js` | Testa conexao com banco |
| `test_crm_flow.js` | Testa fluxo CRM completo: login, criar lead, qualificar, etc. |
| `test_create_po.js` | Testa criacao de Purchase Order via Prisma |

### 4.3 Gaps de Teste (O que NÃO é testado)

| Area | Prioridade | Descrição |
|------|-----------|-----------|
| Webhook handlers | Crítica | Nenhum teste para `webhooks/asaas` ou `payments/webhook-mp` |
| Conclusão de OS | Crítica | Nenhum teste para logica de conclusao e automacoes |
| Autenticação middleware | Crítica | Nenhum teste unitario para `validateToken`, `verifyAuth` |
| Criação de PO | Alta | Apenas `test_create_po.js` (ad-hoc), sem testes Jest |
| Transições de Lead | Alta | Apenas `test_crm_flow.js` (ad-hoc), sem testes Jest |
| Aprovação de pagamento | Alta | Nenhum teste para `payments/[id]/approve` |
| Geração de PIX | Alta | Nenhum teste para `payments/[id]/generate-pix` |
| Criação de orçamento | Alta | Nenhum teste para `quotations` POST |
| Invoice management | Alta | Nenhum teste para `invoices` |
| Finance Sync | Alta | Nenhum teste para `lib/finance-sync.ts` |
| Expiração de garantia | Média | Nenhum teste para cron de garantia |
| SLA checking | Média | Nenhum teste para cron de SLA |
| Agendamentos | Média | Nenhum teste para `appointments` |
| Notificações | Média | Nenhum teste para `lib/notifications/whatsapp` |

---

## 5. MAPA DE MÓDULOS

### Core Administrativo
- Autenticação e usuários (`app/api/auth/`, `app/api/users/`)
- Dashboard geral (`app/api/dashboard/`, `app/(dashboard)/dashboard/`)
- Clientes (`app/api/customers/`, `app/(dashboard)/customers/`)
- Configurações (`app/api/settings/`, `app/(dashboard)/settings/`)
- Perfil (`app/(dashboard)/profile/`)

### CRM e Pré-Vendas
- Leads (`app/api/leads/`, `app/(dashboard)/pre-vendas/`)
- Qualificação (`app/api/leads/[id]/qualify/`)
- Follow-up (`app/api/leads/[id]/followup/`)
- Agendamentos (`app/api/appointments/`, `app/(dashboard)/appointments/`)
- Insights comerciais (`app/api/leads/insights/`, `app/(dashboard)/insights/`)
- NPS (`app/api/nps/`, `app/(dashboard)/nps/`)
- Notificações (`app/api/notifications/`, `app/(dashboard)/notifications/`)

### Comercial
- Orçamentos (`app/api/quotations/`, `app/(dashboard)/quotations/`)
- Itens de orçamento (`app/api/quotation-items/`)
- Visualização pública (`app/api/quotations/public/`)
- Expiração automática (`app/api/cron/quotation-expiry-check/`)
- Conversão em OS (no fluxo de `quotations/[id]/route.ts`)

### Operação
- Ordens de serviço (`app/api/service-orders/`, `app/(dashboard)/service-orders/`)
- Assinatura digital (`app/api/service-orders/[id]/signature/`)
- Fotos da OS (via upload)
- Técnicos (`app/api/technicians/`, `app/(dashboard)/vendors/`)
- Agenda (`app/api/appointments/`, `app/(dashboard)/appointments/`)

### Financeiro
- Pagamentos (`app/api/payments/`, `app/(dashboard)/payments/`)
- Faturas (`app/api/invoices/`, `app/(dashboard)/invoices/`)
- Despesas (`app/api/expenses/`, `app/(dashboard)/expenses/`)
- Dashboard financeiro (`app/api/financial/dashboard/`, `app/(dashboard)/financial/`)
- Livro caixa (`lib/finance-sync.ts`)
- Relatórios (`app/api/reports/`, `app/(dashboard)/reports/`)

### Compras e Suprimentos
- Produtos (`app/api/products/`, `app/(dashboard)/products/`)
- Fornecedores (`app/api/vendors/`, `app/(dashboard)/vendors/`)
- Pedidos de compra (`app/api/purchase-orders/`, `app/(dashboard)/purchases/`)
- Histórico de compra (`app/api/vendors/[id]/purchase-history/`)
- Entrada de material (`app/api/purchase-orders/[id]/receive/`)

### Automação
- Cron jobs (`app/api/cron/`)
- Webhooks de pagamento (`app/api/webhooks/asaas/`, `app/api/payments/webhook-mp/`)

### WhatsApp
- Logs de mensagens (`app/api/notifications/whatsapp-logs/`)
- Regras de SLA (`app/api/cron/sla/`, `app/api/cron/sla-check/`)
- Labels (`app/api/whatsapp/labels/`)
- Favoritos (`app/api/whatsapp/favorites/`)
- Arquivados (`app/api/whatsapp/archived/`)

### Garantias
- CRUD (`app/api/warranties/`, `app/(dashboard)/warranties/`)
- Claims (`app/api/warranties/[id]/claim/`)
- Expiração (`app/api/cron/warranty-expiry-check/`)

### Mobile
- App Expo (`mobile/`)
- Login, agenda, visualização de estado operacional

---

## 6. ROADMAP DE EVOLUÇÃO

### Fase 1: Estabilização do Domínio
**Objetivo:** Eliminar os 8 bugs P0, criar fonte única da verdade, unificar auth.
**Esforço estimado:** ~2-3 dias de trabalho focado.

#### 1.1 Criar Enums e Mapa Único de Status por Entidade

**Ação:** Criar enums Prisma para cada entidade e rodar migração.

| Entidade | Enum a Criar | Valores Padronizados |
|----------|-------------|---------------------|
| Quotation | `QuotationStatus` | `rascunho`, `pendente`, `enviado`, `aceito`, `rejeitado`, `cancelado` |
| ServiceOrder | `ServiceOrderStatus` | `agendada`, `em_execucao`, `concluida`, `cancelada` |
| Payment | `PaymentStatus` | `pendente`, `confirmado`, `cancelado` |
| Invoice | `InvoiceStatus` | `rascunho`, `emitida`, `paga`, `cancelada` |
| PurchaseOrder | `PurchaseOrderStatus` | `rascunho`, `emitida`, `aprovada`, `recebida`, `cancelada` |
| Expense | `ExpenseStatus` | `pendente`, `paga`, `cancelada` |
| Appointment | `AppointmentStatusModel` | `agendada`, `confirmada`, `em_andamento`, `concluida`, `cancelada`, `nao_compareceu` |

**Migração:** Criar `prisma/migrations/YYYY_add_status_enums/` que:
1. Cria os enums
2. Converte valores existentes (ex: `aprovado` → `confirmado` em Payment)
3. Altera os campos de `String` para o enum correspondente

**Arquivo de conversão:** `lib/status-map.ts` com mapa `{ valorAntigo: valorNovo }` para cada entidade.

#### 1.2 Corrigir as 8 Inconsistências P0

| # | Bug | Arquivo(s) | Correção |
|---|-----|-----------|----------|
| P0-1 | Payment: 3 valores para "pago" | `payments/[id]/approve/route.ts`, `webhooks/asaas/route.ts`, `CreatePaymentForm` | Padronizar em `confirmado`. Webhook Asaas grava `confirmado` (não `pago`). Remove normalização `aprovado→confirmado` do POST. |
| P0-2 | SO: `em_execucao` vs `em_progresso` | `dashboard/page.tsx` | Trocar `em_progresso` por `em_execucao` no dashboard |
| P0-3 | Quotation: `aceito` vs `aprovado` vs `'approved'` | `view/ClientPage.tsx` | Remover `'approved'` (inglês). Usar apenas `aceito` |
| P0-4 | Quotation: `rejeitado` vs `reprovado` | `view/ClientPage.tsx` | Já corrigido no commit `60b87ac` |
| P0-5 | PO: `recebida` vs `recebido` | `products/[id]/purchase-history/route.ts:127` | Trocar `'recebido'` por `'recebida'` |
| P0-6 | Appointment: 2 sistemas de status | `schema.prisma`, rotas | Unificar para um único enum (resolvido no item 1.1) |
| P0-7 | Quotation: `cancelado` sem Kanban | `quotations/page.tsx` | Adicionar coluna `cancelado` ao Kanban |
| P0-8 | Schema sem validação | `schema.prisma` | Resolvido pelo item 1.1 |

#### 1.3 Unificar Autenticação

**Padrão único a adotar:** `validateToken` de `lib/auth.ts` (síncrono, retorna `null` em caso de falha).

| Prioridade | Arquivo | Correção |
|------------|---------|----------|
| Crítica | `cron/sla/route.ts` | Adicionar `CRON_SECRET` Bearer check |
| Crítica | `cron/sla-check/route.ts:27` | Inverter lógica: `if (!cronSecret \|\| authHeader !== ...)` |
| Crítica | `appointments/[id]/route.ts` | Adicionar `validateToken` + validação de body (anti mass-assignment) |
| Crítica | `appointments/[id]/status/route.ts` | Adicionar `validateToken` |
| Alta | `reviews/summary/route.ts` | Adicionar `validateToken` |
| Alta | `reviews/technician/[id]/route.ts` | Adicionar `validateToken` |
| Alta | `service-orders/[id]/route.ts` | Substituir `decodeToken` local por import de `lib/auth` |
| Alta | `users/route.ts`, `users/[id]/route.ts` | Substituir `decodeToken` local por import de `lib/auth` |
| Média | `whatsapp/utils/auth.ts` | Consolidar com `lib/auth.ts` |

**PrismaClient singleton:** Substituir `new PrismaClient()` por `import { prisma } from '@/lib/prisma'` nos 14 arquivos listados na seção 3.6.

#### 1.4 Normalizar Dados Financeiros

| Ação | Arquivo |
|------|---------|
| Garantir que webhook Asaas atualiza `invoice.status` para `paga` quando `payment.status` vira `confirmado` | `webhooks/asaas/route.ts` |
| Garantir que webhook MP atualiza `invoice.status` para `paga` quando `payment.status` vira `confirmado` | `payments/webhook-mp/route.ts` |
| Campo `balance` em `FinancialTransaction` usa valor real (atualmente hardcoded `0`) | `lib/finance-sync.ts` |

#### 1.5 Atualizar Documentação

| Ação | Arquivo |
|------|---------|
| Reescrever `README.md` refletindo o sistema real (CRM, financeiro, OS, WhatsApp, IA) | `README.md` |
| Criar `docs/API.md` com inventário de todas as rotas e seus status | `docs/API.md` |
| Criar `docs/STATUS-MAP.md` com o mapa oficial de status por entidade | `docs/STATUS-MAP.md` |
| Atualizar `RESUMO_PROJETO.md` | `RESUMO_PROJETO.md` |

---

### Fase 2: Robustez Operacional
**Objetivo:** Testes, webhooks idempotentes, observabilidade.
**Depende de:** Fase 1 concluída (enums estáveis).
**Esforço estimado:** ~3-4 dias.

#### 2.1 Testes para Fluxos Críticos

| Prioridade | Fluxo | Tipo de Teste | Arquivo a Criar |
|------------|-------|--------------|-----------------|
| Crítica | Webhook Asaas | Integração | `__tests__/api/webhook-asaas.test.ts` |
| Crítica | Webhook MP | Integração | `__tests__/api/webhook-mp.test.ts` |
| Crítica | Conclusão de OS | Integração | `__tests__/api/service-order-complete.test.ts` |
| Alta | Criação de PO | Integração | `__tests__/api/purchase-order.test.ts` |
| Alta | Transição de Lead | Integração | `__tests__/api/lead-qualify.test.ts` |
| Alta | Aprovação de pagamento | Integração | `__tests__/api/payment-approve.test.ts` |
| Alta | Criação de orçamento | Integração | `__tests__/api/quotation-create.test.ts` |
| Média | Expiração de orçamento | Integração | `__tests__/api/quotation-expiry.test.ts` |
| Média | Auth middleware | Unitário | `__tests__/lib/auth.test.ts` |

**Setup necessário:**
- `__tests__/setup.ts` — setup global (mock do Prisma, helpers de auth)
- `__tests__/helpers.ts` — factories para criar dados de teste (leads, customers, etc.)

#### 2.2 Webhooks com Idempotência

| Ação | Arquivo |
|------|---------|
| Criar campo `webhookEventId String? @unique` em `Payment` | `schema.prisma` |
| Verificar `webhookEventId` antes de processar webhook | `webhooks/asaas/route.ts`, `payments/webhook-mp/route.ts` |
| Registrar `webhookEventId` após processamento bem-sucedido | `webhooks/asaas/route.ts`, `payments/webhook-mp/route.ts` |
| Adicionar campo `processedAt DateTime?` para rastreamento | `schema.prisma` |

#### 2.3 Observabilidade

| Ação | Arquivo |
|------|---------|
| Criar `lib/logger.ts` — logger estruturado com correlação por evento | `lib/logger.ts` |
| Adicionar log em todos os webhooks (entrada, processamento, resultado) | `webhooks/asaas/route.ts`, `payments/webhook-mp/route.ts` |
| Adicionar log em todas as transições de status críticas | Todas as rotas de status |
| Criar métricas básicas: webhook processados, erros, latência | `lib/metrics.ts` |

#### 2.4 Fila para Automações (Transactional Outbox)

| Ação | Arquivo |
|------|---------|
| Criar tabela `OutboxEvent` no Prisma | `schema.prisma` |
| Rotas críticas escrevem evento na tabela após commit | Todas as rotas de transição |
| Cron job processa eventos pendentes | `app/api/cron/process-outbox/route.ts` |
| Garante que automações não se percam em falhas | — |

---

### Fase 3: Inteligência de Processo
**Objetivo:** IA integrada nos fluxos operacionais.
**Depende de:** Fase 2 (dados consistentes + observabilidade).
**Esforço estimado:** ~4-5 dias.

#### 3.1 IA para Lead Scoring

**Status atual:** `estimateServicePrice` existe mas é apenas pricing.

| Ação | Arquivo |
|------|---------|
| Criar `lib/ai/lead-scorer.ts` — analisa dados do lead (origem, canal, histórico) e sugere score | `lib/ai/lead-scorer.ts` |
| Integrar no POST de criação de lead | `app/api/leads/route.ts` |
| Integrar no fluxo de qualificação | `app/api/leads/[id]/qualify/route.ts` |

#### 3.2 IA para Precificação de Orçamento

**Status atual:** `app/api/ai/estimate-price/route.ts` existe.

| Ação | Arquivo |
|------|---------|
| Melhorar o endpoint para considerar: histórico de preços, margem, sazonalidade | `app/api/ai/estimate-price/route.ts` |
| Integrar no formulário de orçamento (botão "Sugestão IA") | `app/(dashboard)/quotations/new/ClientPage.tsx` |
| Adicionar cache de sugestões | `lib/ai/price-cache.ts` |

#### 3.3 IA para Resumo de OS

| Ação | Arquivo |
|------|---------|
| Criar `lib/ai/os-summary.ts` — recebe dados da OS e gera resumo para o cliente | `lib/ai/os-summary.ts` |
| Integrar no fluxo de conclusão de OS | `app/api/service-orders/[id]/complete/route.ts` |
| Gerar mensagem automática para envio via WhatsApp | `lib/notifications/whatsapp.ts` |

#### 3.4 IA para Priorização de Cobrança

| Ação | Arquivo |
|------|---------|
| Criar `lib/ai/collection-prioritizer.ts` — analisa pagamentos pendentes e sugere prioridade | `lib/ai/collection-prioritizer.ts` |
| Integrar no dashboard financeiro | `app/(dashboard)/financial/page.tsx` |
| Integrar nos lembretes de pagamento (cron) | `app/api/cron/payment-reminders/route.ts` |

---

### Fase 4: Escala e Produto
**Objetivo:** UX, mobile, analytics.
**Depende de:** Fases 1-3.
**Esforço estimado:** ~5-7 dias.

#### 4.1 Melhorar UX das Telas Densas

| Tela | Problema | Correção |
|------|----------|----------|
| Dashboard | Muitos KPIs sem hierarquia | Reorganizar com abas: Visão Geral, Financeiro, Operacional |
| Pre-vendas | Kanban com muitas colunas | Adicionar filtro por responsável e busca |
| Orçamentos | Formulário complexo | Dividir em steps (Cliente → Itens → Pagamento → Revisão) |
| Financeiro | Dados cru sem contexto | Adicionar comparativos (mês anterior, meta) |

#### 4.2 Painéis por Persona

| Persona | Painel | Métricas |
|---------|--------|----------|
| Administrador | Geral | Receita, custos, lucro, NPS, pipeline |
| Técnico | Agenda | OS do dia, materiais, assinatura |
| Comercial | Pipeline | Leads, conversão, ticket médio |
| Financeiro | Caixa | Pagamentos, inadimplência, previsão |

#### 4.3 Mobile para Campo

**Status atual:** App Expo com login, agenda, visualização.

| Ação | Prioridade |
|------|-----------|
| Abertura/fechamento de OS no mobile | Alta |
| Captura de fotos integrada | Alta |
| Assinatura digital no mobile | Alta |
| GPS para registro de visitas | Média |

#### 4.4 Analytics e Alertas

| Ação | Arquivo |
|------|---------|
| Criar `app/api/analytics/real/route.ts` (substituir mock atual) | `app/api/analytics/route.ts` |
| Dashboard de analytics com: funil de conversão, ticket médio, tempo de ciclo | `app/(dashboard)/insights/page.tsx` |
| Alertas automáticos: pagamento atrasado, OS sem técnico, lead parado | `lib/notifications/alerts.ts` |

---

## 7. RESUMO DE DEPENDÊNCIAS

```
Fase 1 (2-3 dias)
  ├── 1.1 Enums (base para tudo)
  ├── 1.2 P0 bugs (urgente)
  ├── 1.3 Auth unificada
  ├── 1.4 Financeiro normalizado
  └── 1.5 Documentação

Fase 2 (3-4 dias) ← depende da Fase 1
  ├── 2.1 Testes
  ├── 2.2 Webhooks idempotentes
  ├── 2.3 Observabilidade
  └── 2.4 Fila de eventos

Fase 3 (4-5 dias) ← depende da Fase 2
  ├── 3.1 Lead scoring IA
  ├── 3.2 Pricing IA
  ├── 3.3 Resumo OS IA
  └── 3.4 Cobrança IA

Fase 4 (5-7 dias) ← depende das Fases 1-3
  ├── 4.1 UX improvement
  ├── 4.2 Personas
  ├── 4.3 Mobile
  └── 4.4 Analytics
```

**Total estimado: 14-19 dias de trabalho focado.**

---

## 8. CHECKLIST DE VALIDAÇÃO

### Fase 1
- [ ] Enums criados no schema.prisma
- [ ] Migração rodada sem erros
- [ ] Todos os P0 corrigidos e verificados
- [ ] Auth centralizada em lib/auth.ts
- [ ] Nenhuma rota sem auth (exceto públicas intencionais)
- [ ] PrismaClient singleton em todas as rotas
- [ ] Documentação atualizada

### Fase 2
- [ ] Testes de webhook Asaas e MP
- [ ] Testes de conclusão de OS
- [ ] Testes de criação de PO
- [ ] Testes de transição de Lead
- [ ] Idempotência em webhooks
- [ ] Logger estruturado implementado
- [ ] Outbox pattern implementado

### Fase 3
- [ ] Lead scoring IA funcional
- [ ] Pricing IA funcional
- [ ] Resumo OS IA funcional
- [ ] Cobrança IA funcional

### Fase 4
- [ ] Dashboard reorganizado
- [ ] Painéis por persona
- [ ] Mobile com OS e assinatura
- [ ] Analytics real (substituir mock)

---

## 9. MELHORIAS POR IMPACTO × ESFORÇO

### Alto impacto, baixo esforço
- Unificar status e nomenclaturas
- Atualizar documentação principal
- Centralizar autenticação
- Corrigir inconsistências de mensagens e labels
- Criar checklist de smoke tests para webhooks e OS

### Alto impacto, esforço médio
- Criar camadas formais de auditoria e idempotência
- Consolidar relatório financeiro em uma única fonte da verdade
- Adicionar testes automáticos para integrações críticas
- Implementar IA de sugestão de preço em mais pontos do funil
- Estruturar observabilidade com métricas úteis ao negócio

### Alto impacto, esforço alto
- Reestruturar automação de ponta a ponta por eventos
- Criar motor de workflows para lead → orçamento → OS → cobrança
- Evoluir o mobile para operação real de campo
- Criar assistente IA transversal em todos os módulos

### Baixo impacto, baixo esforço
- Melhorar textos e microcopy
- Ajustar consistência visual das páginas mais usadas
- Revisar placeholders e mensagens técnicas
- Limpar arquivos e documentação obsoleta

---

*Documento gerado em 30/06/2026. Atualizar conforme implementação progredir.*
