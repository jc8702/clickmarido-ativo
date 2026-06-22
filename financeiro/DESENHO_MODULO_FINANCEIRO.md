# 💰 Módulo Financeiro - Desenho Arquitetural Completo

**Click Marido CRM - Subsistema Financeiro**  
**Status:** 🔵 Design Phase (Pronto para Build)  
**Versão:** 1.0.0  
**Data:** 21/06/2026  

---

## 📊 Visão Geral Executiva

Sistema financeiro integrado que gerencia **fluxo de caixa, faturamento, pagamentos e relatórios** para uma micro-empresa de serviços residenciais.

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                  MÓDULO FINANCEIRO                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Faturamento (Invoices/RPA)                      │  │
│  │  - Geração automática de NF-e/RPA                │  │
│  │  - Integração Asaas                              │  │
│  │  - Cálculo de impostos                           │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pagamentos (Receitas)                           │  │
│  │  - PIX em tempo real                             │  │
│  │  - Cartão de crédito                             │  │
│  │  - Boleto                                        │  │
│  │  - Dinheiro (manual)                             │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Contas a Pagar (Despesas)                       │  │
│  │  - Fornecedores                                  │  │
│  │  - Despesas operacionais                         │  │
│  │  - Dívidas                                       │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Fluxo de Caixa (Dashboard)                      │  │
│  │  - Saldo atual                                   │  │
│  │  - Previsão 30/60/90 dias                        │  │
│  │  - Gráficos de tendência                         │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Relatórios (Analytics)                          │  │
│  │  - DRE (Demonstração de Resultado)               │  │
│  │  - Fluxo de Caixa                                │  │
│  │  - Contas por Cobrar                             │  │
│  │  - Contas a Pagar                                │  │
│  │  - Margem por Serviço                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema de Dados (Prisma)

### Novos Modelos

#### 1. **Invoice** (NF-e / RPA)
```prisma
model Invoice {
  id                String    @id @default(cuid())
  
  // Referência
  quotationId       String    // FK para Quotation
  customerId        String    // FK para Customer
  
  // Dados da nota
  invoiceNumber     String    @unique  // Número sequencial
  seriesNumber      String?   @default("1")
  issueDate         DateTime  @default(now())
  dueDate           DateTime  
  
  // Valores
  subtotal          Float     @default(0)  // Sem impostos
  taxAmount         Float     @default(0)  // ISS/ICMS
  totalAmount       Float     @default(0)  // Com impostos
  discountAmount    Float?    @default(0)
  
  // Status
  status            String    @default("rascunho")  // rascunho, emitida, cancelada
  nfeUrl            String?   // Link NF-e (se emitida)
  rpaSeries         String?   // Série da RPA (if applicable)
  
  // Fiscal
  taxRegime         String    @default("SIMPLES")  // SIMPLES, LUCRO_REAL, MEI
  issRate           Float?    // Taxa ISS (%)
  
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

#### 2. **Payment** (Recebimentos)
```prisma
model Payment {
  id                String    @id @default(cuid())
  
  // Referência
  invoiceId         String?   // FK para Invoice (opcional - manual payment)
  customerId        String    // FK para Customer
  
  // Dados do pagamento
  amount            Float     @default(0)
  paidAmount        Float?    // Pode ser diferente se desconto/juros
  
  // Método de pagamento
  paymentMethod     String    // "PIX", "CARD", "BOLETO", "CASH", "TRANSFER"
  
  // Status
  status            String    @default("pendente")  // pendente, confirmado, cancelado, devolvido
  
  // Datas
  dueDateAt         DateTime?
  paidAt            DateTime?
  
  // Dados PIX
  pixKey            String?   // Chave PIX usada
  pixQrCode         String?   // QR Code PIX (base64)
  pixExpiration     DateTime?
  
  // Dados Boleto
  boletoNumber      String?
  boletoBarcode     String?
  
  // Dados Cartão
  cardBrand         String?   // VISA, MASTERCARD, ELO
  cardLast4         String?   // Últimos 4 dígitos
  installments      Int?      // Número de parcelas
  
  // Integração Asaas
  asaasPaymentId    String?   @unique  // ID do pagamento no Asaas
  asaasStatus       String?   // Status retornado pelo Asaas
  
  // Metadados
  description       String?   @default("")
  notes             String?   @default("")
  receiptUrl        String?   // Link comprovante
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  invoice           Invoice?  @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@index([invoiceId])
  @@index([customerId])
  @@index([status])
  @@index([paidAt])
  @@index([asaasPaymentId])
  @@map("payments")
}
```

#### 3. **Expense** (Despesas)
```prisma
model Expense {
  id                String    @id @default(cuid())
  
  // Categoria
  category          String    // "MATERIAL", "SERVICO", "TRANSPORTE", "ALUGUEL", "UTILITIES", "OUTROS"
  
  // Dados
  description       String    @db.VarChar(255)
  amount            Float     @default(0)
  
  // Fornecedor (opcional)
  vendorId          String?   // FK para Vendor
  vendorName        String?   @default("")  // Se não houver vendor
  
  // Datas
  expenseDate       DateTime  @default(now())  // Quando ocorreu a despesa
  dueDate           DateTime?  // Quando vence o pagamento
  paidAt            DateTime?  // Quando foi pago
  
  // Status
  status            String    @default("pendente")  // pendente, paga, cancelada
  
  // Documento
  documentType      String?   // "NOTA_FISCAL", "RECIBO", "OUTRO"
  documentNumber    String?
  
  // Projeto/OS (opcional)
  serviceOrderId    String?   // FK para ServiceOrder (se for despesa de serviço)
  
  // Metadados
  notes             String?   @default("")
  attachmentUrl     String?   // Link documento
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  vendor            Vendor?   @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  
  @@index([category])
  @@index([vendorId])
  @@index([status])
  @@index([expenseDate])
  @@index([dueDate])
  @@map("expenses")
}
```

#### 4. **Vendor** (Fornecedores)
```prisma
model Vendor {
  id                String    @id @default(cuid())
  
  // Dados
  name              String    @db.VarChar(255)
  email             String?   @db.VarChar(255)
  phone             String?   @db.VarChar(20)
  
  // Fiscal
  cnpjCpf           String?   @unique  // CNPJ ou CPF
  
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

#### 5. **FinancialTransaction** (Auditoria)
```prisma
model FinancialTransaction {
  id                String    @id @default(cuid())
  
  // Tipo
  type              String    // "INVOICE_ISSUED", "PAYMENT_RECEIVED", "EXPENSE_RECORDED", "ADJUSTMENT", "TRANSFER"
  
  // Referências
  invoiceId         String?
  paymentId         String?
  expenseId         String?
  
  // Valores
  debit             Float?    @default(0)   // Saída de caixa
  credit            Float?    @default(0)  // Entrada de caixa
  balance           Float?    @default(0)  // Saldo após transação
  
  // Descrição
  description       String    @db.VarChar(500)
  notes             String?   @default("")
  
  // Data
  transactionDate   DateTime  @default(now())
  
  // Auditoria
  userId            String?   // Quem criou
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

#### 6. **AccountBalance** (Saldo Consolidado)
```prisma
model AccountBalance {
  id                String    @id @default(cuid())
  
  // Data do saldo
  balanceDate       DateTime
  
  // Saldos
  opening           Float     @default(0)    // Saldo inicial
  inflow            Float     @default(0)    // Entradas
  outflow           Float     @default(0)    // Saídas
  closing           Float     @default(0)    // Saldo final
  
  // Previsão
  forecast30        Float?    @default(0)    // Saldo em 30 dias
  forecast60        Float?    @default(0)    // Saldo em 60 dias
  forecast90        Float?    @default(0)    // Saldo em 90 dias
  
  // Metadados
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([balanceDate])
  @@index([balanceDate])
  @@map("account_balances")
}
```

### Atualizações em Modelos Existentes

#### **Customer** (Novo campo)
```prisma
model Customer {
  // ... campos existentes ...
  
  // Financeiro
  invoices          Invoice[]
  payments          Payment[]
  creditLimit       Float?    @default(0)   // Limite de crédito
  taxDocNumber      String?   // CPF/CNPJ
  
  @@map("customers")
}
```

#### **Quotation** (Novo campo)
```prisma
model Quotation {
  // ... campos existentes ...
  
  // Financeiro
  invoice           Invoice?
  paymentTerms      String?   @default("A_VISTA")  // A_VISTA, 30_DIAS, 60_DIAS
  
  @@map("quotations")
}
```

---

## 🔌 APIs Implementadas

### 1. **Invoices** (Faturamento)

#### GET `/api/invoices`
- Listar invoices com filtros (status, data, cliente)
- Paginação
- **Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "invoiceNumber": "001",
      "customerId": "cuid",
      "totalAmount": 1500.00,
      "status": "emitida",
      "dueDate": "2026-07-21",
      "customer": { "name": "João Silva" }
    }
  ],
  "meta": { "page": 1, "total": 50 }
}
```

#### POST `/api/invoices`
- Criar nova invoice a partir de quotation
- Cálculo automático de impostos
- **Body:**
```json
{
  "quotationId": "cuid",
  "dueDate": "2026-07-21",
  "taxRegime": "SIMPLES",
  "issRate": 5.0
}
```

#### PUT `/api/invoices/[id]`
- Editar invoice (antes de emitir)

#### DELETE `/api/invoices/[id]`
- Deletar/cancelar invoice

#### POST `/api/invoices/[id]/emit`
- Emitir NF-e via Asaas
- Gera arquivo XML + PDF

#### GET `/api/invoices/[id]/pdf`
- Download do PDF da invoice

---

### 2. **Payments** (Recebimentos)

#### GET `/api/payments`
- Listar pagamentos com filtros
- **Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "invoiceId": "cuid",
      "amount": 1500.00,
      "paidAmount": 1500.00,
      "status": "confirmado",
      "paymentMethod": "PIX",
      "paidAt": "2026-06-21T10:30:00Z",
      "customer": { "name": "João Silva" }
    }
  ]
}
```

#### POST `/api/payments/[invoiceId]/create-pix`
- Gerar QR code PIX para cobrar
- **Body:**
```json
{
  "expiresIn": 3600  // segundos
}
```
- **Response:**
```json
{
  "qrCode": "data:image/png;base64,...",
  "pixKey": "12345678-1234-...",
  "expiresAt": "2026-06-21T11:30:00Z"
}
```

#### POST `/api/payments/[invoiceId]/create-boleto`
- Gerar boleto via Asaas
- **Response:** URL do boleto

#### POST `/api/payments/webhook-asaas`
- Webhook Asaas para confirmar pagamentos
- Updates status em tempo real

#### POST `/api/payments/manual`
- Registrar pagamento manual (dinheiro)
- **Body:**
```json
{
  "invoiceId": "cuid",
  "amount": 1500.00,
  "paymentMethod": "CASH",
  "paidAt": "2026-06-21T10:30:00Z"
}
```

#### GET `/api/payments/[id]/receipt`
- Download comprovante/recibo

---

### 3. **Expenses** (Despesas)

#### GET `/api/expenses`
- Listar despesas com filtros (categoria, data, status)

#### POST `/api/expenses`
- Criar nova despesa
- **Body:**
```json
{
  "category": "MATERIAL",
  "description": "Tubo PVC 50mm",
  "amount": 150.00,
  "vendorId": "cuid",
  "expenseDate": "2026-06-21",
  "dueDate": "2026-07-21"
}
```

#### PUT `/api/expenses/[id]`
- Editar despesa

#### POST `/api/expenses/[id]/mark-paid`
- Marcar despesa como paga
- **Body:**
```json
{
  "paidAt": "2026-06-21T10:30:00Z"
}
```

---

### 4. **Vendors** (Fornecedores)

#### GET `/api/vendors`
- Listar fornecedores

#### POST `/api/vendors`
- Criar novo fornecedor

#### PUT `/api/vendors/[id]`
- Editar fornecedor

---

### 5. **Financial Dashboard** (Analytics)

#### GET `/api/financial/dashboard`
- Saldo atual
- Fluxo de caixa (entradas/saídas hoje)
- Contas a cobrar
- Contas a pagar
- **Response:**
```json
{
  "balance": {
    "current": 15500.00,
    "forecast30": 18200.00,
    "forecast60": 20100.00,
    "forecast90": 22500.00
  },
  "today": {
    "inflow": 2100.00,
    "outflow": 350.00
  },
  "receivable": {
    "overdue": 1200.00,
    "pending": 5600.00,
    "total": 6800.00
  },
  "payable": {
    "overdue": 0,
    "pending": 800.00,
    "total": 800.00
  }
}
```

#### GET `/api/financial/cash-flow`
- Previsão de fluxo de caixa (30/60/90 dias)
- Gráfico em forma de timeline

#### GET `/api/financial/dre`
- Demonstração de Resultado do Exercício
- Receitas - Despesas = Lucro

#### GET `/api/financial/receivables`
- Relatório de contas a cobrar
- Vencidas, a vencer, recebidas

#### GET `/api/financial/payables`
- Relatório de contas a pagar

#### GET `/api/financial/service-margin`
- Margem de lucro por serviço
- Custo vs Receita

---

## 🔗 Integrações Externas

### 1. **Asaas** (Pagamentos + NF-e)

#### Funcionalidades

**Emissão de NF-e:**
```
POST /api/invoices/[id]/emit
  ↓
→ Valida dados (CNPJ/CPF, endereço, etc)
→ Chama Asaas API: POST /invoices
→ Retorna XML + PDF
→ Armazena nfeUrl no DB
→ Webhook retorna status
```

**Recebimento PIX:**
```
POST /api/payments/[invoiceId]/create-pix
  ↓
→ Chama Asaas API: POST /pix
→ Retorna QR Code + chave
→ Exibe para cliente
→ Webhook Asaas: payment.confirmed
→ Updates DB automaticamente
```

**Recebimento Boleto:**
```
POST /api/payments/[invoiceId]/create-boleto
  ↓
→ Chama Asaas API: POST /boleto
→ Retorna link para download
→ Cliente imprime/paga
→ Webhook Asaas: payment.confirmed
→ Updates DB
```

#### Environment Variables
```env
ASAAS_API_KEY=xxx
ASAAS_WEBHOOK_SECRET=yyy
ASAAS_WEBHOOK_URL=https://clickmarido.com/api/payments/webhook-asaas
```

#### Fluxo de Webhook
```
Asaas → POST /api/payments/webhook-asaas
  ├─ Valida assinatura (HMAC-SHA256)
  ├─ Identifica tipo: payment.confirmed, payment.received, etc
  ├─ Atualiza payment.status no DB
  ├─ Atualiza quotation.status
  └─ Gera transação em FinancialTransaction
```

### 2. **WhatsApp** (Notificações)

#### Casos de Uso

**Quando novo pagamento é gerado:**
```
Usuário cria PIX
  ↓
WhatsApp para cliente:
"Olá João! Seu orçamento de R$ 1.500,00 está pronto.
Clique no link para ver o QR code PIX ↓
[link] ou Envie comprovante para confirmar"
```

**Quando pagamento é confirmado:**
```
Webhook Asaas
  ↓
WhatsApp para usuário:
"✅ Pagamento de R$ 1.500,00 recebido de João Silva"
```

#### Environment Variables
```env
WHATSAPP_API_URL=https://api.whatsapp.com/v1/...
WHATSAPP_TOKEN=xxx
WHATSAPP_PHONE_ID=yyy
```

### 3. **Email** (Notificações + Documentos)

#### Casos de Uso

**Invoice emitida:**
- Enviar PDF para cliente + link para pagamento

**Pagamento confirmado:**
- Enviar recibo/comprovante

**Relatório diário:**
- Saldo do dia, entradas, saídas

#### Provider
- SendGrid ou AWS SES

### 4. **Google Sheets** (Backup + Sync)

#### Fluxo
```
Daily Job (00:00):
  ├─ Exporta transações do dia
  ├─ Cria/atualiza planilha Google
  ├─ Calcula saldos
  └─ Compartilha com usuário
```

Usuário pode:
- Ver dados em tempo real na planilha
- Modificar se necessário
- Sistema lê e sincroniza

---

## 📱 Frontend - Páginas

### 1. **/financial** (Dashboard Principal)

```
┌─────────────────────────────────────────────────┐
│ FINANCEIRO                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Saldo Atual: R$ 15.500,00                     │
│  ┌─────────────────────────────────────────┐   │
│  │ Previsão: 30d→18.2k | 60d→20.1k | 90d→22.5k│
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────┬──────────────────┐       │
│  │ Entradas Hoje    │ Saídas Hoje      │       │
│  │ R$ 2.100,00      │ R$ 350,00        │       │
│  └──────────────────┴──────────────────┘       │
│                                                 │
│  ┌──────────────────┬──────────────────┐       │
│  │ A Cobrar         │ A Pagar          │       │
│  │ R$ 6.800,00      │ R$ 800,00        │       │
│  │ (1.2k vencida)   │                  │       │
│  └──────────────────┴──────────────────┘       │
│                                                 │
│  Gráfico Fluxo de Caixa (30 dias)              │
│  [Gráfico linear mostrando tendência]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. **/invoices** (Faturamento)

```
┌─────────────────────────────────────────────────┐
│ INVOICES                                        │
│ [+ Nova Invoice]                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Tabela:                                         │
│ Nº  │ Cliente │ Valor   │ Vencimento │ Status  │
│ 001 │ João    │ 1.5k    │ 21/07      │ Emitida │
│ 002 │ Maria   │ 2.1k    │ 28/07      │ Rascunho│
│                                                 │
│ Ações por invoice:                              │
│ [Editar] [Emitir NF-e] [Pdf] [Deletar]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. **/payments** (Recebimentos)

```
┌─────────────────────────────────────────────────┐
│ PAGAMENTOS                                      │
│ Status: [Todos] [Pendentes] [Confirmados]       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Tabela:                                         │
│ Cliente │ Valor │ Método │ Status │ Data       │
│ João    │ 1.5k  │ PIX    │ ✓      │ 21/06      │
│ Maria   │ 2.1k  │ Boleto │ ⏳     │ 24/06      │
│                                                 │
│ Ações:                                          │
│ [Gerar PIX] [Gerar Boleto] [Manual] [Recibo]  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. **/expenses** (Despesas)

```
┌─────────────────────────────────────────────────┐
│ DESPESAS                                        │
│ [+ Nova Despesa]                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Filtro: [Categoria] [Status] [Data]             │
│                                                 │
│ Tabela:                                         │
│ Descrição │ Categoria │ Valor │ Status │ Ação  │
│ Tubo PVC  │ Material  │ 150   │ Paga   │ Edit  │
│ Combustível│ Transporte│ 80    │ Pend.  │ Mark  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5. **/reports** (Relatórios)

```
┌─────────────────────────────────────────────────┐
│ RELATÓRIOS                                      │
├─────────────────────────────────────────────────┤
│ [DRE] [Fluxo de Caixa] [Contas a Cobrar]       │
│ [Contas a Pagar] [Margem por Serviço]           │
│                                                 │
│ DRE - Junho 2026:                               │
│ Receitas:          R$ 12.500,00                 │
│   - Impostos:      R$ (625,00)                  │
│ ─────────────────────────────────              │
│ Receita Líquida:   R$ 11.875,00                │
│                                                 │
│ Despesas:          R$ 3.200,00                  │
│ ─────────────────────────────────              │
│ Lucro Bruto:       R$ 8.675,00                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Integração

### Fluxo 1: Criar e Cobrar Orçamento

```
1. Usuário cria Quotation (serviços + preço)
                  ↓
2. Clica "Gerar Invoice"
                  ↓
3. Sistema cria Invoice (com cálculo de impostos)
                  ↓
4. Usuário clica "Emitir NF-e"
                  ↓
5. Asaas emite NF-e + retorna PDF
                  ↓
6. Usuário clica "Gerar PIX"
                  ↓
7. Asaas gera QR code + chave PIX
                  ↓
8. Sistema envia WhatsApp para cliente com QR
                  ↓
9. Cliente escaneia PIX e paga
                  ↓
10. Asaas webhook confirma pagamento
                  ↓
11. Sistema atualiza Invoice status = "paga"
    Atualiza Quotation status = "aprovado"
    Registra FinancialTransaction
                  ↓
12. WhatsApp confirma para usuário: "✅ R$ 1.5k recebido"
```

### Fluxo 2: Acompanhar Contas a Cobrar

```
Dashboard financeiro
        ↓
Mostra "A Cobrar: R$ 6.800,00"
        ├─ Vencidas: R$ 1.200,00 (alerta)
        ├─ A vencer (7d): R$ 3.200,00
        └─ A vencer (30d): R$ 2.400,00
        ↓
Usuário clica "Vencidas"
        ↓
Sistema lista invoices vencidas
        ↓
Usuário seleciona invoice
        ↓
Pode: [Reenviar PIX] [Enviar Email] [Registrar Pagamento Manual]
```

### Fluxo 3: Registrar Despesa

```
Usuário vai a /expenses
        ↓
Clica "+ Nova Despesa"
        ↓
Preenche:
  - Categoria: MATERIAL
  - Descrição: Tubo PVC 50mm
  - Valor: R$ 150,00
  - Data: 2026-06-21
  - Fornecedor: (seleciona ou cria)
        ↓
Sistema cria Expense
        ↓
Recalcula saldo de caixa
Atualiza AccountBalance
        ↓
Exibe confirmação:
"Despesa registrada! Saldo atual: R$ 15.350,00"
        ↓
Usuário marca como paga quando pagar
        ↓
Sistema registra FinancialTransaction
```

---

## 📊 Relatórios Disponíveis

### 1. **DRE (Demonstração de Resultado do Exercício)**
- Período (mês, trimestre, ano)
- Receitas por tipo de serviço
- Descontos e devoluções
- Impostos (ISS, ICMS)
- Lucro bruto
- Despesas por categoria
- EBITDA, Lucro líquido
- Margem de lucro

### 2. **Fluxo de Caixa**
- Saldo inicial
- Entradas (pagamentos confirmados)
- Saídas (despesas pagas)
- Saldo final
- Previsão 30/60/90 dias
- Gráfico de tendência

### 3. **Contas a Cobrar**
- Por cliente
- Por período de vencimento
- Valor vencido vs. a vencer
- Taxa de recebimento
- Dias médios para receber

### 4. **Contas a Pagar**
- Por fornecedor
- Por categoria
- Vencidas vs. a vencer
- Calendário de pagamentos

### 5. **Margem por Serviço**
- Receita por tipo de serviço
- Custo de material
- Custo de mão-de-obra
- Lucro por tipo
- Ranking de rentabilidade

### 6. **Evolução Mensal**
- Receita mês anterior vs. atual
- Despesa mês anterior vs. atual
- Lucro mês anterior vs. atual
- Gráfico de tendência

---

## 🔐 Segurança & Compliance

### LGPD Compliance
- ✅ Dados financeiros criptografados em trânsito (HTTPS)
- ✅ Senhas Asaas nunca armazenadas (API key apenas)
- ✅ Logs de acesso a dados financeiros
- ✅ Direito ao esquecimento (soft delete)

### PCI Compliance
- ✅ Nunca armazenar dados de cartão (Asaas faz)
- ✅ Apenas últimos 4 dígitos armazenados
- ✅ Encriptação de IPs de webhooks

### Asaas Security
- ✅ Validar assinatura HMAC de webhooks
- ✅ IP whitelisting
- ✅ Rate limiting em APIs
- ✅ Timeout em requisições

### NF-e Security
- ✅ Certificado digital (A1)
- ✅ Série de notas sequencial
- ✅ XML validado contra XSD
- ✅ Assinatura digital

---

## 🎯 MVP (Fase 1) vs. Full (Fase 2+)

### MVP (Sprint 1-2, 2-3 semanas)
- ✅ Invoices básicas (sem NF-e)
- ✅ Pagamentos manual
- ✅ Dashboard com saldo
- ✅ Contas a cobrar/pagar
- ✅ Relatório DRE simples

### Fase 2 (Sprint 3-4, 3-4 semanas)
- ✅ Integração Asaas (PIX + Boleto)
- ✅ NF-e automática
- ✅ WhatsApp notifications
- ✅ Webhook Asaas
- ✅ Email comprovantes

### Fase 3+ (Sprint 5+)
- ✅ Integração Google Sheets
- ✅ Margem por serviço
- ✅ Previsão de fluxo (ML)
- ✅ Integração contabilidade
- ✅ DM (Data Warehouse)

---

## 📈 KPIs Monitorados

| KPI | Target | Alert |
|-----|--------|-------|
| Saldo de Caixa | > R$ 5k | < R$ 1k |
| Taxa de Recebimento | > 95% | < 80% |
| Dias para Receber | < 10d | > 30d |
| Margem de Lucro | > 40% | < 25% |
| Contas Vencidas | 0 | > R$ 500 |

---

## 🚀 Próximas Ações

1. **Design da UI** — Figma mockups das 5 páginas
2. **Schema Prisma** — Criar modelos + migrations
3. **APIs** — Implementar endpoints (4-5 sprints)
4. **Integração Asaas** — PIX + Boleto + NF-e (3-4 sprints)
5. **Frontend** — Componentes React (2-3 sprints)
6. **Testes** — 100+ testes + validação (ongoing)
7. **Deploy** — Staging → Produção

---

**Status:** 🟢 Pronto para Build  
**Tempo Estimado:** 6-8 semanas (MVP)  
**Equipe:** 1-2 devs  

---
