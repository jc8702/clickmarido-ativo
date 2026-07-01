# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais
- **Status Atual:** Evolução do Módulo NPS concluída com sucesso (API pública segura, formulário interativo de múltipla escolha, convite Google Review e tags coloridas no Dashboard Admin). Deploy de melhorias de estoque e webhooks estável concluído.
- **Objetivo Central:** Migrar o Módulo WhatsApp e adequar os relatórios financeiros para a operação "Solo". Reestruturação de Pré-Vendas/CRM e dashboard comercial.
- **Última Atualização:** 01/07/2026 - 16:15

## Histórico de Alterações

### 01/07/2026 - 16:15
- **Evolução e Melhoria Completa no Módulo NPS:**
  - **Endpoint Público e Seguro:** A API de POST do NPS ([route.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/api/nps/route.ts)) agora aceita submissões anônimas dos clientes, validando no banco se o `clientId` existe de fato para proteger a segurança do endpoint.
  - **Layout de Formulário Dinâmico:** Enriquecida a página de pesquisa do cliente ([page.tsx - Survey](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/survey/[id]/page.tsx)) com checkboxes de múltiplos motivos dinâmicos baseados na nota (Promotor, Neutro, Detrator) e botão para avaliar no Google.
  - **Visualização Visual no Dashboard:** O histórico administrativo de avaliações ([page.tsx - Dashboard](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/(dashboard)/nps/page.tsx)) agora parseia os feedbacks estruturados do banco de dados e exibe os motivos como tags coloridas no histórico.
  - **Correção da URL no Cron:** Ajustado o redirecionamento dinâmico no cron de WhatsApp para apontar para a rota pública `/survey/[id]`.

### 01/07/2026 - 15:50
- **Varredura e Análise de Sistemas, Integrações e Automações:**
  - Realizada varredura completa do banco de dados, APIs de transações comerciais, fluxos de compras e webhooks de pagamento.
  - Identificada falta de incremento de estoque na entrada física de peças ([receive/route.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/api/purchase-orders/[id]/receive/route.ts)) e inconsistência operacional no webhook de pagamentos do Mercado Pago em relação ao Asaas.
  - Criado o relatório detalhado de insights e diagramas de automação em [analise_sistemas_e_automacoes.md](file:///C:/Users/jc-pr/.gemini/antigravity-ide/brain/59422ff7-e0d6-414b-8d98-832d4c7184e6/analise_sistemas_e_automacoes.md).

### 01/07/2026 - 15:45
- **Melhoria e Polimento — Calendário Dinâmico de Transição Mensal:**
  - **Identificação da Omissão de Dados:** O Dashboard e os Relatórios Financeiros filtravam os dados de faturamento baseando-se estritamente no "Mês Calendário Corrente" (julho de 2026). Como todos os dados reais foram inseridos no mês anterior (junho de 2026), as telas apareciam vazias ou zeradas logo no dia 1º de julho.
  - **Calendário Dinâmico de 10 Dias:** Adicionada uma inteligência nas APIs `/api/dashboard/route.ts` e `/api/reports/route.ts` para que, nos primeiros 10 dias de cada mês, o período padrão de exibição retroceda automaticamente para englobar o início do mês anterior. Isso mantém as telas com dados ricos e histórico recente sempre visíveis de forma polida.
  - **Deploy de Produção:** Commit e push realizados, deploy de produção finalizado e validado na Vercel com os dados reais de junho carregando corretamente.

### 01/07/2026 - 15:25
- **Hotfix de Produção — Auditoria e Restauração de Banco (Neon):**
  - **Identificação do Erro:** O deploy anterior com enums no schema gerou erros no Postgres do Neon (`type "public.ServiceOrderStatus" does not exist`) em todas as rotas de carregamento de dados em produção, impedindo a exibição de registros e gerando falha 500 no dashboard, OS, pagamentos, financeiro, faturamento, despesas e relatórios.
  - **Restauração do Schema (String):** Revertemos o `schema.prisma` para usar tipos `String` nos campos de status de forma a manter compatibilidade estável com o Neon de produção. As validações de integridade continuam ativas a nível de código no arquivo centralizado `lib/status-map.ts`.
  - **Auditoria e Confirmação de Dados:** Criado um endpoint temporário de auditoria que confirmou a existência e integridade de todos os dados reais no Neon (José Carlos, Jocemar, OS-0001, OS-0002, orçamentos, faturas, etc.). Todos os dados estão seguros e visíveis.
  - **Deploy de Produção Final:** Removido o endpoint de teste e executado o deploy de produção final bem-sucedido na Vercel. Todas as telas voltaram a funcionar instantaneamente com os dados recuperados.

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
- [x] Implementar incremento automático de estoque físico do produto ao registrar recebimento de itens na Ordem de Compra.
- [x] Padronizar webhook Mercado Pago para concluir a OS correspondente ao confirmar o pagamento (alinhado com o webhook Asaas).
- [x] Criar rotina para envio automático de pesquisa de satisfação NPS via WhatsApp 24 horas após conclusão do faturamento do serviço.
- [ ] Conectar API de novos leads com Webhooks externos de landing pages.
- [ ] Implementar templates automáticos de WhatsApp a cada transição de etapa do lead.
