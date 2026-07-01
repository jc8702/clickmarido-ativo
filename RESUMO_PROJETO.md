# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais
- **Status Atual:** Correções do sistema de todos os módulos (Fase 1: Estabilização do Domínio) executadas com 100% de sucesso. Banco de dados sincronizado localmente com enums nativos no PostgreSQL, eliminando todas as inconsistências de status críticas (P0). Rotas protegidas com validateToken centralizado e PrismaClient unificado em singleton. Build do Next.js verificado e compilando sem avisos de tipos ou quebras.
- **Objetivo Central:** Migrar o Módulo WhatsApp e adequar os relatórios financeiros para a operação "Solo". Reestruturação de Pré-Vendas/CRM e dashboard comercial.
- **Última Atualização:** 01/07/2026 - 14:50

## Histórico de Alterações

### 01/07/2026 - 14:50
- **Estabilização do Domínio & Correções Críticas (Fase 1):**
  - **Prisma Schema e Banco de Dados:** Criados enums nativos (`QuotationStatus`, `ServiceOrderStatus`, `PaymentStatus`, `InvoiceStatus`, `PurchaseOrderStatus`, `ExpenseStatus`, `AppointmentStatusModel`) e atualizados os modelos no `schema.prisma`. Sincronização executada com sucesso via `db push`.
  - **P0-1: Normalização de Status de Pagamento:** Webhook Asaas e relatórios consolidados no status `confirmado`. Webhook Asaas emite faturas com status `emitida` (não `gerada`).
  - **P0-2: Dashboard Sync:** APIs e UI corrigidos para exibir status `em_execucao` em vez de `em_progresso` para ordens de serviço ativas.
  - **P0-3: Quotation View:** Removido o status legado `'approved'` no frontend, padronizando em `'aceito'`.
  - **P0-5: Purchase Order History:** Ajustado gênero de `'recebido'` para `'recebida'`.
  - **P0-7: Kanban de Orçamentos:** Inserida coluna `'cancelado'` com cor e label correspondentes no fluxo do Kanban.
  - **Unificação de Autenticação e Whitelist:**
    - Corrigido bypass crítico no cron SLA-Check por meio do helper `verifyCronSecret()` que exige configuração obrigatória do token.
    - Adicionada autenticação em rotas órfãs: `cron/sla`, `appointments/[id]`, `appointments/[id]/status`, `appointments/conflicts`, `appointments/technician/[id]/week`, `reviews/summary` e `reviews/technician/[id]`.
    - Implementado whitelist de campos em `appointments/[id]` contra mass-assignment (`APPOINTMENT_ALLOWED_FIELDS`).
    - Analytics real (sem mocks) implementado no banco sob autenticação JWT.
  - **Remoção de Prisma Client Múltiplos:** Todos os 14 arquivos que instanciavam `new PrismaClient()` migrados para usar a instância global `@/lib/prisma`.
  - **Ledger Financeiro Consistente:** Campo `balance` em `FinancialTransaction` calculado a partir do histórico de saldo anterior da conta.
  - **STATUS-MAP:** Criados `lib/status-map.ts` e `docs/STATUS-MAP.md` servindo como documentação oficial.

### 29/06/2026 - 13:58
- **Homologação e Deploy de Produção Final na Vercel:**
  - **Remoção de Prisma db push no build time da Vercel:** Resolvida a falha de build remoto no pipeline da Vercel ao remover a execução de `db push` em tempo de compilação remota, o que gerava erros de pooling e timeout ao conectar à base Neon de Washington. A migração foi executada localmente de forma segura e o build remoto passou a rodar em 50s.
  - **URL de Produção Ativa:** Publicado em produção sob a URL: `https://clickmarido-ativo-frontend.vercel.app`.
  - **Walkthrough Gerado:** Criado [walkthrough.md](file:///C:/Users/jc-pr/.gemini/antigravity-ide/brain/ca3e09eb-ea98-4e87-bf30-c652a6b0e8aa/walkthrough.md) na pasta de artefatos consolidando todas as mudanças.

### 29/06/2026 - 13:50
- **Reestruturação Completa do Kanban, Drawer Comercial e Cockpit de Insights:**
  - **Kanban Curto de 7 Etapas (`pre-vendas/page.tsx`):** Kanban remodelado com base no funil de qualificação curto. Cada card agora exibe prioridade (ALTA, MEDIA, BAIXA), temperatura (incluindo indicador vermelho pulsante `URGENTE`), valor previsto do lead, próxima ação comercial programada, SLA de atendimento, idade do lead, responsável e botões de ações rápidas (ajuste de prioridade e qualificação transacional direta).
  - **LeadDetailsDrawer Expandido com Metodologias:**
    - Criada a nova aba **"Qualificar"** no Drawer lateral.
    - Integrados formulários interativos para as principais metodologias de vendas do mercado: **BANT**, **CHAMP**, **GPCT** e **SPIN Selling**.
    - Salva as respostas no objeto JSON `qualificationData` e recalcula em tempo real o score de qualificação do lead no banco.
  - **Ajustes Finais de Insights de BI (`insights/page.tsx`):**
    - Gráfico de funil adaptado para exibir as novas 7 etapas oficiais, colorindo em verde a barra final `Encaminhado Orçamento`.
    - Gráfico de temperatura atualizado para contemplar o novo status `URGENTE` com cor vermelha nas fatias e legendas, removendo a antiga chave `PRONTO_ORCAMENTO`.
  - **Auditoria de CRM Local (`test_crm_flow.js`):** Script de testes atualizado e executado com **100% de sucesso**, validando todas as transações, geração automática de proposta em rascunho com número sequencial e timeline histórica de eventos de leads.

### 29/06/2026 - 13:40
- **Reestruturação e Consolidação da Arquitetura Funcional de CRM & Pré-Vendas:**
  - **APIs de CRM Completas:** Implementadas rotas reais de transação no backend:
    - `POST /api/leads` (criação manual com registro em histórico).
    - `POST /api/leads/bulk` (importação sequencial em lote/CSV).
    - `PUT /api/leads/[id]` (atualização de estágio, responsável, status e perda comercial com auditoria de eventos).
    - `/api/leads/[id]/followup`, `/api/leads/[id]/appointment` e `/api/leads/[id]/events` (cadastro de interações, agendamentos e carregamento da timeline).
    - `POST /api/leads/[id]/qualify` (qualificação de lead: cria cliente, gera proposta em rascunho vinculada, avança etapa para proposta solicitada e vincula os IDs no banco).
  - **Correção P0 de Params Assíncronos no Next.js (Moderno):** Ajustados todos os handlers de rotas dinâmicas de leads (`[id]`) para aguardar a resolução da Promise `params` (`const { id } = await params`) antes de acessar suas propriedades, eliminando o erro 500 do Prisma.

### 29/06/2026 - 13:20
- **Resolução de Erro de Produção (401 Unauthorized) nos Módulos de CRM:**
  - **Identificação do Erro:** O middleware (`proxy.ts` configurado no Next.js) bloqueia chamadas de API sem cabeçalho `Authorization: Bearer <token>`. Injetados tokens JWT via hook `useAuth` nas páginas do Kanban (`pre-vendas/page.tsx`) e Insights (`insights/page.tsx`), resolvendo a quebra.

### 29/06/2026 - 13:00
- **Padronização, Polimento e Enriquecimento Completo de Pré-Vendas e Insights:**
  - **API Real de CRM (`/api/leads/insights/route.ts`):** Rota adicionada para calcular e expor estatísticas comerciais reais do banco.
  - **Cockpit Comercial de Insights (`insights/page.tsx`):** Transformado em painel gerencial rico com gráficos Recharts responsivos de funil, origens e descarte, dotados de contraste dinâmico para modo escuro.

### 27/06/2026 - 21:05
- **Correção na Criação de Ordens de Compra (`/purchases/new`):**
  - A API (`POST /api/purchase-orders/route.ts`) foi ajustada para aceitar tanto o ID único (`cuid`) quanto a numeração amigável do orçamento (`number`) ao realizar os vínculos.

### 27/06/2026 - 19:56
- **Estratificação Visual do Módulo de Despesas:**
  - Implementação de funcionalidade de "Expansão de Linha" (Expandable Row) na tabela principal de Despesas (`expenses/page.tsx`).

### 27/06/2026 - 19:10
- **Auditoria Funcional, UX e Deploy Final (Fase 5 e Fase 6):**
  - **Revisão de UX e Acessibilidade:** O layout de Relatórios e do Dashboard foi polido para garantir leitura rápida.

### 27/06/2026 - 16:05
- **Auditoria e Ajuste do Módulo Financeiro (Solo Mode):**
  - Integração da DRE com o Livro Caixa (`FinancialTransaction`), resolvendo a divergência crítica (P0) entre saldos do Dashboard e relatórios mensais.

### 26/06/2026 - 16:45
- **Correção da Quebra no Módulo de Orçamentos (Kanban e Detalhes):**
  - Corrigido o erro fatal que impedia a renderização da listagem de orçamentos devido à chamada direta de `.toFixed(2)` em propriedades do tipo `Decimal` (convertidos com `Number(...)`).

## TODOs / Próximos Passos
- [x] Corrigir erro de roteamento e colisão de rotas no Next.js (slugs dynamic `/api/payments/[id]/`).
- [x] Corrigir erro 401 de carregamento da página de insights em produção (Vercel) e local.
- [x] Injetar headers com token JWT nas requisições do Kanban e Cockpit de Insights.
- [x] Executar testes de integração reais no backend local obtendo token de login.
- [x] Reestruturar arquitetura funcional do módulo de Pré-Vendas e CRM (criação de APIs reais de leads).
- [x] Criar rotas transacionais de leads (manual, bulk, qualify, appointments, followup, events).
- [x] Desenvolver o componente `LeadDetailsDrawer` e integrar com Kanban.
- [x] Integrar Drag & Drop nativo HTML5 no Kanban.
- [x] Atualizar tela de Insights Comerciais com novas tabelas de eficiência e KPIs.
- [x] Realizar o deploy de produção estável e verificado na Vercel.
- [x] Executar estabilização do domínio, enums de status, auth de crons/rotas e singleton Prisma (Fase 1).
- [ ] Conectar API de novos leads com Webhooks externos de landing pages.
- [ ] Implementar templates automáticos de WhatsApp a cada transição de etapa do lead.
