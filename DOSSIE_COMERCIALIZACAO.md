# Dossiê de Comercialização — Click Marido CRM → Produto SaaS

## Contexto

O Click Marido CRM é um sistema completo de gestão para empresas de serviços residenciais, atualmente rodando em **single-tenant** (uma instância = uma empresa). O objetivo é transformá-lo em um **produto comercializável**, capaz de ser vendido e provisionado para múltiplas empresas de forma eficiente e escalável.

Este dossiê cobre **tudo** que precisa ser feito, configurado e decidido para viabilizar a comercialização.

---

## 1. Decisão Estratégica: Modelo de Comercialização

### Opção A — Multi-tenant SaaS (Recomendado)
- **Uma instância** do sistema atende **todas** as empresas clientes
- Cada empresa acessa com seu login e vê apenas seus dados
- Isolamento via `tenantId` (coluna em todas as tabelas do banco)
- Banco compartilhado com Row-Level Security ou Prisma middleware
- **Vantagens:** custo operacional baixo, deploy único, manutenção centralizada
- **Desvantagens:** complexidade de implementação inicial, migração do schema

### Opção B — Single-tenant por instância
- Uma **instância separada** (Vercel + Neon) para cada empresa cliente
- Script de provisionamento automatizado
- **Vantagens:** isolamento total de dados, customização por cliente
- **Desvantagens:** custo operacional alto, manutenção distribuída

### Opção C — Híbrido
- SaaS para planos básicos, instância dedicada para clientes enterprise
- Melhor relação custo/controle
- Requer ambas as infraestruturas

**⚠️ DECISÃO NECESSÁRIA:** Qual modelo de comercialização seguir? Isso impacta diretamente toda a arquitetura.

---

## 2. Mudanças Técnicas Obrigatórias (Independente do Modelo)

### 2.1 Multi-tenancy — Isolamento de Dados

| Tarefa | Descrição | Complexidade |
|--------|-----------|:------------:|
| Adicionar `tenantId` em todas as tabelas | Coluna obrigatória vinculando cada registro a uma empresa | 🔴 Alta |
| Criar tabela `Tenant` | Dados da empresa: nome, CNPJ, plano, limites, logo, domínio | 🟡 Média |
| Criar tabela `TenantUser` | Vincula `User` a `Tenant` com role (owner, admin, técnico) | 🟡 Média |
| Prisma Middleware ou RLS | Filtrar automaticamente todas as queries por `tenantId` | 🔴 Alta |
| Migração de dados existentes | Criar tenant "Click Marido" e vincular todos os dados atuais | 🟡 Média |

#### Schema Proposto (Tenant)
```prisma
model Tenant {
  id              String   @id @default(cuid())
  name            String   @db.VarChar(255)     // Nome da empresa
  slug            String   @unique              // URL: empresa.clickmarido.com.br
  cnpj            String?  @unique
  email           String?
  phone           String?
  logoUrl         String?  @db.Text
  primaryColor    String?  @default("#2563eb")  // Branding
  plan            String   @default("trial")    // trial, starter, pro, enterprise
  planExpiresAt   DateTime?
  maxUsers        Int      @default(3)
  maxTechnicians  Int      @default(5)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  users           TenantUser[]
  settings        CompanySettings?
  
  @@map("tenants")
}

model TenantUser {
  id        String  @id @default(cuid())
  tenantId  String
  userId    String
  role      String  @default("user") // owner, admin, user, technician
  
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  user      User    @relation(fields: [userId], references: [id])
  
  @@unique([tenantId, userId])
  @@map("tenant_users")
}
```

### 2.2 Autenticação e Autorização Multi-tenant

| Tarefa | Descrição |
|--------|-----------|
| JWT com `tenantId` | Token deve carregar `{ userId, tenantId, role }` |
| Login com seleção de empresa | Usuário escolhe empresa se tiver múltiplas |
| Middleware global | Extrair `tenantId` do JWT e injetar em toda query |
| Row-Level Security | Todas as queries filtradas por tenant automaticamente |
| Roles por tenant | Owner, Admin, Operador, Técnico |

### 2.3 Onboarding Automatizado (Provisioning)

| Tarefa | Descrição |
|--------|-----------|
| Tela de cadastro público | `/signup` — Empresa preenche dados e cria conta |
| Seed de dados iniciais | Categorias de produto, templates, configurações default |
| Setup wizard | Primeiro acesso guia o owner a configurar: dados da empresa, logo, primeiro técnico, produtos |
| E-mail de boas-vindas | Credenciais + link de primeiro acesso |

### 2.4 Planos e Limites

| Plano | Preço Sugerido | Usuários | Técnicos | OS/mês | Integrações |
|-------|:---------:|:--------:|:--------:|:------:|:-----------:|
| **Trial** | R$ 0 (14 dias) | 1 | 2 | 20 | — |
| **Starter** | R$ 149/mês | 3 | 5 | 100 | WhatsApp |
| **Pro** | R$ 349/mês | 10 | 15 | Ilimitado | WhatsApp + Pagamentos + Gmail |
| **Enterprise** | Sob consulta | Ilimitado | Ilimitado | Ilimitado | Tudo + API + Suporte dedicado |

### 2.5 Billing e Cobrança

| Tarefa | Descrição |
|--------|-----------|
| Integração Stripe/Asaas para cobranças recorrentes | Cobrança mensal automática |
| Controle de plano ativo | Middleware que verifica se o plano está pago e vigente |
| Upgrade/downgrade de plano | Tela de assinatura para o owner |
| Grace period | 7 dias após vencimento antes de bloquear acesso |
| Página de bloqueio | "Sua assinatura expirou. Renove para continuar." |

---

## 3. Mudanças de Infraestrutura

### 3.1 Domínio e DNS

| Item | Configuração |
|------|-------------|
| Domínio principal | `clickmarido.com.br` (comprar/configurar) |
| Subdomínio SaaS | `app.clickmarido.com.br` (aplicação) |
| Subdomínio por cliente | `{slug}.clickmarido.com.br` (wildcard DNS + middleware Next.js) |
| Landing page | `www.clickmarido.com.br` (site de vendas) |

### 3.2 Ambiente de Produção

| Componente | Atual | Comercial |
|------------|-------|-----------|
| **Hosting** | Vercel (free/hobby) | Vercel Pro ($20/mês) ou AWS/Railway |
| **Banco** | Neon (free tier) | Neon Pro ($19/mês) ou RDS PostgreSQL |
| **E-mail transacional** | Gmail API pessoal | Resend/SendGrid ($20/mês) |
| **WhatsApp** | Evolution API local | Evolution API em VPS ou API Oficial Meta |
| **Armazenamento** | Google Drive pessoal | S3/Cloudflare R2 ($5/mês) |
| **Monitoramento** | Nenhum | Sentry + Vercel Analytics |
| **Backup** | Manual | Automatizado diário (Neon branching) |

### 3.3 Segurança para Produção Comercial

| Item | Status Atual | Ação Necessária |
|------|:------------:|-----------------|
| HTTPS | ✅ | Já via Vercel |
| Autenticação JWT | ⚠️ | Adicionar refresh tokens + rotação |
| Rotas sem auth | ❌ | Corrigir 8 rotas vulneráveis (já mapeadas) |
| Rate limiting | ❌ | Implementar (Vercel Edge / Upstash Redis) |
| LGPD compliance | ❌ | Termos de uso, política de privacidade, exportação de dados |
| Backup automático | ❌ | Configurar Neon branching ou pg_dump cron |
| Logs de auditoria | ⚠️ | Expandir para todos os módulos |
| WAF | ❌ | Cloudflare ou Vercel Firewall |
| Criptografia de dados sensíveis | ❌ | Criptografar CPF/CNPJ, tokens no banco |

---

## 4. Produto Comercial — UX/UI

### 4.1 White-label e Branding por Cliente

| Tarefa | Descrição |
|--------|-----------|
| Logo dinâmico | Cada tenant configura seu logo (exibido no header e PDFs) |
| Cores dinâmicas | Cor primária configurável por tenant |
| Nome da empresa | Exibido em headers, e-mails, PDFs, propostas |
| Domínio customizado | Opcional para plano Enterprise |

### 4.2 Telas Comerciais Necessárias

| Tela | Descrição |
|------|-----------|
| **Landing Page** (`/`) | Site de vendas com features, preços, depoimentos |
| **Cadastro** (`/signup`) | Registro de nova empresa + owner |
| **Pricing** (`/pricing`) | Tabela de planos e comparativo |
| **Login unificado** (`/login`) | Login com seleção de tenant |
| **Setup Wizard** (`/setup`) | Primeiro acesso do owner |
| **Billing** (`/settings/billing`) | Assinatura, plano, faturas, cartão |
| **Admin Panel** (`/admin`) | Painel interno para gestão de todos os tenants |

### 4.3 Painel Administrativo Interno (Super Admin)

| Funcionalidade | Descrição |
|----------------|-----------|
| Lista de tenants | Todas as empresas cadastradas |
| Métricas de uso | OS criadas, pagamentos, usuários ativos |
| Gestão de planos | Upgrade/downgrade manual |
| Bloqueio/desbloqueio | Suspender tenant inadimplente |
| Suporte | Acesso de suporte ao tenant (impersonate) |

---

## 5. Integrações — Adequação para Multi-cliente

### 5.1 WhatsApp

| Modelo | Descrição | Custo |
|--------|-----------|:-----:|
| **Evolution API compartilhada** | Uma instância, múltiplos números | Baixo |
| **API Oficial Meta (WABA)** | Cada cliente conecta seu número | Médio |
| **Híbrido** | Evolution para básico, Meta para enterprise | Flexível |

**⚠️ A Evolution API local (Docker) não escala para múltiplos clientes. Migrar para instância gerenciada ou API oficial da Meta.**

### 5.2 Pagamentos

| Tarefa | Descrição |
|--------|-----------|
| Cada tenant configura **suas próprias** credenciais | Credenciais por tenant no banco (criptografadas) |
| Webhooks por tenant | URL única por tenant ou roteamento por `tenantId` |
| Split de pagamento | Opcional: cobrar taxa sobre cada transação |

### 5.3 Gmail / E-mail

| Tarefa | Descrição |
|--------|-----------|
| Migrar para Resend ou SendGrid | E-mail transacional profissional |
| Templates por tenant | Logo e cores do tenant nos e-mails |
| Domínio de envio | `noreply@clickmarido.com.br` ou domínio do cliente |

---

## 6. Aspectos Jurídicos e Regulatórios

### 6.1 Documentos Necessários

| Documento | Descrição | Prioridade |
|-----------|-----------|:----------:|
| **Termos de Uso** | Contrato de uso da plataforma SaaS | 🔴 Crítico |
| **Política de Privacidade** | LGPD compliance, tratamento de dados | 🔴 Crítico |
| **Contrato de Licença (SLA)** | Níveis de serviço, uptime, suporte | 🔴 Crítico |
| **DPA (Data Processing Agreement)** | Tratamento de dados pessoais de terceiros | 🔴 Crítico |
| **CNPJ da empresa** | PJ para emitir notas e receber pagamentos | 🔴 Crítico |
| **Registro de Software** | INPI (opcional mas recomendado) | 🟡 Médio |

### 6.2 LGPD Compliance

| Requisito | Status | Ação |
|-----------|:------:|------|
| Consentimento explícito | ❌ | Checkbox de termos no cadastro |
| Exportação de dados | ❌ | Endpoint para download dos dados do tenant |
| Exclusão de dados | ❌ | Funcionalidade "Deletar minha conta e dados" |
| Encarregado (DPO) | ❌ | Nomear responsável |
| Log de consentimento | ❌ | Registrar aceite com data/IP |
| Notificação de breach | ❌ | Processo documentado de resposta a incidentes |

---

## 7. Roadmap de Implementação

### Fase 0 — Estabilização (1-2 semanas)
- [ ] Corrigir 8 rotas sem autenticação
- [ ] Unificar padrão de status
- [ ] Unificar PrismaClient singleton
- [ ] Expandir cobertura de testes

### Fase 1 — Multi-tenancy (2-3 semanas)
- [ ] Criar tabelas `Tenant` e `TenantUser`
- [ ] Adicionar `tenantId` em todas as 25+ tabelas
- [ ] Implementar Prisma middleware para filtro automático
- [ ] Migrar JWT para incluir `tenantId`
- [ ] Migrar dados existentes
- [ ] Testar isolamento de dados

### Fase 2 — Onboarding e Billing (2-3 semanas)
- [ ] Landing page de vendas
- [ ] Tela de cadastro público
- [ ] Setup wizard
- [ ] Cobrança recorrente
- [ ] Controle de plano e limites
- [ ] Grace period e bloqueio

### Fase 3 — White-label e Integrações (1-2 semanas)
- [ ] Branding dinâmico por tenant
- [ ] Migrar e-mail para serviço transacional
- [ ] Credenciais de pagamento por tenant
- [ ] Modelo de WhatsApp multi-cliente
- [ ] Templates com branding do tenant

### Fase 4 — Admin e Jurídico (1-2 semanas)
- [ ] Painel Super Admin
- [ ] Termos de Uso e Política de Privacidade
- [ ] LGPD (exportação, exclusão, consentimento)
- [ ] Contrato SLA
- [ ] Monitoramento (Sentry + Vercel Analytics)
- [ ] Backup automatizado

### Fase 5 — Go-to-Market (1-2 semanas)
- [ ] Domínio `clickmarido.com.br`
- [ ] Deploy multi-tenant
- [ ] Smoke test com 2+ tenants
- [ ] Documentação de onboarding
- [ ] Canais de suporte
- [ ] Precificação validada
- [ ] Primeiro cliente piloto

---

## 8. Custos Operacionais

### Infraestrutura mensal (até 50 clientes)

| Serviço | Custo Estimado |
|---------|:--------------:|
| Vercel Pro | R$ 100 |
| Neon Pro | R$ 100 |
| Resend | R$ 50 |
| VPS Evolution API | R$ 80 |
| Cloudflare | R$ 0 |
| Sentry | R$ 0 |
| Domínio | R$ 40/ano |
| **Total** | **~R$ 330/mês** |

### Break-even
- Plano Starter (R$ 149): **3 clientes**
- Mix Starter + Pro: **2 clientes**

---

## 9. Decisões Pendentes

1. **Modelo de tenancy:** Multi-tenant ou single-tenant?
2. **Gateway de cobrança recorrente:** Stripe, Asaas ou Mercado Pago?
3. **WhatsApp:** Evolution API gerenciada, API oficial Meta, ou ambos?
4. **E-mail transacional:** Resend, SendGrid ou manter Gmail API?
5. **Planos e preços:** Valores adequados ao mercado-alvo?
6. **CNPJ/PJ:** Já existe empresa constituída?
7. **Suporte:** Qual o modelo?
8. **Marca:** Manter "Click Marido" ou criar marca genérica para o SaaS?
9. **Primeiro piloto:** Já tem empresa interessada para beta?

---

*Documento gerado em 02/07/2026.*
