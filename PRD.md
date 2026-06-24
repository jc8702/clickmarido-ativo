# Product Requirements Document (PRD)
## CRM de Serviços ClickMarido

**Versão:** 1.0  
**Data:** 23 de Junho de 2026  
**Status:** MVP Funcional  
**Autor:** Equipe de Desenvolvimento ClickMarido

---

## 1. Visão Geral do Produto

### 1.1 Resumo Executivo

O ClickMarido é um sistema de gestão (CRM) completo e moderno, projetado especificamente para empresas de serviços residenciais que operam nos segmentos de elétrica, hidráulica, limpeza e reparos em geral. O sistema automatiza processos críticos do negócio, desde a captação de clientes até o recebimento de pagamentos, proporcionando eficiência operacional e melhoria na experiência do cliente.

### 1.2 Problema que Resolve

Empresas de serviços residenciais enfrentam desafios como:
- Controle manual de orçamentos e ordens de serviço
- Dificuldade no acompanhamento de pagamentos
- Falta de visão consolidada do financeiro
- Gestão ineficiente de fornecedores e estoque
- Comunicação fragmentada com clientes

### 1.3 Solução Proposta

O ClickMarido centraliza todas as operações em uma única plataforma web, oferecendo:
- Gestão completa do ciclo de vida de serviços
- Automação de processos repetitivos
- Integração com gateways de pagamento
- Notificações automáticas via WhatsApp
- Dashboard financeiro em tempo real

---

## 2. Objetivos

### 2.1 Objetivos do Produto

| Objetivo | Meta | Prazo |
|----------|------|-------|
| Reduzir tempo de criação de orçamentos | 70% mais rápido | Q3 2026 |
| Automatizar cobranças | 90% dos pagamentos automáticos | Q3 2026 |
| Melhorar recebimento | Reduzir inadimplência em 40% | Q4 2026 |
| Aumentar satisfação do cliente | NPS > 80 | Q4 2026 |

### 2.2 Objetivos Técnicos

- Performance: Tempo de carregamento < 2 segundos
- Disponibilidade: 99.9% de uptime
- Escalabilidade: Suportar 1000+ usuários simultâneos
- Segurança: Conformidade com LGPD

---

## 3. Público-Alvo

### 3.1 Usuários Primários

| Perfil | Descrição | Necessidades |
|--------|-----------|--------------|
| Dono/Gerente | Gestão do negócio | Visão financeira, relatórios, decisões estratégicas |
| Atendente | Recebimento de chamados | Cadastro de clientes, orçamentos, agendamentos |
| Técnico | Execução dos serviços | Acompanhamento de OS, registro de fotos, conclusão |

### 3.2 Usuários Secundários

| Perfil | Descrição | Necessidades |
|--------|-----------|--------------|
| Cliente | Contratante do serviço | Acompanhamento de orçamentos, pagamentos |
| Fornecedor | Parceiro de negócios | Pedidos de compra, histórico de transações |

---

## 4. Funcionalidades Principais

### 4.1 Gestão de Clientes

**Descrição:** Cadastro e gestão completa de clientes com informações de contato, endereços e histórico de serviços.

**Funcionalidades:**
- Cadastro com dados pessoais (nome, email, telefone, CPF/CNPJ)
- Múltiplos endereços por cliente (JSON flexível)
- Limite de crédito configurável
- Busca por nome, email ou telefone
- Paginação inteligente (20 itens/página)
- Validação de dados com Zod

**Regras de Negócio:**
- Email deve ser único no sistema
- CPF/CNPJ validado por algoritmo
- Telefone aceita formatos variados (fixo, celular, com/sem DDD)

### 4.2 Orçamentos

**Descrição:** Criação e gestão de orçamentos para serviços e produtos, com fluxo de aprovação completo.

**Funcionalidades:**
- Criação com itens vinculados (serviços/peças)
- Cálculo automático de totais
- Condições de pagamento: À Vista, 30 Dias, 60 Dias
- Status: Rascunho → Enviado → Aceito/Rejeitado
- Visualização pública por token (para clientes)
- Expiração automática (cron job diário)

**Regras de Negócio:**
- Orçamentos expiram após 7 dias sem resposta
- Aprovação gera automaticamente Ordem de Serviço
- Rejeição envia notificação ao cliente

### 4.3 Produtos (Serviços e Peças)

**Descrição:** Catálogo de serviços e peças oferecidos pela empresa.

**Funcionalidades:**
- Dois tipos: SERVIÇO e PEÇA
- SKU auto-gerado (código de família + sequencial)
- Categorias, unidade de medida, preço
- Vinculação com fornecedor padrão
- Controle de estoque para peças
- Histórico de preços de compra

**Exemplos de SKU:**
- `SRV-ELE-001` → Serviço de elétrica
- `PCE-HID-001` → Peça de hidráulica

### 4.4 Ordens de Serviço (OS)

**Descrição:** Controle completo do fluxo de execução dos serviços.

**Funcionalidades:**
- Número sequencial automático (OS-0001, OS-0002...)
- Status: Agendada → Em Progresso → Concluída/Cancelada
- Vinculação com orçamento, cliente e técnico
- Agendamento com data e hora
- Registro de fotos de acompanhamento
- Automação: conclusão gera pagamento pendente

**Fluxo Principal:**
```
Orçamento Aprovado → OS Criada → Técnico Designado → 
Serviço Iniciado → Fotos Registradas → OS Concluída → 
Pagamento Gerado → Cobrança Enviada
```

### 4.5 Pagamentos

**Descrição:** Gestão de cobranças e recebimentos com integração a gateways.

**Funcionalidades:**
- Métodos: PIX, Boleto, Cartão, Dinheiro
- Integração com Mercado Pago (PIX, Boleto, Cartão)
- Geração de payload PIX estático
- Status: Pendente → Confirmado/Cancelado/Devolvido
- Lembretes automáticos via WhatsApp
- Rastreamento de transações do gateway

**Integrações:**
- **Mercado Pago:** Criação de cobranças, webhooks de confirmação
- **PIX Estático:** Geração de código copia-e-cola (BR Code)

### 4.6 Garantias

**Descrição:** Controle de garantias oferecidas aos clientes.

**Funcionalidades:**
- Vinculação com orçamento e cliente
- Data de expiração configurável
- Verificação automática de vencimento (cron job)
- Reivindicação de garantia pelo cliente

### 4.7 Pedidos de Compra

**Descrição:** Gestão de compras de materiais e peças de fornecedores.

**Funcionalidades:**
- Número sequencial por ano (OC-2026-000001)
- Ciclo de vida: Rascunho → Emitido → Aprovado → Em Andamento → Recebido/Cancelado
- Vinculação com fornecedor, orçamento e/ou OS
- Cálculo automático (subtotal, descontos, frete, impostos)
- Recebimento parcial por item
- Histórico de auditoria completo

**Automações:**
- Criação automática a partir de Orçamento
- Criação automática a partir de OS

### 4.8 Fornecedores

**Descrição:** Cadastro e gestão de fornecedores com classificação de desempenho.

**Funcionalidades:**
- Dados cadastrais completos (CNPJ/CPF, inscrições, endereço)
- Classificação: A, B, C, D (baseada em desempenho)
- Categorias: MATERIAL, SERVIÇO, TRANSPORTE, EQUIPAMENTO, FERRAMENTAS, TERCEIRIZADO, OUTROS
- Controle de bloqueio e inativação
- Histórico de compras e resumo de classificação

### 4.9 Dashboard Financeiro

**Descrição:** Visão consolidada da saúde financeira do negócio.

**Funcionalidades:**
- Saldo atual e previsão
- Projeções 30/60/90 dias
- Receitas vs Despesas
- Gráficos de tendência
- Indicadores de performance

**Métricas Disponíveis:**
- Saldo atual
- Previsão 30/60/90 dias
- Total de receitas
- Total de despesas
- Lucro líquido
- Ticket médio

### 4.10 Despesas

**Descrição:** Registro e categorização de despesas operacionais.

**Funcionalidades:**
- Categorias: MATERIAL, SERVIÇO, TRANSPORTE, ALUGUEL, UTILITIES, FERRAMENTAS, OUTROS
- Centros de custo
- Anexo de comprovantes
- Relatórios por período

### 4.11 Faturas (Notas Fiscais)

**Descrição:** Emissão e gestão de faturas para clientes.

**Funcionalidades:**
- Numeração sequencial automática
- Cálculo de impostos (ISS)
- Regimes tributários
- Status: Pendente → Paga → Cancelada

### 4.12 Automações e Notificações

**Descrição:** Sistema de automação e notificações para melhorar a comunicação.

**Funcionalidades:**
- WhatsApp Business API para notificações
- Templates pré-definidos
- Cron jobs para tarefas agendadas
- Log de auditoria completo

**Templates de Notificação:**
| Template | Gatilho | Destinatário |
|----------|---------|--------------|
| quotation_approved | Orçamento aceito | Cliente |
| service_order_created | OS criada | Técnico |
| service_order_completed | OS concluída | Cliente |
| payment_pending | Pagamento gerado | Cliente |
| payment_reminder | 3+ dias pendente | Cliente |
| payment_received | Pagamento confirmado | Cliente |
| warranty_expiring | 30 dias para vencer | Cliente |

**Cron Jobs:**
| Job | Horário | Descrição |
|-----|---------|-----------|
| quotation-expiry-check | 08:00/dia | Verificar orçamentos expirados |
| warranty-expiry-check | 09:00/dia | Verificar garantias vencendo |
| payment-reminders | 10:00/dia | Enviar lembretes de pagamento |
| daily-report | 18:00/dia | Relatório diário via WhatsApp |

---

## 5. Requisitos Não-Funcionais

### 5.1 Performance

| Requisito | Meta | Medição |
|-----------|------|---------|
| Tempo de carregamento inicial | < 2s | Lighthouse |
| Tempo de resposta da API | < 500ms | p95 |
| Throughput | 1000 req/min | Load test |

### 5.2 Disponibilidade

- **Uptime:** 99.9% (8.76 horas de downtime/ano máximo)
- **Backup:** Diário automático
- **Recuperação:** RTO < 4 horas, RPO < 1 hora

### 5.3 Segurança

- Autenticação JWT com expiração de 7 dias
- Senhas hasheadas com bcrypt
- Validação de token em todas as rotas
- HTTPS obrigatório em produção
- Variáveis de ambiente sensíveis protegidas
- Conformidade com LGPD

### 5.4 Usabilidade

- Design responsivo (mobile-first)
- Dark mode suportado
- Acessibilidade WCAG 2.1 AA
- Navegação intuitiva
- Feedback visual em todas as ações

### 5.5 Compatibilidade

- **Navegadores:** Chrome, Firefox, Safari, Edge (últimas 2 versões)
- **Dispositivos:** Desktop, Tablet, Smartphone
- **Resoluções:** 320px a 4K

---

## 6. Arquitetura do Sistema

### 6.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Browser   │  │   Mobile    │  │   Tablet    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Vercel    │
                    │   (Edge)    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │   Next.js   │  │   Next.js   │  │   Next.js   │
   │   Pages     │  │    API      │  │   Cron      │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │   ORM       │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │   (Neon)    │
                    └─────────────┘
```

### 6.2 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | Next.js | 16+ |
| UI | React | 19 RC |
| Estilização | Tailwind CSS | 3.4+ |
| Formulários | React Hook Form | 7.80+ |
| Validação | Zod | 4.4+ |
| Gráficos | Recharts | 2.15+ |
| Backend | Next.js API Routes | - |
| ORM | Prisma | 6.19+ |
| Banco | PostgreSQL | 16 |
| Auth | JWT | 9.0+ |
| Deploy | Vercel | - |
| Banco (Produção) | Neon | - |

### 6.3 Modelo de Dados

**Tabelas Principais (16):**

| Tabela | Descrição | Registros Estimados |
|--------|-----------|---------------------|
| users | Usuários do sistema | 10-50 |
| technicians | Técnicos/funcionários | 5-20 |
| customers | Clientes | 100-1000 |
| quotations | Orçamentos | 500-5000 |
| quotation_items | Itens do orçamento | 1000-10000 |
| products | Serviços e peças | 50-200 |
| service_orders | Ordens de serviço | 500-5000 |
| service_order_photos | Fotos da OS | 2000-20000 |
| payments | Pagamentos | 500-5000 |
| invoices | Faturas | 500-5000 |
| expenses | Despesas | 200-2000 |
| vendors | Fornecedores | 10-50 |
| purchase_orders | Pedidos de compra | 100-1000 |
| purchase_order_items | Itens do pedido | 300-3000 |
| purchase_order_events | Histórico de auditoria | 500-5000 |
| financial_transactions | Transações financeiras | 1000-10000 |
| account_balances | Saldos de conta | 1-10 |
| audit_logs | Log de auditoria | 5000-50000 |

---

## 7. Integrações

### 7.1 Mercado Pago

**Tipo:** Gateway de Pagamento  
**Funcionalidades:**
- Criação de cobranças (PIX, Boleto, Cartão)
- Webhooks de confirmação
- Consulta de status
- Reembolsos

**Endpoints:**
- POST `/api/payments/[invoiceId]/create-pix`
- POST `/api/payments/[invoiceId]/create-boleto`
- POST `/api/payments/webhook-mp`

### 7.2 Google Drive

**Tipo:** Armazenamento de Arquivos  
**Funcionalidades:**
- Upload de fotos e documentos
- Download de arquivos
- Exclusão de arquivos
- Listagem de arquivos

**Lib:** `frontend/lib/google-drive.ts`

### 7.3 WhatsApp Business API

**Tipo:** Notificações  
**Funcionalidades:**
- Envio de mensagens automatizadas
- Templates pré-definidos
- Confirmação de recebimento

**Lib:** `frontend/lib/notifications/whatsapp.ts`

---

## 8. Cronograma de Desenvolvimento

### 8.1 Fases do Projeto

| Fase | Período | Entregáveis |
|------|---------|-------------|
| **Fase 1 - MVP** | Jan-Mar 2026 | Core features, auth, clientes, orçamentos |
| **Fase 2 - Expansão** | Abr-Jun 2026 | OS, pagamentos, fornecedores |
| **Fase 3 - Automação** | Jul-Set 2026 | WhatsApp, cron jobs, relatórios |
| **Fase 4 - Otimização** | Out-Dez 2026 | Performance, analytics, mobile |

### 8.2 Status Atual

- **Fase:** MVP Funcional (v1.0.0)
- **Progresso:** 100% da Fase 1, 80% da Fase 2
- **Próximos Marcos:**
  - Integração completa com Mercado Pago
  - Dashboard financeiro avançado
  - App mobile (React Native)

---

## 9. Métricas de Sucesso

### 9.1 Métricas de Produto

| Métrica | Meta | Atual |
|---------|------|-------|
| Usuários ativos mensais | 100+ | - |
| Orçamentos criados/mês | 500+ | - |
| Taxa de conversão de orçamentos | 60%+ | - |
| Tempo médio de conclusão de OS | < 3 dias | - |
| Taxa de pagamento no prazo | 90%+ | - |

### 9.2 Métricas Técnicas

| Métrica | Meta | Atual |
|---------|------|-------|
| Uptime | 99.9% | - |
| Tempo de carregamento | < 2s | - |
| Cobertura de testes | 80%+ | - |
| Bugs críticos/mês | 0 | - |

### 9.3 Métricas de Negócio

| Métrica | Meta | Prazo |
|---------|------|-------|
| Redução de inadimplência | 40% | 6 meses |
| Aumento de produtividade | 30% | 3 meses |
| Retenção de clientes | 90% | 12 meses |

---

## 10. Riscos e Mitigações

### 10.1 Riscos Técnicos

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Instabilidade do gateway | Alto | Média | Fallback para PIX estático |
| Lentidão do banco | Alto | Baixa | Cache, índices, read replicas |
| Brecha de segurança | Crítico | Baixa | Auditorias, testes de penetração |
| Perda de dados | Crítico | Muito Baixa | Backups diários, replicação |

### 10.2 Riscos de Negócio

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Baixa adoção | Alto | Média | Onboarding guiado, suporte |
| Concorrência | Médio | Alta | Diferenciação, inovação |
| Mudanças regulatórias | Médio | Baixa | Flexibilidade nas configurações |

---

## 11. Apêndices

### 11.1 Glossário

| Termo | Definição |
|-------|-----------|
| CRM | Customer Relationship Management |
| OS | Ordem de Serviço |
| PIX | Pagamento Instantâneo |
| SKU | Stock Keeping Unit |
| JWT | JSON Web Token |
| LGPD | Lei Geral de Proteção de Dados |

### 11.2 Referências

- [Documentação Next.js](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Mercado Pago API](https://www.mercadopago.com.br/developers)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Aprovações:**

| Nome | Cargo | Data | Assinatura |
|------|-------|------|------------|
| | Product Owner | | |
| | Tech Lead | | |
| | Designer Lead | | |

---

*Documento gerado automaticamente em 23/06/2026*
