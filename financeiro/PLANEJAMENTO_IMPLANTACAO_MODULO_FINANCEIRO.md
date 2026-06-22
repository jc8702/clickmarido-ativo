# PLANO DE IMPLANTAÇÃO - MÓDULO FINANCEIRO

**Click Marido CRM** | Versão 1.0 | 21/06/2026

---

## FASE 0: PREPARAÇÃO (Semana 0)

### 0.1 Infraestrutura
- [ ] Criar branch `feature/financeiro` a partir de `main`
- [ ] Configurar variáveis de ambiente (Asaas, WhatsApp, Email)
- [ ] Verificar compatibilidade do Prisma com banco atual
- [ ] Definir repositório para testes

### 0.2 Dependências
```bash
npm install @prisma/client zod date-fns
npm install -D prisma
```

---

## FASE 1: SCHEMA & BANCO DE DADOS (Semana 1)

### 1.1 Modelos Prisma (6 novos + 2 atualizados)

| Modelo | Tabela | Prioridade |
|--------|--------|------------|
| `Invoice` | invoices | Alta |
| `Payment` | payments | Alta |
| `Expense` | expenses | Média |
| `Vendor` | vendors | Média |
| `FinancialTransaction` | financial_transactions | Alta |
| `AccountBalance` | account_balances | Alta |
| `Customer` (update) | customers | Alta |
| `Quotation` (update) | quotations | Alta |

### 1.2 Migrações
```bash
npx prisma migrate dev --name add_financial_module
npx prisma generate
```

### 1.3 Seed Data
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

## FASE 3: API - PAYMENTS (Semana 2-3)

### 3.1 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/payments` | Listar pagamentos |
| POST | `/api/payments/[invoiceId]/create-pix` | Gerar QR PIX |
| POST | `/api/payments/[invoiceId]/create-boleto` | Gerar boleto |
| POST | `/api/payments/webhook-asaas` | Webhook confirmação |
| POST | `/api/payments/manual` | Pagamento manual |
| GET | `/api/payments/[id]/receipt` | Comprovante |

### 3.2 Integração Asaas
- Configurar client HTTP para Asaas API
- Validar HMAC-SHA256 em webhooks
- Tratar eventos: `payment.confirmed`, `payment.received`

### 3.3 Fluxo Webhook
```
Asaas → POST /api/payments/webhook-asaas
  ├─ Validar assinatura
  ├─ Atualizar payment.status
  ├─ Atualizar invoice.status
  ├─ Criar FinancialTransaction
  └─ Enviar notificação WhatsApp
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

### 5.2 Lógica de Cálculo
- Saldo = SUM(entradas) - SUM(saídas)
- Previsão 30/60/90 dias baseada em dueDate
- DRE: Receitas - Impostos - Despesas = Lucro

---

## FASE 6: INTEGRAÇÕES EXTERNAS (Semana 4-5)

### 6.1 Asaas (PIX + Boleto + NF-e)
```
[ ] Configurar API key
[ ] Implementar geração PIX
[ ] Implementar geração Boleto
[ ] Implementar emissão NF-e
[ ] Webhook handler com validação
```

### 6.2 WhatsApp
```
[ ] Configurar API WhatsApp Business
[ ] Template: Pagamento gerado (QR code)
[ ] Template: Pagamento confirmado
[ ] Template: Lembrete de vencimento
```

### 6.3 Email
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
[ ] PaymentActions (PIX, Boleto, Manual)
[ ] ExpenseForm (formulário categorizado)
[ ] ReportCard (DRE, Fluxo, etc.)
[ ] StatusBadge (pago, pendente, vencido)
```

### 7.3 Integração com Módulos Existentes
- Quotation: Adicionar botão "Gerar Invoice"
- Customer: Exibir saldo e histórico financeiro
- ServiceOrder: Vincular despesas ao serviço

---

## FASE 8: TESTES (Semana 6-7)

### 8.1 Testes Unitários (100+)
```
[ ] Cálculo de impostos
[ ] Numeração de invoices
[ ] Validação de status
[ ] Webhook signature validation
[ ] Formatação de valores
```

### 8.2 Testes de Integração
```
[ ] Fluxo completo: Quotation → Invoice → Payment
[ ] Webhook Asaas → Atualização DB
[ ] Dashboard consistency
[ ] Relatórios com dados reais
```

### 8.3 Testes E2E
```
[ ] Criar invoice a partir de quotation
[ ] Gerar PIX e confirmar pagamento
[ ] Registrar despesa manual
[ ] Gerar relatório DRE
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

### 9.2 PCI
```
[ ] Nunca armazenar dados de cartão
[ ] Apenas últimos 4 dígitos
[ ] Validação de inputs
```

### 9.3 Asaas Security
```
[ ] Validar HMAC-SHA256
[ ] Rate limiting
[ ] Timeout em requisições (30s)
[ ] IP whitelisting (produção)
```

---

## FASE 10: DEPLOY (Semana 7-8)

### 10.1 Staging
```
[ ] Deploy em ambiente de staging
[ ] Testes com dados fictícios
[ ] Validação com usuário
```

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
| 0 | 0 | Preparação |
| 1 | 1 | Schema Prisma + Migrações |
| 2 | 1-2 | API Invoices |
| 3 | 2-3 | API Payments + Asaas |
| 4 | 3 | API Expenses & Vendors |
| 5 | 3-4 | API Dashboard & Relatórios |
| 6 | 4-5 | Integrações externas |
| 7 | 5-6 | Frontend |
| 8 | 6-7 | Testes |
| 9 | Contínuo | Segurança |
| 10 | 7-8 | Deploy |

---

## KPIs DE ACOMPANHAMENTO

| Métrica | Meta | Alerta |
|---------|------|--------|
| Saldo de Caixa | > R$ 5.000 | < R$ 1.000 |
| Taxa de Recebimento | > 95% | < 80% |
| Dias para Receber | < 10 dias | > 30 dias |
| Margem de Lucro | > 40% | < 25% |
| Contas Vencidas | R$ 0 | > R$ 500 |

---

## RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Asaas instável | Alto | Fallback manual + retry |
| Webhook falha | Alto | Queue + reprocessamento |
| NF-e rejeitada | Médio | Validação antes de emitir |
| Dados inconsistentes | Alto | Transactions ACID |
| Performance relatórios | Médio | Cache + índices |

---

## FASES DE DESENVOLVIMENTO (MVP vs Full)

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

**Tempo Estimado Total:** 6-8 semanas (MVP)  
**Equipe:** 1-2 devs  
**Prioridade MVP:** Invoices + Pagamentos manuais + Dashboard básico

---

**Status:** 🟢 Pronto para Build  
**Data de Criação:** 21/06/2026
