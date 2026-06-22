# PLANO DE IMPLANTAÇÃO - MÓDULO FINANCEIRO

**Click Marido CRM** | Versão 2.0 | 21/06/2026

---

## ⚠️ AVISO DE SEGURANÇA - DADOS SENSÍVEIS

**NUNCA committar credenciais em repositório público.**

Arquivos protegidos:
```
.env.local          ← CredenciaisMercado Pago
.env*.local         ← Qualquer ambiente local
```

Adicionar ao `.gitignore`:
```gitignore
# Credenciais sensíveis
.env.local
.env*.local

# Nunca committar:
# - Credenciais Mercado Pago
# - Tokens WhatsApp
# - Senhas de email
# - Certificados NF-e
```

---

## FASE 0: PREPARAÇÃO (Semana 0)

### 0.1 Infraestrutura
- [ ] Criar branch `feature/financeiro` a partir de `main`
- [ ] Configurar variáveis de ambiente (ver seção 0.3)
- [ ] Verificar compatibilidade do Prisma com banco atual
- [ ] Definir repositório para testes
- [ ] Criar arquivo `.env.local` com credenciais

### 0.2 Dependências
```bash
npm install @prisma/client zod date-fns dinero.js qrcode.react recharts
npm install -D prisma @types/node
```

### 0.3 Variáveis de Ambiente (LOCAL APENAS)

Criar arquivo `.env.local` na raiz do projeto:

```env
# ============================================
# MERCADO PAGO - CONFIGURAÇÃO LOCAL
# NUNCA COMMITAR ESTE ARQUIVO
# ============================================

# Credenciais Mercado Pago (Produção)
MERCADO_PAGO_PUBLIC_KEY=APP_USR-[sua-public-key-aqui]
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-[sua-access-token-aqui]
MERCADO_PAGO_CLIENT_ID=[seu-client-id]
MERCADO_PAGO_CLIENT_SECRET=[seu-client-secret]

# Webhook Mercado Pago
MERCADO_PAGO_WEBHOOK_URL=https://seudominio.com/api/payments/webhook-mp

# ============================================
# WHATSAPP BUSINESS (opcional - Fase 2)
# ============================================
WHATSAPP_API_URL=https://api.whatsapp.com/v1/...
WHATSAPP_TOKEN=[seu-token-whatsapp]
WHATSAPP_PHONE_ID=[seu-phone-id]

# ============================================
# EMAIL (opcional - Fase 2)
# ============================================
SENDGRID_API_KEY=[sua-sendgrid-key]
EMAIL_FROM=noreply@seudominio.com

# ============================================
# GERAIS
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=[sua-url-do-banco]
```

---

## FASE 1: SCHEMA & BANCO DE DADOS (Semana 1)

### 1.1 ATENÇÃO: MODELO PAYMENT EXISTENTE

O schema atual já possui um modelo `Payment` simplificado. **NÃO DESTRUIR DADOS EXISTENTES.**

**Estratégia de Migração:**
1. Criar nova tabela `invoices` (novo)
2. Criar tabela `expenses` (novo)
3. Criar tabela `vendors` (novo)
4. Criar tabela `financial_transactions` (novo)
5. Criar tabela `account_balances` (novo)
6. **ATUALIZAR** modelo `Payment` existente (adicionar campos)
7. NÃO renomear tabela - manter compatibilidade

### 1.2 Modelos Prisma (5 novos + 2 atualizados)

| Modelo | Tabela | Ação | Prioridade |
|--------|--------|------|------------|
| `Invoice` | invoices | CRIAR | Alta |
| `Payment` | payments | ATUALIZAR | Alta |
| `Expense` | expenses | CRIAR | Média |
| `Vendor` | vendors | CRIAR | Média |
| `FinancialTransaction` | financial_transactions | CRIAR | Alta |
| `AccountBalance` | account_balances | CRIAR | Alta |
| `Customer` (update) | customers | ATUALIZAR | Alta |
| `Quotation` (update) | quotations | ATUALIZAR | Alta |

### 1.3 ATUALIZAÇÃO DO MODELO PAYMENT (CRÍTICO)

Adicionar os seguintes campos ao modelo `Payment` existente:

```prisma
model Payment {
  // ... campos existentes (NÃO REMOVER) ...

  // ============================================
  // CAMPOS NOVOS - MERCADO PAGO
  // ============================================

  // Integração Mercado Pago
  mpPaymentId        String?   @unique   // ID pagamento no MP
  mpStatus           String?             // Status retornado MP
  mpPaymentMethodId  String?             // "pix", "bolbradesco", "visa", etc.
  mpExternalReference String?            // Referência externa

  // Dados PIX expandidos
  pixQrCode          String?   @db.Text  // QR Code PIX (base64)
  pixExpiration      DateTime?           // Expiração PIX

  // Dados Boleto
  boletoNumber       String?
  boletoBarcode      String?
  boletoUrl          String?   @db.Text  // Link boleto

  // Dados Cartão
  cardBrand          String?             // VISA, MASTERCARD, ELO
  cardLast4          String?             // Últimos 4 dígitos
  installments       Int?                // Número parcelas

  // Nota Fiscal
  nfeUrl             String?   @db.Text  // Link NF-e
  nfeNumber          String?             // Número NF-e

  // Controle
  confirmedAt        DateTime?           // Quando confirmado
  dueDateAt          DateTime?           // Data vencimento

  @@index([mpPaymentId])
  @@index([confirmedAt])
}
```

### 1.4 MODELO INVOICE (NOVO)

```prisma
model Invoice {
  id                String    @id @default(cuid())

  // Referência
  quotationId       String
  customerId        String

  // Dados da nota
  invoiceNumber     String    @unique
  seriesNumber      String?   @default("1")
  issueDate         DateTime  @default(now())
  dueDate           DateTime

  // Valores
  subtotal          Float     @default(0)
  taxAmount         Float     @default(0)
  totalAmount       Float     @default(0)
  discountAmount    Float?    @default(0)

  // Status
  status            String    @default("rascunho")
  nfeUrl            String?   @db.Text

  // Fiscal
  taxRegime         String    @default("SIMPLES")
  issRate           Float?

  // Metadados
  description       String?   @default("")
  notes             String?   @default("")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  quotation         Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  payments          Payment[]

  @@unique([invoiceNumber, seriesNumber])
  @@index([quotationId])
  @@index([customerId])
  @@index([status])
  @@index([dueDate])
  @@map("invoices")
}
```

### 1.5 MODELO EXPENSE (NOVO)

```prisma
model Expense {
  id                String    @id @default(cuid())

  // Categoria
  category          String    // MATERIAL, SERVICO, TRANSPORTE, ALUGUEL, UTILITIES, OUTROS

  // Dados
  description       String    @db.VarChar(255)
  amount            Float     @default(0)

  // Fornecedor (opcional)
  vendorId          String?
  vendorName        String?   @default("")

  // Datas
  expenseDate       DateTime  @default(now())
  dueDate           DateTime?
  paidAt            DateTime?

  // Status
  status            String    @default("pendente")

  // Documento
  documentType      String?   // NOTA_FISCAL, RECIBO, OUTRO
  documentNumber    String?

  // Vinculação com OS (CRÍTICO - integra com ServiceOrder)
  serviceOrderId    String?   // FK para ServiceOrder

  // Metadados
  notes             String?   @default("")
  attachmentUrl     String?   @db.Text
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  vendor            Vendor?   @relation(fields: [vendorId], references: [id], onDelete: SetNull)

  @@index([category])
  @@index([vendorId])
  @@index([status])
  @@index([expenseDate])
  @@index([dueDate])
  @@index([serviceOrderId])
  @@map("expenses")
}
```

### 1.6 MODELO VENDOR (NOVO)

```prisma
model Vendor {
  id                String    @id @default(cuid())

  // Dados
  name              String    @db.VarChar(255)
  email             String?   @db.VarChar(255)
  phone             String?   @db.VarChar(20)

  // Fiscal
  cnpjCpf           String?   @unique

  // Endereço
  address           String?   @default("")

  // Relacionamento
  expenses          Expense[]

  // Metadados
  isActive          Boolean   @default(true)
  notes             String?   @default("")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([cnpjCpf])
  @@index([isActive])
  @@map("vendors")
}
```

### 1.7 MODELO FINANCIALTRANSACTION (NOVO)

```prisma
model FinancialTransaction {
  id                String    @id @default(cuid())

  // Tipo
  type              String    // INVOICE_ISSUED, PAYMENT_RECEIVED, EXPENSE_RECORDED, ADJUSTMENT, TRANSFER

  // Referências
  invoiceId         String?
  paymentId         String?
  expenseId         String?

  // Valores
  debit             Float?    @default(0)
  credit            Float?    @default(0)
  balance           Float?    @default(0)

  // Descrição
  description       String    @db.VarChar(500)
  notes             String?   @default("")

  // Data
  transactionDate   DateTime  @default(now())

  // Auditoria
  userId            String?
  userEmail         String?

  createdAt         DateTime  @default(now())

  @@index([type])
  @@index([transactionDate])
  @@index([invoiceId])
  @@index([paymentId])
  @@index([expenseId])
  @@map("financial_transactions")
}
```

### 1.8 MODELO ACCOUNTBALANCE (NOVO)

```prisma
model AccountBalance {
  id                String    @id @default(cuid())

  // Data do saldo
  balanceDate       DateTime

  // Saldos
  opening           Float     @default(0)
  inflow            Float     @default(0)
  outflow           Float     @default(0)
  closing           Float     @default(0)

  // Previsão
  forecast30        Float?    @default(0)
  forecast60        Float?    @default(0)
  forecast90        Float?    @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([balanceDate])
  @@index([balanceDate])
  @@map("account_balances")
}
```

### 1.9 ATUALIZAÇÕES EM MODELOS EXISTENTES

#### Customer (adicionar campos)
```prisma
model Customer {
  // ... campos existentes ...

  // Financeiro (NOVOS)
  invoices          Invoice[]
  creditLimit       Float?    @default(0)
  taxDocNumber      String?   // CPF/CNPJ
}
```

#### Quotation (adicionar campos)
```prisma
model Quotation {
  // ... campos existentes ...

  // Financeiro (NOVOS)
  invoice           Invoice?
  paymentTerms      String?   @default("A_VISTA")  // A_VISTA, 30_DIAS, 60_DIAS
}
```

### 1.10 Migrações
```bash
npx prisma migrate dev --name add_financial_module_v2
npx prisma generate
```

### 1.11 Seed Data
- Criar categorias de despesas padrão
- Configurar regime fiscal (SIMPLES)
- Criar fornecedores de exemplo (para testes)

---

## FASE 2: API - INVOICES (Semana 1-2)

### 2.1 Endpoints

| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/api/invoices` | Listar com filtros | Pendente |
| POST | `/api/invoices` | Criar a partir de quotation | Pendente |
| PUT | `/api/invoices/[id]` | Editar | Pendente |
| DELETE | `/api/invoices/[id]` | Cancelar | Pendente |
| POST | `/api/invoices/[id]/emit` | Emitir NF-e | Pendente |
| GET | `/api/invoices/[id]/pdf` | Download PDF | Pendente |

### 2.2 Lógica de Negócio
- Numeração sequencial automática
- Cálculo de impostos (ISS 5% padrão)
- Validação: quotationId obrigatório
- Status flow: `rascunho` → `emitida` → `paga` / `cancelada`

---

## FASE 3: API - PAYMENTS + MERCADO PAGO (Semana 2-4)

### 3.1 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/payments` | Listar pagamentos |
| POST | `/api/payments/[invoiceId]/create-pix` | Gerar PIX via Mercado Pago |
| POST | `/api/payments/[invoiceId]/create-boleto` | Gerar boleto via Mercado Pago |
| POST | `/api/payments/[invoiceId]/create-card` | Gerar pagamento cartão via MP |
| POST | `/api/payments/webhook-mp` | Webhook Mercado Pago |
| POST | `/api/payments/manual` | Pagamento manual (dinheiro) |
| GET | `/api/payments/[id]/receipt` | Download comprovante |

### 3.2 Integração Mercado Pago

#### 3.2.1 Configuração do Client

```typescript
// lib/mercadopago.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';

// ATENÇÃO: Credenciais devem vir de .env.local (NUNCA hardcoded)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export const paymentClient = new Payment(client);
```

#### 3.2.2 Criar Pagamento PIX

```typescript
// POST /api/payments/[invoiceId]/create-pix
export async function createPixPayment(invoiceId: string, expiresIn: number = 3600) {
  const payment = await paymentClient.create({
    body: {
      transaction_amount: totalAmount,
      description: `Invoice #${invoiceNumber}`,
      payment_method_id: 'pix',
      date_of_expiration: new Date(Date.now() + expiresIn * 1000).toISOString(),
      external_reference: invoiceId,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
    }
  });

  // Retornar QR code e chave PIX
  return {
    qrCode: payment.point_of_interaction.transaction_data.qr_code_base64,
    pixKey: payment.point_of_interaction.transaction_data.ticket_url,
    expiresAt: payment.date_of_expiration,
    mpPaymentId: payment.id,
  };
}
```

#### 3.2.3 Criar Boleto

```typescript
// POST /api/payments/[invoiceId]/create-boleto
export async function createBoletoPayment(invoiceId: string) {
  const payment = await paymentClient.create({
    body: {
      transaction_amount: totalAmount,
      description: `Invoice #${invoiceNumber}`,
      payment_method_id: 'bolbradesco',
      date_of_expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      external_reference: invoiceId,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
    }
  });

  return {
    boletoUrl: payment.transaction_details?.external_resource_url,
    barcode: payment.barcode?.content,
    expiresAt: payment.date_of_expiration,
    mpPaymentId: payment.id,
  };
}
```

#### 3.2.4 Criar Pagamento Cartão

```typescript
// POST /api/payments/[invoiceId]/create-card
export async function createCardPayment(
  invoiceId: string,
  token: string,
  installments: number = 1
) {
  const payment = await paymentClient.create({
    body: {
      transaction_amount: totalAmount,
      description: `Invoice #${invoiceNumber}`,
      payment_method_id: 'visa', // ou master, elo, etc
      token: token,
      installments: installments,
      external_reference: invoiceId,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
    }
  });

  return {
    status: payment.status,
    statusDetail: payment.status_detail,
    mpPaymentId: payment.id,
  };
}
```

### 3.3 Fluxo Webhook Mercado Pago

```
Mercado Pago → POST /api/payments/webhook-mp
  │
  ├─ 1. Validar assinatura (se configurada)
  │
  ├─ 2. Verificar tipo de notificação
  │     └─ payment.created / payment.updated
  │
  ├─ 3. Buscar pagamento via MP API
  │     └─ paymentClient.get({ id: mpPaymentId })
  │
  ├─ 4. Atualizar payment.status no DB
  │     ├─ "approved" → confirmado
  │     ├─ "pending" → pendente
  │     ├─ "rejected" → cancelado
  │     └─ "refunded" → devolvido
  │
  ├─ 5. Atualizar invoice.status se payment confirmado
  │     └─ Se todas pagas → invoice.status = "paga"
  │
  ├─ 6. Criar FinancialTransaction
  │     ├─ type: PAYMENT_RECEIVED
  │     ├─ credit: valor
  │     └─ balance: saldo calculado
  │
  └─ 7. Enviar notificação (WhatsApp/Email)
```

### 3.4 Validação Webhook

```typescript
// app/api/payments/webhook-mp/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Mercado Pago envia type + data.id
  if (body.type === 'payment') {
    const paymentId = body.data.id;

    // Buscar pagamento no MP
    const mpPayment = await paymentClient.get({ id: paymentId });

    // Atualizar no banco
    await updatePaymentFromMercadoPago(mpPayment);
  }

  return NextResponse.json({ received: true });
}
```

---

## FASE 4: API - EXPENSES & VENDORS (Semana 3)

### 4.1 Expenses Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/expenses` | Listar despesas |
| POST | `/api/expenses` | Criar despesa |
| PUT | `/api/expenses/[id]` | Editar |
| POST | `/api/expenses/[id]/mark-paid` | Marcar paga |
| GET | `/api/expenses/by-service-order/[soId]` | Despesas por OS |

### 4.2 Vendors Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/vendors` | Listar fornecedores |
| POST | `/api/vendors` | Criar fornecedor |
| PUT | `/api/vendors/[id]` | Editar |

### 4.3 Categorias de Despesas
```
MATERIAL | SERVICO | TRANSPORTE | ALUGUEL | UTILITIES | OUTROS
```

### 4.4 INTEGRAÇÃO COM SERVICEORDER

A rota `/api/expenses/by-service-order/[soId]` permite:
- Listar todas as despesas vinculadas a uma OS
- Calcular custo total da OS
- Calcular margem de lucro por serviço

---

## FASE 5: API - DASHBOARD & RELATÓRIOS (Semana 3-4)

### 5.1 Endpoints Analytics

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/financial/dashboard` | Dashboard consolidado |
| GET | `/api/financial/cash-flow` | Fluxo de caixa projetado |
| GET | `/api/financial/dre` | DRE simplificado |
| GET | `/api/financial/receivables` | Contas a cobrar |
| GET | `/api/financial/payables` | Contas a pagar |
| GET | `/api/financial/service-margin` | Margem por serviço |
| GET | `/api/financial/evolution` | Evolução mensal |

### 5.2 Lógica de Cálculo
- Saldo = SUM(entradas) - SUM(saídas)
- Previsão 30/60/90 dias baseada em dueDate
- DRE: Receitas - Impostos - Despesas = Lucro

---

## FASE 6: INTEGRAÇÕES EXTERNAS (Semana 4-5)

### 6.1 Mercado Pago (PIX + Boleto + Cartão)
```
[ ] Configurar credenciais em .env.local
[ ] Implementar geração PIX
[ ] Implementar geração Boleto
[ ] Implementar pagamento Cartão (tokenization)
[ ] Webhook handler com validação
[ ] Testar em sandbox MP
```

### 6.2 WhatsApp (Fase 2)
```
[ ] Configurar API WhatsApp Business
[ ] Template: Pagamento gerado (QR code)
[ ] Template: Pagamento confirmado
[ ] Template: Lembrete de vencimento
```

### 6.3 Email (Fase 2)
```
[ ] Configurar SendGrid/SES
[ ] Template: Invoice emitida + PDF
[ ] Template: Comprovante pagamento
[ ] Template: Relatório diário
```

### 6.4 Google Sheets (Fase 3+)
```
[ ] Configurar Google API
[ ] Sync diário de transações
[ ] Export DRE/Fluxo de caixa
```

---

## FASE 7: FRONTEND - COMPONENTES (Semana 5-6)

### 7.1 Páginas

| Rota | Componente | Prioridade |
|------|------------|------------|
| `/financial` | Dashboard | Alta |
| `/invoices` | Lista + CRUD | Alta |
| `/payments` | Lista + Ações | Alta |
| `/expenses` | Lista + CRUD | Média |
| `/reports` | Relatórios | Média |

### 7.2 Componentes Reutilizáveis
```
[ ] FinancialCard (saldo, entradas, saídas)
[ ] InvoiceTable (tabela com ações)
[ ] PaymentActions (PIX, Boleto, Cartão, Manual)
[ ] ExpenseForm (formulário categorizado)
[ ] ReportCard (DRE, Fluxo, etc.)
[ ] StatusBadge (pago, pendente, vencido)
[ ] PixModal (QR Code + chave copiável)
[ ] BoletoModal (download boleto)
[ ] CardPaymentForm (tokenização MP)
```

### 7.3 Integração com Módulos Existentes
- **Quotation:** Adicionar botão "Gerar Invoice"
- **Customer:** Exibir saldo e histórico financeiro
- **ServiceOrder:** Vincular despesas ao serviço + custo total

---

## FASE 8: TESTES (Semana 6-7)

### 8.1 Testes Unitários (100+)
```
[ ] Cálculo de impostos
[ ] Numeração de invoices
[ ] Validação de status
[ ] Webhook Mercado Pago validation
[ ] Formatação de valores
[ ] Cálculos com dinero.js
```

### 8.2 Testes de Integração
```
[ ] Fluxo completo: Quotation → Invoice → Payment
[ ] Webhook MP → Atualização DB
[ ] Dashboard consistency
[ ] Relatórios com dados reais
[ ] Integração com ServiceOrder
```

### 8.3 Testes E2E (Playwright)
```
[ ] Criar invoice a partir de quotation
[ ] Gerar PIX e confirmar pagamento
[ ] Gerar boleto
[ ] Registrar despesa manual
[ ] Gerar relatório DRE
[ ] Verificar margem por serviço
```

---

## FASE 9: SEGURANÇA & COMPLIANCE (Contínuo)

### 9.1 LGPD
```
[ ] HTTPS obrigatório
[ ] Logs de acesso financeiro
[ ] Soft delete (não remover dados)
[ ] Criptografia em trânsito
```

### 9.2 PCI Compliance
```
[ ] NUNCA armazenar dados de cartão completos
[ ] Usar tokenização Mercado Pago
[ ] Apenas últimos 4 dígitos armazenados
[ ] Validação de inputs
```

### 9.3 Mercado Pago Security
```
[ ] Credenciais apenas em .env.local
[ ] Validar webhook MP
[ ] Rate limiting
[ ] Timeout em requisições (30s)
[ ] Log de transações para auditoria
```

### 9.4 Git Security
```
[ ] .gitignore protege .env.local
[ ] Nunca committar credenciais
[ ] Usar variáveis de ambiente em produção
[ ] Revisar PRs antes de merge
```

---

## FASE 10: DEPLOY (Semana 7-8)

### 10.1 Go-Live Checklist

#### 48h Antes
- [ ] Staging deployment completo
- [ ] Smoke tests executados
- [ ] Backups do banco feitos
- [ ] Suporte preparado
- [ ] Credenciais MP produção configuradas

#### 24h Antes
- [ ] Mercado Pago production keys configuradas
- [ ] Webhook URL atualizado no MP
- [ ] WhatsApp business account ativo
- [ ] Email delivery testado
- [ ] Monitoring setup completo

#### Dia do Deploy
- [ ] Database migration executada
- [ ] Health checks passando
- [ ] Primeira transação teste via MP
- [ ] Alerta de erro configurado

#### Pós-Deploy
- [ ] Primeira invoice gerada
- [ ] Primeiro PIX cobrado
- [ ] Webhooks recebidos OK
- [ ] Logs monitorados 24h
- [ ] Backup automático funcionando

### 10.2 Produção
```
[ ] Migração de banco
[ ] Deploy gradual (feature flag)
[ ] Monitoramento (logs + métricas)
[ ] Rollback plan
```

### 10.3 Monitoramento
```
[ ] Alertas de erro (Sentry/Datadog)
[ ] Métricas de performance
[ ] Dashboard de uso
[ ] Alertas de saldo baixo
```

---

## CRONOGRAMA RESUMIDO

| Fase | Semana | Entregável |
|------|--------|------------|
| 0 | 0 | Preparação + .env.local |
| 1 | 1 | Schema Prisma + Migrações |
| 2 | 1-2 | API Invoices |
| 3 | 2-4 | API Payments + Mercado Pago |
| 4 | 3 | API Expenses & Vendors |
| 5 | 3-4 | API Dashboard & Relatórios |
| 6 | 4-5 | Integrações externas |
| 7 | 5-6 | Frontend |
| 8 | 6-7 | Testes |
| 9 | Contínuo | Segurança |
| 10 | 7-8 | Deploy + Go-Live |

---

## KPIs DE ACOMPANHAMENTO

| Métrica | Meta | Alerta |
|---------|------|--------|
| Saldo de Caixa | > R$ 5.000 | < R$ 1.000 |
| Taxa de Recebimento | > 95% | < 80% |
| Dias para Receber | < 10 dias | > 30 dias |
| Margem de Lucro | > 40% | < 25% |
| Contas Vencidas | R$ 0 | > R$ 500 |

### Métricas de Performance

| Métrica | Target |
|---------|--------|
| Invoice emitida em | < 10s |
| PIX gerado em | < 2s (Mercado Pago) |
| Payment confirmado em | < 30s (webhook) |
| Dashboard carrega em | < 1s |
| API response time (p95) | < 500ms |
| Uptime | > 99.9% |
| Test coverage | > 80% |

---

## RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Mercado Pago instável | Alto | Fallback manual + retry |
| Webhook falha | Alto | Queue + reprocessamento |
| NF-e rejeitada | Médio | Validação antes de emitir |
| Dados inconsistentes | Alto | Transactions ACID |
| Performance relatórios | Médio | Cache + índices |
| Perda dados migração | Crítico | Backup antes de migrar |

---

## FASES DE DESENVOLVIMENTO (MVP vs Full)

### MVP (Sprint 1-2, 2-3 semanas)
- ✅ Invoices básicas (sem NF-e)
- ✅ Pagamentos manual
- ✅ Dashboard com saldo
- ✅ Contas a cobrar/pagar
- ✅ Relatório DRE simples

### Fase 2 (Sprint 3-4, 3-4 semanas)
- ✅ Integração Mercado Pago (PIX + Boleto)
- ✅ NF-e automática
- ✅ WhatsApp notifications
- ✅ Webhook Mercado Pago
- ✅ Email comprovantes

### Fase 3+ (Sprint 5+)
- ✅ Integração Google Sheets
- ✅ Margem por serviço (com ServiceOrder)
- ✅ Previsão de fluxo (ML)
- ✅ Integração contabilidade
- ✅ DM (Data Warehouse)

---

## ROADMAP PÓS-MVP (Meses 3-6)

### Mês 3: ML + Analytics
- [ ] Previsão de fluxo com ML
- [ ] Recomendação de preços
- [ ] Análise de sazonalidade

### Mês 4: Integrações
- [ ] Google Sheets sync
- [ ] Contabilidade (ContaAzul/Bluesoft)
- [ ] ERP integration

### Mês 5: Compliance
- [ ] Auto-remessa de DRE para contador
- [ ] Livro fiscal
- [ ] Auditoria trail completo

### Mês 6: Automação
- [ ] Cobrança automática (after 7 days)
- [ ] Reconciliação automática
- [ ] Faturamento recorrente

---

## TREINAMENTO & DOCUMENTAÇÃO

### Para Dev
- [ ] Guia de setup local (incluindo .env.local)
- [ ] Swagger/OpenAPI docs
- [ ] Architecture decision records
- [ ] Code examples

### Para Usuário
- [ ] Video tutorials (5-10 min each)
- [ ] FAQ document
- [ ] Quick start guide
- [ ] Support email/chat

### Para Admin
- [ ] Monitoring dashboard setup
- [ ] Alert configuration
- [ ] Backup procedures
- [ ] Disaster recovery plan

---

## ESTRUTURA DE ARQUIVOS FINAL

```
frontend/
├── lib/
│   ├── mercadopago.ts              ← Client Mercado Pago
│   ├── financial.ts                ← Cálculos financeiros
│   ├── nfe.ts                      ← Utilitários NF-e
│   ├── whatsapp.ts                 ← Client WhatsApp
│   └── email.ts                    ← Client Email
│
├── app/api/
│   ├── invoices/                   ← CRUD Invoices
│   ├── payments/                   ← ATUALIZAR + novas rotas MP
│   │   ├── route.ts
│   │   ├── [invoiceId]/create-pix/route.ts
│   │   ├── [invoiceId]/create-boleto/route.ts
│   │   ├── [invoiceId]/create-card/route.ts
│   │   ├── manual/route.ts
│   │   ├── webhook-mp/route.ts
│   │   └── [id]/receipt/route.ts
│   ├── expenses/                   ← CRUD Despesas
│   ├── vendors/                    ← CRUD Fornecedores
│   └── financial/                  ← Analytics
│
├── components/financial/           ← UI Financeiro
│   ├── FinancialCard.tsx
│   ├── InvoiceTable.tsx
│   ├── PaymentMethodBadge.tsx
│   ├── InvoiceForm.tsx
│   ├── ExpenseForm.tsx
│   ├── PaymentModal.tsx
│   ├── PixModal.tsx
│   ├── BoletoModal.tsx
│   ├── CardPaymentForm.tsx
│   ├── DREReport.tsx
│   └── CashFlowChart.tsx
│
├── hooks/                          ← Custom Hooks
│   ├── useInvoices.ts
│   ├── usePayments.ts
│   ├── useExpenses.ts
│   ├── useFinancialDashboard.ts
│   ├── useCurrencyFormat.ts
│   └── useMercadoPago.ts
│
├── app/(dashboard)/
│   ├── financial/page.tsx
│   ├── invoices/page.tsx
│   ├── payments/page.tsx
│   ├── expenses/page.tsx
│   └── reports/page.tsx
│
├── tests/                          ← Testes
│   ├── api/*.test.ts
│   ├── components/*.test.tsx
│   └── integration/*.test.ts
│
└── __tests__/
    ├── e2e/financial.spec.ts
    └── mocks/mercadopago.ts
```

---

## DEPENDÊNCIAS

```json
{
  "dependencies": {
    "mercadopago": "^2.0.0",
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0",
    "dinero.js": "^2.0.0",
    "qrcode.react": "^3.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^0.34.0",
    "playwright": "^1.38.0"
  }
}
```

---

**Tempo Estimado Total:** 6-8 semanas (MVP)  
**Equipe:** 1-2 devs  
**Prioridade MVP:** Invoices + Pagamentos manuais + Dashboard básico

---

**Status:** 🟢 Pronto para Build  
**Versão:** 2.0  
**Atualizado:** 21/06/2026  
**Mudança Principal:** Asaas → Mercado Pago
