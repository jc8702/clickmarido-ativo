# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais
- **Status Atual:** CRUD Completo e exclusão segura implementados no módulo de fornecedores. Homologado localmente e deployado em produção na Vercel.
- **Objetivo Central:** Transformar o Click Marido CRM em produto SaaS comercializável. Migrar para multi-tenancy, billing, white-label e go-to-market.
- **Última Atualização:** 08/07/2026 - 02:20

## Histórico de Alterações
- **[08/07/2026 - 02:20]:** CRUD Completo de Fornecedores e Exclusão Segura:
  - **API `/api/vendors/[id]`:** Implementado o método `DELETE`. Adicionado tratamento de integridade referencial: caso o fornecedor possua ordens de compra (`PurchaseOrder`), a exclusão é bloqueada com retorno de erro status 400. Caso contrário, são desvinculadas despesas (`Expense`) e produtos (`Product`) de forma síncrona dentro de uma transação `$transaction` do Prisma.
  - **Hook `useVendors.ts`:** Criado o hook `useDeleteVendor` para expor o método `DELETE` integrado com autenticação JWT.
  - **Telas de Fornecedores:** Adicionados botões de exclusão na listagem principal (`vendors/page.tsx`) e na página de detalhes do fornecedor (`vendors/[id]/page.tsx`), integrando modais de confirmação de exclusão para evitar acidentes.
  - **Teste local e Deploy:** Desenvolvido e validado com sucesso script de testes unificado local `test_delete_vendor.js`. Realizado build local e deploy bem-sucedido na Vercel com link ativo.
  - Arquivos criados: `frontend/test_delete_vendor.js`
  - Arquivos modificados: `frontend/app/api/vendors/[id]/route.ts`, `frontend/hooks/useVendors.ts`, `frontend/app/(dashboard)/vendors/page.tsx`, `frontend/app/(dashboard)/vendors/[id]/page.tsx`

- **[05/07/2026 - 02:40]:** Adicionada coluna "Ganho" e corrigidos filtros de estagnação de leads:
  - **Kanban de Pré-Vendas:** Adicionada a coluna do estágio `GANHO` imediatamente antes de "Descartado". Refatorado o filtro de leads por coluna para agrupar enums menores e intermediários (como `PROPOSTA_ENVIADA`, `SEM_CONTATO`, etc.) em colunas lógicas correspondentes, eliminando leads "fantasmas" invisíveis.
  - **Histórico Comercial:** Adicionado o registro automático dos eventos comerciais de CRM `DEAL_WON` e `DEAL_LOST` ao mover leads para os estágios `GANHO` ou `PERDIDO`.
  - **Ajustes de SLA e Estagnação:** Corrigida a API de Insights Comerciais (`leadsHotAndStale` e `slaBreachedLeads`) e o cron job `sla-check` para desconsiderar leads nos estágios de fechamento comercial (`GANHO` e `PERDIDO`).
  - Arquivos modificados: `frontend/app/(dashboard)/pre-vendas/page.tsx`, `frontend/app/api/leads/[id]/route.ts`, `frontend/app/api/leads/insights/route.ts`, `frontend/app/api/cron/sla-check/route.ts`

- **[04/07/2026 - 22:50]:** Auditoria geral de deleções e integridade referencial de banco de dados. Implementadas rotinas de desvinculação síncrona dentro de transações `$transaction` do Prisma no endpoint `DELETE` de múltiplos módulos:
  - **Ordens de Serviço (`ServiceOrder`):** Desvinculação de despesas, ordens de compra e avaliações (`Review`), e exclusão em cascata de agendamentos (`Appointment`).
  - **Orçamentos (`Quotation`):** Desvinculação de pagamentos, ordens de compra e leads.
  - **Produtos (`Product`):** Desvinculação de itens de ordem de compra (`PurchaseOrderItem`).
  - **Usuários (`User`):** Desvinculação de responsabilidades sobre Leads e autoria em eventos de lead (`LeadEvent`).
  - Criado e executado com sucesso script de testes unificado local de integridade para simular todos esses cenários.
  - Arquivos modificados: `frontend/app/api/service-orders/[id]/route.ts`, `frontend/app/api/quotations/[id]/route.ts`, `frontend/app/api/products/[id]/route.ts`, `frontend/app/api/users/[id]/route.ts`

- **[04/07/2026 - 22:40]:** Correção de integridade referencial e recriação de despesas de compras. Configurado para que, ao excluir uma despesa no módulo financeiro, as Ordens de Compra que a apontavam tenham o campo `expenseId` desvinculado (definido como `null`) para evitar chaves órfãs/fantasmas. Adicionalmente, caso uma OC com status `'recebida'` (já entregue) seja editada e precise ter sua despesa recriada (por ter sido deletada anteriormente), o sistema agora a recria já com status `'paga'` e gera a respectiva transação de débito e cálculo de saldo no Livro Caixa automaticamente.
  - Arquivos modificados: `frontend/app/api/expenses/[id]/route.ts`, `frontend/app/api/purchase-orders/[id]/route.ts`

- **[04/07/2026 - 22:15]:** Correção na integração financeira das Ordens de Compra com o módulo de Despesas. Implementada a baixa automática (para o status 'paga' e preenchimento de 'paidAt') da despesa associada à Ordem de Compra assim que a OC é totalmente recebida ("dar entrada completa"). Também corrigido o cálculo do saldo acumulado (campo 'balance') da tabela de transações do livro caixa (`FinancialTransaction`) ao marcar uma despesa como paga.
  - Arquivos modificados: `frontend/app/api/expenses/[id]/mark-paid/route.ts`, `frontend/app/api/purchase-orders/[id]/receive/route.ts`

- **[04/07/2026 - 14:35]:** Correção crítica no carregamento de telas em produção da Vercel. Identificado que a baseURL do Axios estava compilando fixamente como `http://localhost:3000` devido à leitura do arquivo `.env` local no build step. Refatorada a inicialização em `frontend/lib/api.js` para determinar a URL dinamicamente em tempo de execução (usando `/api` relativo sempre que rodar no navegador fora de localhost). Validada a restoration completa das telas de Dashboard, Ordens de Serviço e Compras em produção por meio de agente autônomo com sucesso.
  - Arquivos modificados: `frontend/lib/api.js`

- **[04/07/2026 - 13:38]:** Implementação de botões de Editar e Excluir diretamente na listagem geral de Ordens de Compra (OC). Flexibilizadas as regras de edição e exclusão no backend e frontend para abranger ordens em status "aprovada" (desde que a despesa correspondente não tenha sido paga). Implementada a integridade financeira síncrona: ao editar uma OC aprovada, a despesa associada é recalculada e atualizada; ao excluir, a despesa pendente vinculada é deletada para manter o financeiro limpo.
  - Arquivos criados: `frontend/test_edit_purchase.js`
  - Arquivos modificados: `frontend/app/api/purchase-orders/route.ts`, `frontend/app/api/purchase-orders/[id]/route.ts`, `frontend/app/(dashboard)/purchases/page.tsx`, `frontend/app/(dashboard)/purchases/[id]/page.tsx`, `frontend/app/(dashboard)/purchases/[id]/edit/page.tsx`

- **[04/07/2026 - 13:28]:** Integração com a Receita Federal (via BrasilAPI) para busca automática de dados de CNPJ no cadastro de fornecedores. Adicionado botão "Busca por CNPJ" no formulário completo e no modal de cadastro rápido de fornecedores. Criado proxy seguro de API no backend Next.js que trata autenticação JWT, sanitização de entrada, tratamento de rate limits/bloqueios de User-Agent e formatação/mapeamento de campos (razão social, nome fantasia, e-mail, telefone formatado e endereço estruturado).
  - Arquivos criados: `frontend/app/api/vendors/cnpj/[cnpj]/route.ts`, `frontend/test_cnpj.js`
  - Arquivos modificados: `frontend/components/vendors/VendorForm.tsx`, `frontend/components/products/ProductForm.tsx`

- **[04/07/2026 - 11:57]:** Correção no salvamento de horários de agendamentos de leads (timezone). O servidor na Vercel (em UTC) interpretava a data local enviada pelo frontend (`datetime-local`) sob o fuso UTC, gerando uma defasagem e salvando sempre como 12:00 (meio-dia) local em GMT-3. Ajustada a API para processar a data aplicando o offset correspondente do Brasil (`-03:00`) se não vier fuso no payload. Também formatados os horários de log do histórico do lead com fuso horário `America/Sao_Paulo`.
  - Arquivos modificados: `frontend/app/api/leads/[id]/appointment/route.ts`

- **[04/07/2026 - 11:45]:** Correção no fluxo de edição de agendamentos no card do lead. Agora o usuário pode escolher explicitamente entre "Remarcar Compromisso" (chama o PUT, atualizando o compromisso ativo no banco de dados e no Google Calendar do técnico, mesmo que a data mude para outro dia) ou "Salvar como Novo" (chama o POST, criando um compromisso adicional e preservando o anterior intacto). Removida a conversão automática para novo modo que ocorria de forma invisível.
  - Arquivos modificados: `frontend/components/leads/LeadScheduleForm.tsx`

- **[04/07/2026 - 11:39]:** Correção no mapeamento de itens de orçamentos (quotation) que impedia a exibição do SKU e da Descrição do item nas propostas públicas e na página de impressão. Adicionado o mapeamento do SKU e Descrição na API pública de orçamentos e na tela de impressão.
  - Arquivos modificados: `frontend/app/api/quotations/public/[token]/route.ts`, `frontend/app/print/quotation/[id]/page.tsx`

- **[04/07/2026 - 11:35]:** Implementação de múltiplos agendamentos por lead e sincronização automática com a agenda do técnico. Ao alterar o horário no mesmo dia, o sistema atualiza o agendamento atual; ao alterar a data para um dia diferente, é dada a opção de criar um novo compromisso (mantendo o anterior no histórico). Adicionado o método DELETE na API de agendamento de leads para cancelamento de agendamentos físicos e no Google Calendar.
  - Arquivos modificados: `frontend/app/api/leads/[id]/appointment/route.ts`, `frontend/components/leads/LeadDetailsDrawer.tsx`, `frontend/components/leads/LeadScheduleForm.tsx`

- **[04/07/2026 - 11:30]:** Adicionada a unidade de medida KM (quilômetro) no select de opções de unidades do cadastro/edição de serviços e peças.
  - Arquivos modificados: `frontend/components/products/ProductForm.tsx`

- **[03/07/2026 - 17:42]:** Correção na lógica de pendências de NPS e na conclusão de Ordens de Serviço (OS) vinculadas. Agora, a aprovação manual de pagamento atualiza o status da OS correspondente para 'concluida'. Adicionamos 'completedAt' em todas as conclusões automáticas de OS (Mercado Pago, Asaas e Aprovação manual) e implementamos um saneamento/autocorreção automático e resiliente diretamente no endpoint de NPS pendentes para corrigir dados legados retroativamente.
  - Arquivos modificados: `frontend/app/api/payments/[id]/approve/route.ts`, `frontend/app/api/payments/webhook-mp/route.ts`, `frontend/app/api/webhooks/asaas/route.ts`, `frontend/app/api/nps/pending/route.ts`.

- **[03/07/2026 - 17:35]:** Integração de estoque com a criação de Ordens de Serviço (abate automático de peças previstas no orçamento) e correção no cálculo de materiais usados. Agora os materiais inseridos durante a execução da OS são somados automaticamente ao valor total final e atualizados no formulário de conclusão do frontend.
  - Arquivos modificados: `frontend/lib/stock-integration.ts`, `frontend/app/api/service-orders/[id]/materials/route.ts`, `frontend/app/api/service-orders/route.ts`, `frontend/app/api/quotations/[id]/route.ts`, `frontend/app/api/quotations/public/[token]/approve/route.ts`, `frontend/components/ServiceOrderForm.tsx`.

- **[03/07/2026 - 16:45]:** Correção e melhoria na integração da agenda do técnico. Adicionado o e-mail do técnico como participante (attendee) nas chamadas do Google Calendar e configurado `sendUpdates: 'all'` para disparar convites automáticos nas agendas individuais.
  - Arquivos modificados: `frontend/lib/google-calendar.ts`, `frontend/app/api/leads/[id]/appointment/route.ts`.

- **[03/07/2026 - 16:25]:** Implementação da integração de agendamentos de leads com o Google Calendar e inclusão da atribuição do técnico responsável para visitas comerciais de pré-vendas.
  - Arquivos modificados: `frontend/prisma/schema.prisma`, `frontend/lib/google-calendar.ts`, `frontend/app/api/auth/google/login/route.ts`, `frontend/app/api/leads/[id]/appointment/route.ts`, `frontend/app/api/leads/[id]/route.ts`, `frontend/components/leads/LeadScheduleForm.tsx`, `frontend/components/leads/LeadDetailsDrawer.tsx`.

- **[03/07/2026 - 18:10]:** Correção de conflito de rotas dinâmicas no Next.js (unificação sob o slug `[token]` de orçamento público) e liberação da rota `/api/favicon` no middleware de segurança (`proxy.ts`), permitindo o carregamento público do favicon.
  - Arquivos modificados: `frontend/proxy.ts`, `frontend/app/api/quotations/public/[token]/approve/route.ts` (renomeado de `[id]/approve/route.ts`).

- **[03/07/2026 - 17:36]:** Melhoria na API de Favicon (`/api/favicon`) para atuar como proxy das imagens hospedadas externamente. Isso garante que o navegador renderize o ícone corretamente na aba sem os bloqueios típicos de redirecionamentos (302) de CORS.
  - Arquivos modificados: `frontend/app/api/favicon/route.ts`

- **[03/07/2026 - 17:28]:** Implementação do método `DELETE` na API de Leads para corrigir problema em que o modal de exclusão de lead travava aberto. A deleção utiliza `onDelete: Cascade` do Prisma para limpeza segura dos vínculos.
  - Arquivos modificados: `frontend/app/api/leads/[id]/route.ts`

- **[03/07/2026 - 17:21]:** Melhoria na interface do módulo de NPS (Dashboard e Pendentes) para torná-la mais moderna e fluida, com bordas arredondadas e glassmorphism.
  - Arquivos modificados: `frontend/app/(dashboard)/nps/page.tsx`

### 03/07/2026 - 16:59
- **Identidade Visual e Logo Dinâmica:**
  - Criação do campo `logoUrl` no banco de dados (`CompanySettings`).
  - Adição de upload de logo no Google Drive via painel de Configurações.
  - Implementação do endpoint `/api/favicon` para servir o logo (ou fallback) de forma nativa e sem delay de cliente.
  - Integração do logo na aba do navegador (Favicon), Sidebar, e tela de Login.
  - Verificação e garantia de funcionamento do botão de tema Dark/Light.

- **Deploy Completo da Aplicação:**
  - Build testado localmente (`npm run build`).
  - Código commitado e enviado (`git push`) para a branch `main`.
  - Deploy automático acionado na Vercel conforme configurado no projeto.

### 03/07/2026 - 13:40
- **Integração de Logo e Habilitação de Temas (Claro/Escuro):**
  - **Sidebar do Dashboard:** Integrado o componente `ThemeToggle` no rodapé da Sidebar de forma dinâmica para modos aberto e fechado. Substituída a logo textual pelo logo oficial circular (`/logo.jpg`) e título com alto contraste, e o "CM" da sidebar fechada pela logo circular acompanhada por botão de toggle flutuante sobre a borda.
  - **Layout Principal:** Adicionado o alternador de temas e logo circular no cabeçalho mobile do sistema para melhor usabilidade em celulares.
  - **Tela de Login:** Inserida a logo oficial de forma centralizada e destacada no topo do formulário de autenticação.
  - **Arquivos modificados:** `components/Sidebar.tsx`, `app/(dashboard)/layout.tsx`, `app/login/page.tsx`.

### 02/07/2026 - 18:25
- **Auditoria e padronização dos modais:** Adicionado fechamento via ESC para os modais que faltavam (Service Orders, Product Picker, Proposta), adicionada rota de exclusão (DELETE) na API de Garantias e adicionado o botão de Excluir na interface de Garantias. Testes de build realizados e código atualizado no repositório (Git Push).
  - Arquivos modificados: frontend/app/(dashboard)/pre-vendas/page.tsx, frontend/app/(dashboard)/service-orders/page.tsx, frontend/app/(dashboard)/warranties/page.tsx, frontend/app/print/quotation/[id]/page.tsx, frontend/components/leads/LeadCardRich.tsx, frontend/components/leads/LeadDetailsDrawer.tsx, frontend/components/quotations/ProductPicker.tsx, frontend/app/api/warranties/[id]/route.ts

### 02/07/2026 - 17:55
- **Auditoria de UI e Tecla ESC:**
  - **useEscapeToClose:** Aplicado e verificado em todos os modais do dashboard para permitir fechamento via tecla ESC.
  - **Excluir:** Opção de Excluir adicionada com Modal de Confirmação em Telas que não possuíam, como Técnicos e Ordens de Serviço.

### 02/07/2026 - 17:08
- **Atualização do Dashboard e Regras de Disparo de NPS:**
  - O painel de NPS agora exibe a avaliação específica do técnico e o número da OS vinculada a cada feedback.
  - A lógica de pendências (api/nps/pending) e do cron (api/cron/nps-reminders) foi atualizada para se basear na data de conclusão da Ordem de Serviço (mínimo 24 horas), não mais no pagamento. A aba "Pesquisas Pendentes" reflete isso.
  - O disparo da pesquisa agora embute na URL os IDs da OS e do técnico, garantindo o vínculo no backend ao ser respondida.
  - O disparo instantâneo após baixa da fatura (webhook) foi removido.

### 02/07/2026 - 16:48
- **Melhorias no Fluxo da Ordem de Serviço:**
  - Criado o `StartServiceOrderModal.tsx` para exibição detalhada antes do início.
  - Implementada funcionalidade de atribuir outro técnico na hora do "Iniciar".
  - Adicionada etapa obrigatória de Checklist no momento de concluir a OS (`ServiceOrderForm.tsx`).
  - Atualizadas as rotas `/api/service-orders/[id]/start` e `/complete` no backend.
  - Deploy efetuado.

### 02/07/2026 - 15:00
- **Módulo Completo de Cadastro de Técnicos (Equipe Técnica):**
  - **Schema Prisma enriquecido:** Adicionados campos `document` (CPF), `address`, `avatarUrl`, `bio`, `hourlyRate`, `hireDate` ao modelo `Technician`, todos com defaults seguros.
  - **API CRUD completa:** Expandido `GET /api/technicians` com busca, paginação, filtro ativo/inativo e cálculo de rating médio. Criados endpoints `GET/PUT/DELETE /api/technicians/[id]` com whitelist de campos e soft delete.
  - **API de Performance:** Endpoint `GET /api/technicians/[id]/performance` com timeline mensal de OS, breakdown de status, top clientes atendidos e sumário.
  - **Hook React (`useTechnicians`):** SWR completo com `useTechnicians()`, `useTechnicianDetail(id)`, `useTechnicianPerformance(id)` e `useTechnicianActions()` (create/update/toggleActive/remove).
  - **PÃ¡gina Dashboard com 3 abas:**
    - *Equipe:* Grid de cards com avatar (iniciais coloridas), nome, especialidade, estrelas de avaliaÃ§Ã£o, contagens de OS/avaliaÃ§Ãµes/agendamentos, busca, filtro de inativos, botÃµes de editar/desativar com hover reveal.
    - *Performance:* Cards de destaque (Melhor Avaliado, Mais Produtivo, VisÃ£o Geral), grÃ¡fico comparativo de barras (Recharts), ranking por avaliaÃ§Ã£o e ranking por OS.
    - *Perfil Individual:* CabeÃ§alho completo com dados pessoais, 6 KPIs (Total OS, ConcluÃ­das, Em ExecuÃ§Ã£o, Receita Total, Ticket MÃ©dio, Tempo MÃ©dio), grÃ¡ficos (Area Chart de timeline, Pie de status, Bar de distribuiÃ§Ã£o de estrelas), top clientes, Ãºltimas avaliaÃ§Ãµes com comentÃ¡rios, e prÃ³ximos agendamentos.
  - **Modal de cadastro/ediÃ§Ã£o** com todos os campos (nome, especialidade, telefone, email, CPF, valor/hora, data contrataÃ§Ã£o, endereÃ§o, bio).
  - **Sidebar atualizada** com link "TÃ©cnicos" posicionado entre "Ordens de ServiÃ§o" e "Pagamentos".
  - Arquivos modificados: `schema.prisma`, `api/technicians/route.ts`, `(dashboard)/layout.tsx`
  - Arquivos criados: `api/technicians/[id]/route.ts`, `api/technicians/[id]/performance/route.ts`, `hooks/useTechnicians.ts`, `(dashboard)/technicians/page.tsx`
  - Banco sincronizado via `prisma db push` e build de produÃ§Ã£o validado com sucesso.

### 02/07/2026 - 14:15
- **DossiÃª de ComercializaÃ§Ã£o SaaS:**
  - Criado [DOSSIE_COMERCIALIZACAO.md](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/DOSSIE_COMERCIALIZACAO.md) â€” documento completo com anÃ¡lise de 3 modelos de comercializaÃ§Ã£o (multi-tenant SaaS, single-tenant, hÃ­brido).
  - Schema proposto para tabelas `Tenant` e `TenantUser` com branding dinÃ¢mico, planos e limites.
  - 4 planos de preÃ§o mapeados: Trial (grÃ¡tis), Starter (R$149), Pro (R$349), Enterprise (sob consulta).
  - Roadmap em 5 fases (~8-12 semanas): EstabilizaÃ§Ã£o â†’ Multi-tenancy â†’ Onboarding/Billing â†’ White-label â†’ Go-to-Market.
  - Custo operacional estimado: ~R$330/mÃªs com break-even em 2-3 clientes.
  - Checklist de seguranÃ§a, LGPD, aspectos jurÃ­dicos e adequaÃ§Ã£o de integraÃ§Ãµes.
  - 9 decisÃµes estratÃ©gicas pendentes documentadas.

### 02/07/2026 - 11:10
- **Acesso PÃºblico Ã  Proposta Comercial:**
  - CorreÃ§Ã£o na pÃ¡gina de impressÃ£o/proposta [page.tsx](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/print/quotation/%5Bid%5D/page.tsx) para buscar dados atravÃ©s da API pÃºblica quando o usuÃ¡rio nÃ£o estiver autenticado (cliente final acessando pelo link do e-mail).
  - Mapeamento dinÃ¢mico dos dados para manter compatibilidade com o formato esperado pelo layout de renderizaÃ§Ã£o.

### 02/07/2026 - 10:40
- **AutomaÃ§Ã£o Completa de Disparos de E-mail (Gmail API):**
  - AdaptaÃ§Ã£o do helper [whatsapp.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/lib/notifications/whatsapp.ts) para despachar e-mails automaticamente pelo Gmail sempre que houver e-mail cadastrado para o cliente.
  - CriaÃ§Ã£o de templates de e-mail em HTML premium para NPS, OrÃ§amentos, CobranÃ§as e Garantias.
  - IntegraÃ§Ã£o do envio automÃ¡tico de proposta na API de OrÃ§amentos [route.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/api/quotations/%5Bid%5D/route.ts) ao mudar o status para `'enviado'` apontando para a rota de impressÃ£o pÃºblica.
  - AtualizaÃ§Ã£o dos crons (`nps-reminders`, `payment-reminders`, `warranty-expiry-check`, `quotation-expiry-check`) para passarem o e-mail do cliente.
  - CriaÃ§Ã£o de validador de layouts de e-mail [test_notifications.js](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/test_notifications.js).

### 02/07/2026 - 09:25
- **IntegraÃ§Ã£o Gmail API via OAuth 2.0 (Abordagem Profissional):**
  - InstalaÃ§Ã£o da dependÃªncia oficial `googleapis` no projeto `frontend`.
  - CriaÃ§Ã£o do helper [gmail.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/lib/gmail.ts) para gerenciar a autenticaÃ§Ã£o e renovaÃ§Ã£o automÃ¡tica de tokens do Google.
  - ImplementaÃ§Ã£o das rotas administrativas de setup: `/api/auth/google/login` e `/api/auth/google/callback` para geraÃ§Ã£o e captura do `refresh_token` offline.
  - CriaÃ§Ã£o do endpoint `/api/email/test` e do script standalone [test_gmail.js](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/test_gmail.js) para validaÃ§Ã£o local de chaves de ambiente.
  - Adicionados campos de exemplo no [.env.example](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/.env.example).

### 01/07/2026 - 17:15
- **IntegraÃ§Ã£o Pagamento & NPS & CorreÃ§Ãµes UX:**
  - **Invoice Avulso:** Schema Prisma ajustado para tornar a relaÃ§Ã£o com `Quotation` opcional, e webhook de aprovaÃ§Ã£o de pagamentos refatorado para criar automaticamente Invoices de faturamento a partir de pagamentos independentes.
  - **Pesquisas NPS Pendentes:** Criado endpoint `/api/nps/pending` e integrado na interface para listar clientes com pagamentos aprovados recentes que ainda nÃ£o receberam avaliaÃ§Ã£o NPS, com funcionalidade de envio via WhatsApp.
  - **UX Premium & Sidebar:** Redesign completo da Dashboard do NPS com Glassmorphism, badges modernos e tab layout. Removido o salto indesejado de pÃ¡gina da Sidebar com a propriedade `scroll={false}` nos links do Next.js.

### 01/07/2026 - 16:15
- **EvoluÃ§Ã£o e Melhoria Completa no MÃ³dulo NPS:**
  - **Endpoint PÃºblico e Seguro:** A API de POST do NPS ([route.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/api/nps/route.ts)) agora aceita submissÃµes anÃ´nimas dos clientes, validando no banco se o `clientId` existe de fato para proteger a seguranÃ§a do endpoint.
  - **Layout de FormulÃ¡rio DinÃ¢mico:** Enriquecida a pÃ¡gina de pesquisa do cliente ([page.tsx - Survey](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/survey/[id]/page.tsx)) com checkboxes de mÃºltiplos motivos dinÃ¢micos baseados na nota (Promotor, Neutro, Detrator) e botÃ£o para avaliar no Google.
  - **VisualizaÃ§Ã£o Visual no Dashboard:** O histÃ³rico administrativo de avaliaÃ§Ãµes ([page.tsx - Dashboard](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/(dashboard)/nps/page.tsx)) agora parseia os feedbacks estruturados do banco de dados e exibe os motivos como tags coloridas no histÃ³rico.
  - **CorreÃ§Ã£o da URL no Cron:** Ajustado o redirecionamento dinÃ¢mico no cron de WhatsApp para apontar para a rota pÃºblica `/survey/[id]`.

### 01/07/2026 - 15:50
- **Varredura e AnÃ¡lise de Sistemas, IntegraÃ§Ãµes e AutomaÃ§Ãµes:**
  - Realizada varredura completa do banco de dados, APIs de transaÃ§Ãµes comerciais, fluxos de compras e webhooks de pagamento.
  - Identificada falta de incremento de estoque na entrada fÃ­sica de peÃ§as ([receive/route.ts](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/api/purchase-orders/[id]/receive/route.ts)) e inconsistÃªncia operacional no webhook de pagamentos do Mercado Pago em relaÃ§Ã£o ao Asaas.
  - Criado o relatÃ³rio detalhado de insights e diagramas de automaÃ§Ã£o em [analise_sistemas_e_automacoes.md](file:///C:/Users/jc-pr/.gemini/antigravity-ide/brain/59422ff7-e0d6-414b-8d98-832d4c7184e6/analise_sistemas_e_automacoes.md).

### 01/07/2026 - 15:45
- **Melhoria e Polimento â€” CalendÃ¡rio DinÃ¢mico de TransiÃ§Ã£o Mensal:**
  - **IdentificaÃ§Ã£o da OmissÃ£o de Dados:** O Dashboard e os RelatÃ³rios Financeiros filtravam os dados de faturamento baseando-se estritamente no "MÃªs CalendÃ¡rio Corrente" (julho de 2026). Como todos os dados reais foram inseridos no mÃªs anterior (junho de 2026), as telas apareciam vazias ou zeradas logo no dia 1Âº de julho.
  - **CalendÃ¡rio DinÃ¢mico de 10 Dias:** Adicionada uma inteligÃªncia nas APIs `/api/dashboard/route.ts` e `/api/reports/route.ts` para que, nos primeiros 10 dias de cada mÃªs, o perÃ­odo padrÃ£o de exibiÃ§Ã£o retroceda automaticamente para englobar o inÃ­cio do mÃªs anterior. Isso mantÃ©m as telas com dados ricos e histÃ³rico recente sempre visÃ­veis de forma polida.
  - **Deploy de ProduÃ§Ã£o:** Commit e push realizados, deploy de produÃ§Ã£o finalizado e validado na Vercel com os dados reais de junho carregando corretamente.

### 01/07/2026 - 15:25
- **Hotfix de ProduÃ§Ã£o â€” Auditoria e RestauraÃ§Ã£o de Banco (Neon):**
  - **IdentificaÃ§Ã£o do Erro:** O deploy anterior com enums no schema gerou erros no Postgres do Neon (`type "public.ServiceOrderStatus" does not exist`) em todas as rotas de carregamento de dados em produÃ§Ã£o, impedindo a exibiÃ§Ã£o de registros e gerando falha 500 no dashboard, OS, pagamentos, financeiro, faturamento, despesas e relatÃ³rios.
  - **RestauraÃ§Ã£o do Schema (String):** Revertemos o `schema.prisma` para usar tipos `String` nos campos de status de forma a manter compatibilidade estÃ¡vel com o Neon de produÃ§Ã£o. As validaÃ§Ãµes de integridade continuam ativas a nÃ­vel de cÃ³digo no arquivo centralizado `lib/status-map.ts`.
  - **Auditoria e ConfirmaÃ§Ã£o de Dados:** Criado um endpoint temporÃ¡rio de auditoria que confirmou a existÃªncia e integridade de todos os dados reais no Neon (JosÃ© Carlos, Jocemar, OS-0001, OS-0002, orÃ§amentos, faturas, etc.). Todos os dados estÃ£o seguros e visÃ­veis.
  - **Deploy de ProduÃ§Ã£o Final:** Removido o endpoint de teste e executado o deploy de produÃ§Ã£o final bem-sucedido na Vercel. Todas as telas voltaram a funcionar instantaneamente com os dados recuperados.

### 01/07/2026 - 14:50
- **EstabilizaÃ§Ã£o do DomÃ­nio & CorreÃ§Ãµes CrÃ­ticas (Fase 1):**
  - **Prisma Schema e Banco de Dados:** Criados enums nativos (`QuotationStatus`, `ServiceOrderStatus`, `PaymentStatus`, `InvoiceStatus`, `PurchaseOrderStatus`, `ExpenseStatus`, `AppointmentStatusModel`) e atualizados os modelos no `schema.prisma`. SincronizaÃ§Ã£o executada com sucesso via `db push`.
  - **P0-1: NormalizaÃ§Ã£o de Status de Pagamento:** Webhook Asaas e relatÃ³rios consolidados no status `confirmado`. Webhook Asaas emite faturas com status `emitida` (nÃ£o `gerada`).
  - **P0-2: Dashboard Sync:** APIs e UI corrigidos para exibir status `em_execucao` em vez de `em_progresso` para ordens de serviÃ§o ativas.
  - **P0-3: Quotation View:** Removido o status legado `'approved'` no frontend, padronizando em `'aceito'`.
  - **P0-5: Purchase Order History:** Ajustado gÃªnero de `'recebido'` para `'recebida'`.
  - **P0-7: Kanban de OrÃ§amentos:** Inserida coluna `'cancelado'` com cor e label correspondentes no fluxo do Kanban.
  - **UnificaÃ§Ã£o de AutenticaÃ§Ã£o e Whitelist:**
    - Corrigido bypass crÃ­tico no cron SLA-Check por meio do helper `verifyCronSecret()` que exige configuraÃ§Ã£o obrigatÃ³ria do token.
    - Adicionada autenticaÃ§Ã£o em rotas Ã³rfÃ£s: `cron/sla`, `appointments/[id]`, `appointments/[id]/status`, `appointments/conflicts`, `appointments/technician/[id]/week`, `reviews/summary` e `reviews/technician/[id]`.
    - Implementado whitelist de campos em `appointments/[id]` contra mass-assignment (`APPOINTMENT_ALLOWED_FIELDS`).
    - Analytics real (sem mocks) implementado no banco sob autenticaÃ§Ã£o JWT.
  - **RemoÃ§Ã£o de Prisma Client MÃºltiplos:** Todos os 14 arquivos que instanciavam `new PrismaClient()` migrados para usar a instÃ¢ncia global `@/lib/prisma`.
  - **Ledger Financeiro Consistente:** Campo `balance` em `FinancialTransaction` calculado a partir do histÃ³rico de saldo anterior da conta.
  - **STATUS-MAP:** Criados `lib/status-map.ts` e `docs/STATUS-MAP.md` servindo como documentaÃ§Ã£o oficial.

### 29/06/2026 - 13:58
- **HomologaÃ§Ã£o e Deploy de ProduÃ§Ã£o Final na Vercel:**
  - **RemoÃ§Ã£o de Prisma db push no build time da Vercel:** Resolvida a falha de build remoto no pipeline da Vercel ao remover a execuÃ§Ã£o de `db push` em tempo de compilaÃ§Ã£o remota, o que gerava erros de pooling e timeout ao conectar Ã  base Neon de Washington. A migraÃ§Ã£o foi executada localmente de forma segura e o build remoto passou a rodar em 50s.
  - **URL de ProduÃ§Ã£o Ativa:** Publicado em produÃ§Ã£o sob a URL: `https://clickmarido-ativo-frontend.vercel.app`.
  - **Walkthrough Gerado:** Criado [walkthrough.md](file:///C:/Users/jc-pr/.gemini/antigravity-ide/brain/ca3e09eb-ea98-4e87-bf30-c652a6b0e8aa/walkthrough.md) na pasta de artefatos consolidando todas as mudanÃ§as.

### 29/06/2026 - 13:50
- **ReestruturaÃ§Ã£o Completa do Kanban, Drawer Comercial e Cockpit de Insights:**
  - **Kanban Curto de 7 Etapas (`pre-vendas/page.tsx`):** Kanban remodelado com base no funil de qualificaÃ§Ã£o curto. Cada card agora exibe prioridade (ALTA, MEDIA, BAIXA), temperatura (incluindo indicador vermelho pulsante `URGENTE`), valor previsto do lead, prÃ³xima aÃ§Ã£o comercial programada, SLA de atendimento, idade do lead, responsÃ¡vel e botÃµes de aÃ§Ãµes rÃ¡pidas (ajuste de prioridade e qualificaÃ§Ã£o transacional direta).
  - **LeadDetailsDrawer Expandido com Metodologias:**
    - Criada a nova aba **"Qualificar"** no Drawer lateral.
    - Integrados formulÃ¡rios interativos para as principais metodologias de vendas do mercado: **BANT**, **CHAMP**, **GPCT** e **SPIN Selling**.
    - Salva as respostas no objeto JSON `qualificationData` e recalcula em tempo real o score de qualificaÃ§Ã£o do lead no banco.
  - **Ajustes Finais de Insights de BI (`insights/page.tsx`):**
    - GrÃ¡fico de funil adaptado para exibir as novas 7 etapas oficiais, colorindo em verde a barra final `Encaminhado OrÃ§amento`.
    - GrÃ¡fico de temperatura atualizado para contemplar o novo status `URGENTE` com cor vermelha nas fatias e legendas, removendo a antiga chave `PRONTO_ORCAMENTO`.
  - **Auditoria de CRM Local (`test_crm_flow.js`):** Script de testes atualizado e executado com **100% de sucesso**, validando todas as transaÃ§Ãµes, geraÃ§Ã£o automÃ¡tica de proposta em rascunho com nÃºmero sequencial e timeline histÃ³rica de eventos de leads.

### 29/06/2026 - 13:40
- **ReestruturaÃ§Ã£o e ConsolidaÃ§Ã£o da Arquitetura Funcional de CRM & PrÃ©-Vendas:**
  - **APIs de CRM Completas:** Implementadas rotas reais de transaÃ§Ã£o no backend:
    - `POST /api/leads` (criaÃ§Ã£o manual com registro em histÃ³rico).
    - `POST /api/leads/bulk` (importaÃ§Ã£o sequencial em lote/CSV).
    - `PUT /api/leads/[id]` (atualizaÃ§Ã£o de estÃ¡gio, responsÃ¡vel, status e perda comercial com auditoria de eventos).
    - `/api/leads/[id]/followup`, `/api/leads/[id]/appointment` e `/api/leads/[id]/events` (cadastro de interaÃ§Ãµes, agendamentos e carregamento da timeline).
    - `POST /api/leads/[id]/qualify` (qualificaÃ§Ã£o de lead: cria cliente, gera proposta em rascunho vinculada, avanÃ§a etapa para proposta solicitada e vincula os IDs no banco).
  - **CorreÃ§Ã£o P0 de Params AssÃ­ncronos no Next.js (Moderno):** Ajustados todos os handlers de rotas dinÃ¢micas de leads (`[id]`) para aguardar a resoluÃ§Ã£o da Promise `params` (`const { id } = await params`) antes de acessar suas propriedades, eliminando o erro 500 do Prisma.

### 29/06/2026 - 13:20
- **ResoluÃ§Ã£o de Erro de ProduÃ§Ã£o (401 Unauthorized) nos MÃ³dulos de CRM:**
  - **IdentificaÃ§Ã£o do Erro:** O middleware (`proxy.ts` configurado no Next.js) bloqueia chamadas de API sem cabeÃ§alho `Authorization: Bearer <token>`. Injetados tokens JWT via hook `useAuth` nas pÃ¡ginas do Kanban (`pre-vendas/page.tsx`) e Insights (`insights/page.tsx`), resolvendo a quebra.

### 29/06/2026 - 13:00
- **PadronizaÃ§Ã£o, Polimento e Enriquecimento Completo de PrÃ©-Vendas e Insights:**
  - **API Real de CRM (`/api/leads/insights/route.ts`):** Rota adicionada para calcular e expor estatÃ­sticas comerciais reais do banco.
  - **Cockpit Comercial de Insights (`insights/page.tsx`):** Transformado em painel gerencial rico com grÃ¡ficos Recharts responsivos de funil, origens e descarte, dotados de contraste dinÃ¢mico para modo escuro.

### 27/06/2026 - 21:05
- **CorreÃ§Ã£o na CriaÃ§Ã£o de Ordens de Compra (`/purchases/new`):**
  - A API (`POST /api/purchase-orders/route.ts`) foi ajustada para aceitar tanto o ID Ãºnico (`cuid`) quanto a numeraÃ§Ã£o amigÃ¡vel do orÃ§amento (`number`) ao realizar os vÃ­nculos.

### 27/06/2026 - 19:56
- **EstratificaÃ§Ã£o Visual do MÃ³dulo de Despesas:**
  - ImplementaÃ§Ã£o de funcionalidade de "ExpansÃ£o de Linha" (Expandable Row) na tabela principal de Despesas (`expenses/page.tsx`).

### 27/06/2026 - 19:10
- **Auditoria Funcional, UX e Deploy Final (Fase 5 e Fase 6):**
  - **RevisÃ£o de UX e Acessibilidade:** O layout de RelatÃ³rios e do Dashboard foi polido para garantir leitura rÃ¡pida.

### 27/06/2026 - 16:05
- **Auditoria e Ajuste do MÃ³dulo Financeiro (Solo Mode):**
  - IntegraÃ§Ã£o da DRE com o Livro Caixa (`FinancialTransaction`), resolvendo a divergÃªncia crÃ­tica (P0) entre saldos do Dashboard e relatÃ³rios mensais.

### 26/06/2026 - 16:45
- **CorreÃ§Ã£o da Quebra no MÃ³dulo de OrÃ§amentos (Kanban e Detalhes):**
  - Corrigido o erro fatal que impedia a renderizaÃ§Ã£o da listagem de orÃ§amentos devido Ã  chamada direta de `.toFixed(2)` em propriedades do tipo `Decimal` (convertidos com `Number(...)`).

### 02/07/2026 - 16:48
- **Melhorias no Fluxo da Ordem de ServiÃ§o:**
  - Criado o `StartServiceOrderModal.tsx` para exibiÃ§Ã£o detalhada antes do inÃ­cio.
  - Implementada funcionalidade de atribuir outro tÃ©cnico na hora do "Iniciar".
  - Adicionada etapa obrigatÃ³ria de **Checklist** no momento de concluir a OS (`ServiceOrderForm.tsx`).
  - Atualizadas as rotas `/api/service-orders/[id]/start` e `/complete` no backend.
  - Deploy efetuado.

## TODOs / PrÃ³ximos Passos
- [x] Implementar incremento automÃ¡tico de estoque fÃ­sico do produto ao registrar recebimento de itens na Ordem de Compra.
- [x] Padronizar webhook Mercado Pago para concluir a OS correspondente ao confirmar o pagamento (alinhado com o webhook Asaas).
- [x] Criar rotina para envio automÃ¡tico de pesquisa de satisfaÃ§Ã£o NPS via WhatsApp 24 horas apÃ³s conclusÃ£o do faturamento do serviÃ§o.
- [x] Configurar credenciais do Google Cloud e refresh token para envio de e-mails via Gmail API.
- [ ] Conectar API de novos leads com Webhooks externos de landing pages.
- [ ] Implementar templates automÃ¡ticos de WhatsApp a cada transiÃ§Ã£o de etapa do lead.

 # # #   0 2 / 0 7 / 2 0 2 6   -   1 7 : 0 8 
 -   * * A t u a l i z a ç ã o   d o   D a s h b o a r d   e   R e g r a s   d e   D i s p a r o   d e   N P S : * * 
     -   O   p a i n e l   d e   N P S   a g o r a   e x i b e   a   a v a l i a ç ã o   e s p e c í f i c a   d o   t é c n i c o   e   o   n ú m e r o   d a   O S   v i n c u l a d a   a   c a d a   f e e d b a c k . 
     -   A   l ó g i c a   d e   p e n d ê n c i a s   ( a p i / n p s / p e n d i n g )   e   d o   c r o n   ( a p i / c r o n / n p s - r e m i n d e r s )   f o i   a t u a l i z a d a   p a r a   s e   b a s e a r   n a   d a t a   d e   c o n c l u s ã o   d a   O r d e m   d e   S e r v i ç o   ( m í n i m o   2 4   h o r a s ) ,   n ã o   m a i s   n o   p a g a m e n t o .   A   a b a   \  
 P e s q u i s a s  
 P e n d e n t e s \   r e f l e t e   i s s o . 
     -   O   d i s p a r o   d a   p e s q u i s a   a g o r a   e m b u t e   n a   U R L   o s   I D s   d a   O S   e   d o   t é c n i c o ,   g a r a n t i n d o   o   v í n c u l o   n o   b a c k e n d   a o   s e r   r e s p o n d i d a . 
     -   O   d i s p a r o   i n s t a n t â n e o   a p ó s   b a i x a   d a   f a t u r a   ( w e b h o o k )   f o i   r e m o v i d o .  
 
### 02/07/2026 - 17:55
- **Auditoria de UI e Tecla ESC:**
  - **useEscapeToClose:** Aplicado e verificado em todos os modais do dashboard para permitir fechamento via tecla ESC.
  - **Excluir:** Opção de Excluir adicionada com Modal de Confirmação em Telas que não possuíam, como Técnicos e Ordens de Serviço.

- **[02/07/2026 - 18:25]:** Auditoria e padronização dos modais: Adicionado fechamento via ESC para os modais que faltavam (Service Orders, Product Picker, Proposta), adicionada rota de exclusão (DELETE) na API de Garantias e adicionado o botão de Excluir na interface de Garantias. Testes de build realizados e código atualizado no repositório (Git Push).
  - Arquivos modificados: frontend/app/(dashboard)/pre-vendas/page.tsx, frontend/app/(dashboard)/service-orders/page.tsx, frontend/app/(dashboard)/warranties/page.tsx, frontend/app/print/quotation/[id]/page.tsx, frontend/components/leads/LeadCardRich.tsx, frontend/components/leads/LeadDetailsDrawer.tsx, frontend/components/quotations/ProductPicker.tsx, frontend/app/api/warranties/[id]/route.ts
