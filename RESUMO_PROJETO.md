# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais

- **Status Atual:** Fase 6 (Expansão, Escala e Segurança) concluída. Sistema 100% integrado e operacional.
- **Objetivo Central:** CRM para serviços residenciais (com suporte multi-user)
- **Última Atualização:** 24/06/2026 - 12:55
- **Stack Final:** Next.js 15 + Prisma + PostgreSQL (Neon) na Vercel + Evolution API Local (WhatsApp) + Google Drive Service Account (Mídias) + Expo Updates (EAS)

## Arquitetura Final

```
Frontend (Next.js 15)
    ↓
API Routes (Next.js)
    ↓
Prisma ORM
    ↓
PostgreSQL (Neon)
    ↓
Vercel (Deploy)
```

**Por que esta arquitetura?**
- Simples: tudo em um repo
- Escalável: pode adicionar workers depois
- Barato: Vercel free tier + Neon free tier
- Rápido: serverless, zero ops

## Funcionalidades Implementadas

- [x] Autenticação JWT (admin único)
- [x] CRUD Customers (clientes)
- [x] CRUD Quotations (orçamentos)
- [x] R(ead) Warranties (garantias)
- [x] Validações com Zod
- [x] Banco de dados persistente
- [x] Ordens de Serviço manuais e links dinâmicos
- [x] Pagamentos avulsos e cobrança via WhatsApp
- [x] Fluxo completo de acionamento de garantias gerando reparo de R$ 0,00
- [x] Módulo Financeiro completo (Controle de saldos, faturas e despesas)

- [x] Geração de PDF Premium (A4)
- [x] WhatsApp Hub Local (Evolution API de graça)
- [x] Dashboard de Auditoria & NPS
- [x] Multi-User & Gerenciamento de Usuários
- [x] Upload de Fotos no Google Drive (Service Account)
- [x] Relatórios e Faturamentos Avançados

## Histórico de Evolução

### 24/06/2026 - 12:12
- **Melhorias no WhatsApp Hub Local:**
  - **Auto-criação de Instância:** Implementada a auto-criação automática da instância `clickmarido_instance` caso ela não exista no Docker local.
  - **Correção da API Key:** Ajustado o comando Docker e recriado o container local usando a variável `AUTHENTICATION_API_KEY=clickmarido_key` correta, substituindo a antiga variável inválida `AUTH_API_KEY` para evitar erros de autenticação 401 Unauthorized.
  - **Layout Estilo WhatsApp:** Refatorado o visual da tela de Chat para imitar o WhatsApp Web (avatares com iniciais coloridas, balões de conversa verde/branco com cantos personalizados, fundo clássico e barra de input arredondada).
  - **Ordenação Inteligente:** Implementada a ordenação de conversas por quantidade de não lidas e data decrescente de atividade (mais recentes no topo). As mensagens dentro do chat agora são ordenadas de forma cronológica estrita crescente com rolagem automática para a mensagem mais recente.
  - Arquivos modificados: [page.tsx](file:///c:/Users/jc-pr/.gemini/antigravity/scratch/clickmarido/frontend/app/(dashboard)/chat/page.tsx)

### 24/06/2026 - 14:00
- **Implementação da Fase 6 (Expansão, Escala e Segurança) Concluída:**
  - **Pilar 1: PDFs Premium (A4):** Redesenhadas por completo as páginas de impressão de OS (`print/service-order/[id]/page.tsx`) e Orçamentos (`print/quotation/[id]/page.tsx`) com visual executivo premium, fontes Outfit/Inter, selo gráfico de garantia de 90 dias e assinatura digital SVG do cliente.
  - **Pilar 2: WhatsApp Hub Local (Zero-Cost):** Refatorado `lib/notifications/whatsapp.ts` direcionando os envios automáticos para a Evolution API local de graça, convertendo os antigos templates da Meta para texto formatado em português.
  - **Pilar 3: Suporte Multi-User:** Desenvolvidos endpoints API `/api/users` e `/api/users/[id]` e a tela visual de controle administrativo `/users` (UsersPage) permitindo CRUD de colaboradores com proteção de nível de cargo (admin/manager). Adicionado o link "Usuários" na Sidebar lateral.
  - **Pilar 4: Upload no Google Drive via Service Account:** Refatorado `lib/google-drive.ts` para autenticação com Service Account via JWT assinado com `crypto` nativo, ajustando o endpoint `/api/upload` para enviar buffers direto para o Drive e retornar a URL curta, com fallback Base64.
  - **Correções de Tipos:** Injetada a declaração ausente de `decodeToken` na rota global de OS.

### 24/06/2026 - 09:50
- **Saneamento de Segurança Crítica Concluído:**
  - Removida senha estática codificada (`Millena@@2017@@`) do script `seed-users.js` e substituída pela variável de ambiente `SEED_ADMIN_PASSWORD` com fallback seguro.
  - Atualizado `.env.example` com a documentação da nova chave.
  - Atualizado o status de segurança e os bloqueios em `REGISTRO_IMPLEMENTACAO.md` como resolvidos.
  - Executados testes de build de produção (`npm run build`) e testes Jest (100% PASS, 17 testes bem-sucedidos).
  - Enviadas as alterações de configuração remota móvel (EAS/Expo) e segurança para o repositório remoto.

### 24/06/2026 - 11:47
- **Deploy de Produção Web (Vercel) Concluído**:
  - Compilação estática do Next.js executada remotamente pela Vercel com 100% de sucesso.
  - O aplicativo frontend já está atualizado e funcional na URL de produção.
  - **Deploy Mobile (Expo):** Aplicativo compilado via `eas build` para Android e publicado na nuvem via `eas update` (OTA) para utilização definitiva no iOS via Expo Go.

### 24/06/2026 - 01:00
- **Implementação Completa da Fase 5 (Nível 5 — Ambição) Concluída**:
  - **App Móvel Nativo (Técnico em Campo):** Criado projeto Expo SDK 56 na pasta `/mobile` com suporte offline automático via AsyncStorage e sincronização em lote. Criadas telas de Login, Agenda e Detalhes da OS integrada a mapas, checklist, câmera de evidências e lousa de assinatura digital vetorial SVG. Refatoradas APIs do backend para retorno dinâmico de `technicianId` e suporte a assinatura/checklists em PATCH/POST de conclusão de OS.
  - **IA para Estimativa de Preço:** Desenvolvido motor estatístico local em `lib/ai/pricing-engine.ts` que analisa o histórico amostral de orçamentos ou hora técnica padrão, com ajustes heurísticos para urgências, riscos e facilidades. Criado o endpoint `/api/ai/estimate-price` e integrado o botão **✨ IA** no formulário de novos orçamentos.
  - **Testes e Build:** Desenvolvida cobertura de testes unitários Jest em `__tests__/lib/pricing-engine.test.ts` (100% de sucesso). Build de produção compilado com 100% de sucesso.

### 24/06/2026 - 00:40
- **Implementação Completa da Fase 4 (Nível 4 — Interações & Pós-Venda) Concluída**:
  - **Módulo de Conversas (Chat):** Tela `/chat`, hook `useMessages` e API `/api/messages` integrados ao `MessageLog` e envio manual por WhatsApp.
  - **Módulo de Pós-Venda (NPS):** Desenvolvida a página pública mobile-friendly `/survey/[id]` para o cliente votar anonimamente. Criada a tela administrativa de controle de NPS em `/nps` com gráficos Recharts e lista de avaliações. Criada API `/api/nps/customer/[id]` e adicionada a automação `service-order-completed.ts` para disparar a notificação de WhatsApp com o link do NPS quando a OS for concluída.
  - **Módulo de Auditoria (AuditLog):** Criada a biblioteca `lib/audit.ts` e o hook `useAudit`. Injetado o `logAudit` nos fluxos e endpoints críticos de criação/edição/exclusão de Orçamentos, OS (incluindo start/complete), Pagamentos e nos webhooks de confirmação de pagamento do Asaas e Mercado Pago. Desenvolvida a tela `/audit` com timeline e visualizador JSON interativo de oldValue/newValue.
  - **Validação e Ajustes:** Corrigidos tipos de retorno estritos das API Routes para `: Promise<Response>` e corrigidas propriedades semânticas dos componentes. Compilação estática (`npm run build`) concluída com 100% de sucesso.

### 24/06/2026 - 00:30
- **Início da Fase 4 (Nível 4 — Interações & Pós-Venda) e Deploy de Homologação**:
  - Implementado o módulo de Conversas/Chat: criada tela `/chat` e endpoints `/api/messages` integrados ao `MessageLog` e `sendWhatsAppNotification`.
  - Instaladas dependências necessárias `react-hot-toast` e `swr` no frontend.
  - Criado o hook `hooks/useMessages` e ajustado o tipo de retorno das rotas de API para Promise<Response> para sanar bugs do compilador de tipos do Next.js.
  - Correção nas propriedades do `TableShimmer` e na chamada do hook `useEscapeToClose` no ChatPage.
  - Criado o hook `hooks/useNPS` e rotas de base em `/api/nps` preparando a infraestrutura de pós-venda.
  - Sucesso de 100% no build local do Next.js. Deploy intermediário sendo enviado para a Vercel.

### 23/06/2026 - 23:30
- **Implementação Completa da Fase 3 (Nível 3 — Médio) Concluída**:
  - Modelagem do modelo `CompanySettings` para salvar dados cadastrais, valor de hora técnica e comissões da Click Marido.
  - Criado o endpoint `/api/settings` e a página `/settings` para gerenciamento das taxas e configurações da empresa.
  - Desenvolvida a página de Relatórios Avançados (`/reports`) com gráficos Recharts para Fluxo de Caixa Diário e Produtividade de Técnicos.
  - Criada API `/api/reports` para agregação de dados e exportação de relatórios em CSV.
  - Implementado layout nativo de impressão formatada em A4 para Ordens de Serviço (OS) e Orçamentos usando CSS Media Print e `window.print()`.
  - Execução bem-sucedida do build de produção com TypeScript 100% correto e deploy efetuado no GitHub.

### 23/06/2026 - 23:20
- **Implementação Completa da Fase 2 (Nível 2 — Alto Impacto) Concluída**:
  - Dashboard operacional com gráficos Recharts exibindo faturamento semanal, status de OS, receita por categorias e performance de técnicos.
  - Assinatura digital com Canvas integrada ao fluxo de finalização das Ordens de Serviço (OS).
  - Lançamento de consumo de peças e abatimento de estoque automático com alertas de estoque baixo no encerramento de OS.
  - Gravação automática de logs persistentes de mensagens enviadas via WhatsApp (`MessageLog`).
  - Execução bem-sucedida do build de produção (`npm run build`) com zero erros.

### 23/06/2026 - 23:10
- **Planejamento da Fase 2 (Nível 2 — Alto Impacto) Elaborado**:
  - Detalhamento do plano técnico englobando gráficos estatísticos, logs e triggers de WhatsApp, assinatura digital com canvas no local, cadastro de serviços ampliado e estoque de materiais.
  - Criação do arquivo de plano oficial na conversa.

### 23/06/2026 - 22:50
- **Melhorias Financeiras e Operacionais (Fases 1-8) Concluídas**:
  - Implementação de fechamento de modais com Escape (ESC) utilizando hook customizado.
  - Modelagem e integração da categoria FERRAMENTAS em Produtos e centros de custo no banco de dados.
  - Correção dos cálculos de saldos e despesas na Dashboard Financeira.
  - Implementação completa do CRUD de despesas (edição e exclusão).
  - Correção de métodos HTTP ausentes (DELETE e PUT) para orçamentos e pagamentos.

### 23/06/2026 - 18:38
- **Auditoria da Fase 1 (Nível 1 — Crítico)**:
  - Realizada auditoria completa dos 10 itens do Nível 1 no `REGISTRO_IMPLEMENTACAO.md`, confrontando com a estrutura física de arquivos, banco Neon e rotas de API.

### 22/06/2026 - 16:55
- **Criação do Plano de Varredura e Melhorias Financeiro-Operacional**:
  - Mapeamento e elaboração do plano detalhado em `implementation_plan.md` abrangendo o fechamento de modais com Escape (ESC), modelagem de ferramentas e centros de custo no Prisma e no Neon, dinamicidade do painel financeiro sem cache, faturamento e baixa de faturas manuais, CRUD de despesas completo e correções de aprovação de pagamentos.

### 22/06/2026 - 16:37
- **Deploy de Produção via CI/CD**:
  - Todas as alterações locais foram commitadas (`cdbd601`) e enviadas (`git push origin main`) para o repositório GitHub (`jc8702/clickmarido-ativo`).
  - O push acionou de forma automática a compilação e deploy da versão estável na Vercel (Produção).

### 22/06/2026 - 16:35
- **Implementação do Atrelamento de Fornecedores a SKUs e Timeline de Compras**:
  - Atualizado o schema do Prisma com relacionamento `Product <-> Vendor` e executado o push no PostgreSQL do Neon.
  - Modificadas as APIs REST de produtos para salvar `vendorId` e retornar dados estruturados do fornecedor.
  - Desenvolvida a API `/api/products/[id]/purchase-history` para agregar o histórico de ordens de compra e logs de auditoria do SKU.
  - Modificado o `ProductForm` adicionando a seleção de fornecedor e a criação rápida inline de fornecedores com salvamento dinâmico sem perda de estado.
  - Criado o `ProductDetailsDrawer` com estatísticas financeiras de compra (total, custo médio, margem bruta de lucro e último preço pago) e a timeline visual conectando eventos cronológicos do SKU.
  - Adicionado o botão "Histórico" na `ProductTable` para acionamento do Drawer de detalhes.
  - Executada a compilação do Next.js via `npm run build` com sucesso absoluto (TypeScript e compilação de páginas 100%).
  - Arquivos modificados/criados: `schema.prisma`, `product.schema.ts`, `api/products/route.ts`, `api/products/[id]/route.ts`, `api/products/[id]/purchase-history/route.ts`, `ProductForm.tsx`, `ProductTable.tsx`, `ProductDetailsDrawer.tsx`, `products/page.tsx` e `walkthrough.md`.

### 22/06/2026 - 16:17
- **Deploy de Produção Concluído**:
  - Executado o build e deploy na Vercel com sucesso absoluto.
  - URL de Produção: https://clickmarido-ativo-frontend.vercel.app
  - Verificação de logs sem erros na plataforma de execução em Washington, D.C. (iad1).

### 22/06/2026 - 16:13
- **Implementação Completa do Módulo de Compras e Fornecedores**:
  - Modelagem de dados via Prisma Schema e sincronização com o banco Neon Postgres (`PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderEvent`, novos campos em `Vendor`).
  - Criação de APIs REST sob `/api/vendors` e `/api/purchase-orders` (incluindo sub-rotas `/emit`, `/approve`, `/receive`, `/cancel`).
  - Geração automática de despesas financeiras (`Expense`) ao aprovar OCs e controle transacional rígido (bloqueio de compras para fornecedores inativos ou bloqueados).
  - Implementação de layouts responsivos com tema escuro e componentes reutilizáveis utilizando react-hook-form e Zod.
  - Correção de bugs de tipagem no compilador estático do Next.js e compilação de produção com 100% de sucesso.
  - Arquivos modificados/criados: `schema.prisma`, `VendorForm.tsx`, `VendorPurchaseHistory.tsx`, `useVendors.ts`, `usePurchaseOrders.ts`, `walkthrough.md` e `task.md`.

### 22/06/2026 - 15:48
- **Diagnóstico e Mapeamento de Skills do Módulo de Compras:**
  - Análise profunda do `PLANO_IMPLEMENTACAO_MODULO_COMPRAS.md`.
  - Mapeamento das skills de engenharia, arquitetura e interface necessárias para implementar o módulo integrado de Compras.

### 22/06/2026 - 15:20
- **Implantação de Cron Jobs Adicionais e Automações:**
  - Criado o cron job de verificação de expiração de garantias (`/api/cron/warranty-expiry-check`).
  - Criado o cron job de acompanhamento e expiração de orçamentos (`/api/cron/quotation-expiry-check`).
  - Criado o cron job de fechamento de relatório diário (`/api/cron/daily-report`).
  - Adicionado gatilho de notificação WhatsApp automática ao técnico quando associado a uma OS em `PUT /api/service-orders/[id]/route.ts`.
  - Adicionado fluxo de faturamento automático (criação de `Invoice` e vínculo ao pagamento) ao webhook Asaas (`/api/webhooks/asaas/route.ts`).
  - Sucesso 100% na compilação estática de tipos e build (`npm run build`).

### 22/06/2026 - 15:10
- **Implantação de Navegação Lateral (Sidebar) e Automações Backend:**
  - Criado o componente `Sidebar.tsx` vertical e integrado globalmente no `layout.tsx` do dashboard.
  - Movidas as pastas de `warranties` e `profile` para dentro de `(dashboard)` para compartilhar layout e proteção.
  - Removidos imports e chamadas de `<Navigation />` redundantes em todas as 11 telas operacionais.
  - Schema do Prisma atualizado (modelo `AuditLog` e campos de status/automações em `Payment`, `ServiceOrder`, `Quotation`, `Warranty`) e atualizado no banco Neon via `db push`.
  - Criado singleton do Prisma Client em `lib/prisma.ts`.
  - Desenvolvido utilitário de WhatsApp (`notifications/whatsapp.ts`).
  - Implementada a automação para auto-criar pagamentos ao concluir ordens de serviço (`automations/service-order-completed.ts`).
  - Desenvolvidos endpoints de Cron Job (`api/cron/payment-reminders`) e Webhook Asaas (`api/webhooks/asaas`).
  - Criada configuração de cron-schedule em `vercel.json`.
  - Validação estática completa e sucesso no build de produção (`npm run build`).

### 22/06/2026 - 15:00
- **Planejamento do Refactor de UI/UX e Automações:**
  - Mapeamento das mudanças para migrar a barra superior (Navigation) para Sidebar lateral esquerda.
  - Planejamento de automações (OS completa -> Payment automático, lembretes de cobrança via Cron da Vercel, webhook receptor do Asaas para PIX).
  - Definição do novo schema do Prisma (AuditLog e campos de automações) e singleton do Prisma Client.
  - Criação do plano de implementação oficial na conversa.

### 22/06/2026 - 13:41
- Implantação e integração do Módulo Financeiro:
  - **Prisma Schema:** Adicionados os modelos `Invoice`, `Expense`, `Vendor`, `FinancialTransaction` e `AccountBalance`. Criada e sincronizada a estrutura no banco Neon.
  - **Navegação Global:** Adicionados links e ícones para as páginas Financeiro, Faturamento e Despesas.
  - **Frontend:** Desenvolvidas as interfaces `/financial`, `/invoices` e `/expenses` com suporte completo ao tema escuro e integradas ao Design System.
  - **APIs:** Sincronizadas as rotas de faturamento, despesas, fornecedores e relatórios financeiros.
  - **Build Estático:** Validação e build estático do Next.js compilados com sucesso.
- Arquivos modificados/criados: `schema.prisma`, `Navigation.tsx`, `financial/page.tsx`, `invoices/page.tsx`, `expenses/page.tsx` e `webhook-mp/route.ts`.

### 21/06/2026 - 18:14
- Conclusão da Revitalização UX/UI e Integração Diamante de todos os módulos operacionais:
  - **Ordens de Serviço:** Adicionado botão de criação manual de OS (POST backend e modal frontend) e links inteligentes direcionando para Clientes e Orçamentos originais com gavetas automáticas.
  - **Pagamentos:** Criada rota POST e modal de recebimentos manuais avulsos. Integrado botão dinâmico **Cobrar via WhatsApp** no modal de PIX que carrega dados do cliente e envia mensagem pré-formatada.
  - **Garantias:** Criada rota de acionamento `/api/warranties/[id]/claim` no backend e implementado modal frontend que coleta notas de falha e gera uma OS automática de R$ 0,00 agendada.
  - **Build Estático:** Rodado `npm run build` com sucesso absoluto e sem erros de tipagem/compilação TypeScript.
- Arquivos modificados/criados: `CreateServiceOrderForm.tsx`, `CreatePaymentForm.tsx`, `warranties/page.tsx`, `service-orders/page.tsx`, `payments/page.tsx`, `PaymentForm.tsx`, `api/service-orders/route.ts`, `api/payments/route.ts`, `api/warranties/[id]/claim/route.ts` e `tareas.md`.

### 21/06/2026 - 17:55
- Inicialização da Fase de Revitalização Visual e Integração Funcional de todos os Módulos:
  - Diagnóstico de falha de loop de render (piscamento) nas páginas de Clientes e Orçamentos devido a referências instáveis do `getToken` e requisições concorrentes de `mutate()`.
  - Mapeamento de melhorias visuais com foco em estética premium, glassmorphism e micro-animações (eliminando visual "de IA").
  - Planejamento de novas integrações de ações e botões: criação de OS automática no acionamento de garantias, registro de recebimentos avulsos em pagamentos e criação rápida de ordens manuais.
  - Planejamento de novos campos e informações adicionais para o cadastro de clientes e orçamentos (garantia, prazos, descontos, forma de pagamento).
  - Arquivos modificados/criados: `plan_implementacion.md` (local), `tareas.md` (local) e `implementation_plan.md` (oficial da conversa).

### 21/06/2026 - 17:35
- Integração dinâmica de dados e autenticação funcional no Dashboard:
  - Criação da rota de API `/api/dashboard/route.ts` que calcula dados reais da base (faturamentos, quantidade de clientes, taxa de conversão baseada em orçamentos, últimas ordens e ranking de serviços requisitados).
  - Substituição do e-mail de teste fixo `admin@clickmarido.local` por dados reais do usuário autenticado (`jose@clickmarido.local`) e ativação da função de logout funcional (`onLogout={logout}`) na barra de navegação superior global de todas as 6 páginas da dashboard.
  - Ajuste de tipagem do TypeScript com casts de segurança (`user as { email: string }`) nas páginas `.tsx` para garantir compilação bem-sucedida do compilador estático do Next.js.
  - Testes do fluxo completo (login, painel integrado de dados e logout funcional) executados com sucesso em produção na Vercel.

### 21/06/2026 - 17:25
- Evolução de módulos ocultos e unificação da navegação global:
  - Adicionado suporte a todos os 6 módulos do CRM (Dashboard, Clientes, Orçamentos, Ordens de Serviço, Pagamentos, Garantias) no menu superior global `<Navigation>`.
  - Adicionado redirecionamento no cabeçalho clicável do usuário para a tela de Perfil (`/profile`).
  - Criação da página `/service-orders/page.tsx` em TypeScript e remoção de arquivo legado `.jsx`.
  - Criação da página `/payments/page.tsx` em TypeScript e remoção do arquivo legado `.jsx`.
  - Correção de erro 404 no faturamento implementando os endpoints `/api/payments`, `/api/payments/[id]/generate-pix` e `/api/payments/[id]/approve`.
  - Ajuste visual e integração ao Design System no módulo `/warranties/page.tsx` consumindo dados da API de garantias.
  - Correção de bugs de tipagem do TypeScript expostos no compilador do Next.js (como tipagem de ID cuid de string para o form de OS).
  - Sucesso 100% no build estático final do Next.js (`npm run build`).

### 21/06/2026 - 17:20
- Realização de auditoria de navegabilidade e integridade dos módulos do CRM:
  - Identificação de módulos ocultos na barra de navegação principal (Ordens de Serviço, Pagamentos, Garantias, Perfil).
  - Diagnóstico de falha crítica (Erro 404) no módulo de Pagamentos devido à falta do endpoint de API correspondente e ausência de tabela no Prisma.
  - Proposta de plano de ação para integrar todos os módulos na navegação, migrar componentes de visualização legados de `.jsx` para `.tsx` e criar APIs dinâmicas para permitir o funcionamento completo da tela de Pagamentos.
  - Arquivos modificados/criados: `plan_implementacion.md` (local), `tareas.md` (local) e `implementation_plan.md` (oficial da sessão).

### 21/06/2026 - 16:50
- Correção do erro 404 ao tentar acessar rotas inexistentes `/dashboard/customers`:
  - Corrigidos os redirecionamentos pós-login em `useAuth.js` e `page.tsx` (redirecionando agora para `/dashboard`).
  - Ajustados os links de navegação da barra global de `/` para `/dashboard` (evitando loops e conflitos).
  - Corrigido o redirecionamento pós-cadastro de cliente em `new/page.tsx` para `/customers`.
- Resolução dos pontos de atenção identificados na auditoria:
  - Remoção de duplicidade de layouts de raiz (`layout.jsx` removido e unificado em `layout.tsx`).
  - Remoção de componentes legados não utilizados (`Navbar.jsx` e `Sidebar.jsx`).
  - Migração para TypeScript e redesign visual de `ServiceOrderForm` e `PaymentForm` (agora `.tsx` alinhados ao Design System).
- Validação completa do build de produção com sucesso (`npm run build`).

### 21/06/2026 - 16:30
- Inicialização do plano de auditoria do redesign UX/UI.
- Mapeamento de Skills necessárias e criação do Squad de Experts.
- Criação dos artefatos locais `tareas.md` e `plan_implementacion.md`.

### v1.0.0 (20/06/2026) - Launch
- Next.js 15 + Prisma setup
- Autenticação JWT
- CRUD operacional
- Documentação

## Environment Variables

| Variável | Descrição |
|----------|-----------|
| DATABASE_URL | PostgreSQL (Neon) - connection string |
| JWT_SECRET | Chave para assinar tokens JWT |
| NEXT_PUBLIC_API_URL | URL base da API (http://localhost:3000 dev, https://... prod) |

## Como Rodar

### Local
```bash
npm install
npm run dev
# Acesso: http://localhost:3000
```

## Performance

- **First Contentful Paint:** ~1.5s (Vercel)
- **Database Query:** ~50ms (Neon)
- **API Response:** ~150ms (incluindo DB)

## Custo Mensal (Estimado)

- Vercel: $0 (free tier)
- Neon: $0 (free tier 2GB)
- Total: $0 (até escalar)

## Próximos Passos

1. **Deploy em Produção**: Garantir que as últimas alterações de melhorias do financeiro e operacional estejam refletidas na Vercel.
2. **Homologação e Testes**: Validar o fluxo de despesas e os cálculos da dashboard com dados reais.
3. **Módulo de Relatórios**: Iniciar planejamento de relatórios avançados ou PDF generation (se necessário).

---

**Documentação gerada automaticamente. Atualizar conforme mudanças.**
