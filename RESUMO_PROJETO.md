# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais
- **Status Atual:** Auditoria e simplificação do Módulo Financeiro concluídas (Solo Operation). Descolamento de DRE vs Livro Caixa resolvido e deploy realizado.
- **Objetivo Central:** Migrar o Módulo WhatsApp e adequar os relatórios financeiros para a operação "Solo".
- **Última Atualização:** 27/06/2026 - 16:05

## Histórico de Alterações

### 27/06/2026 - 21:05
- **Correção na Criação de Ordens de Compra (`/purchases/new`):**
  - Resolvido o erro fatal que impedia a criação de Ordens de Compra através do formulário.
  - A API (`POST /api/purchase-orders/route.ts`) foi ajustada para aceitar tanto o ID único (`cuid`) quanto a numeração amigável do orçamento (`number`) ao realizar os vínculos de Orçamento e Ordem de Serviço, realizando a conversão automaticamente no backend.
  - Adicionado retorno claro de erro quando o vínculo (Orçamento/OS) não for encontrado.

### 27/06/2026 - 19:56
- **Estratificação Visual do Módulo de Despesas:**
  - Atualização da API de Despesas (`/api/expenses`) para retornar os detalhes dos itens das Ordens de Compra (`purchaseOrders`) vinculadas, juntamente com os detalhes do produto e SKU.
  - Implementação de funcionalidade de "Expansão de Linha" (Expandable Row) na tabela principal de Despesas (`expenses/page.tsx`).
  - Criação de uma subtabela renderizada condicionalmente para mostrar os itens que compõem a despesa: SKU destacado, nome/descrição, quantidade, valor unitário e subtotal, permitindo uma análise rápida sem poluir a visão global.

### 27/06/2026 - 19:10
- **Auditoria Funcional, UX e Deploy Final (Fase 5 e Fase 6):**
  - **Revisão de UX e Acessibilidade:** O layout de Relatórios e do Dashboard foi polido para garantir leitura rápida. Remoção completa de gráficos inúteis para a operação individual ("Performance de Técnicos").
  - **Correção da Fonte de Verdade:** Todos os dados agregados no dashboard e relatório agora consultam diretamente o Livro Caixa (`financial_transactions`), eliminando os riscos apontados na Fase 2 de divergências em orçamentos, faturamentos e despesas manuais.
  - **Sincronização de Banco (Prisma):** Executado `prisma db push` garantindo que a infraestrutura esteja preparada para os lançamentos.
  - **Validação de Build (Deploy):** Executado `npm run build` confirmando ausência de erros estáticos (`.toFixed` seguros e compatibilidade do TypeScript OK).
  
#### Relatório Final de Auditoria (Fase 6)
- **Achado 1 [P0]: Divergência de Fonte de Dados Financeiros**
  - *Evidência:* Relatórios somavam "Pagamentos" e "Despesas" diretamente das entidades filhas, enquanto o Dashboard e Contas somavam do Livro Caixa (FinancialTransaction).
  - *Impacto:* Valores mostrados diferiam caso houvesse despesa sem nota ou lançamento avulso.
  - *Correção Realizada:* Rota `/api/reports/route.ts` reescrita para consumir exclusivamente de `FinancialTransaction`.
  - *Validação:* Dados consolidados estritamente no nível da transação real.
- **Achado 2 [P1]: Poluição Visual por Métricas de Equipe (Comissão/Técnicos)**
  - *Evidência:* O sistema projetava descontos irreais no "Lucro Líquido" assumindo comissões de técnico de 40%, o que não reflete a operação de um homem só.
  - *Impacto:* A rentabilidade real da empresa e do esforço era ofuscada.
  - *Correção Realizada:* Variáveis de comissão foram removidas de `api/reports/route.ts` e do `reports/page.tsx`. Gráficos de performance técnica removidos do `/api/dashboard/route.ts`.
  - *Validação:* Interface focada apenas nas Entradas, Saídas, Margem Limpa e Custos de Materiais.

### 27/06/2026 - 16:05
- **Auditoria e Ajuste do Módulo Financeiro (Solo Mode):**
  - Integração da DRE com o Livro Caixa (`FinancialTransaction`), resolvendo a divergência crítica (P0) entre saldos do Dashboard e relatórios mensais.
  - Remoção de todos os blocos visuais e lógicas fantasmas de "Comissão" e "Produtividade de Técnicos" no `reports/route.ts` e `reports/page.tsx` para adequação à operação individual (Solo).
  - Adição da coluna "Categoria" na exportação CSV do relatório, resgatando dados do Livro Caixa + Despesas para conciliação contábil externa.
  - Ajustes pontuais de UI (eliminação de gráficos obsoletos e ajuste da grade principal).
- **Correção da Quebra na Criação/Edição de Orçamentos e Catálogo de Itens:**
  - Corrigido o erro fatal que quebrava as páginas `/quotations/new` e `/quotations/[id]` ao buscar itens do catálogo de produtos e ao adicionar itens manuais.
  - Blindados os componentes `ItemsBuilder.tsx`, `ProductPicker.tsx` e `QuotationItemsTable.tsx` contra problemas de tipo com campos `Decimal` retornados como strings do banco de dados (convertidos adequadamente com `Number(...)` antes de operações de cálculo e `.toFixed(2)`).
  - Arquivos modificados: `frontend/components/quotations/ItemsBuilder.tsx`, `frontend/components/quotations/ProductPicker.tsx`, `frontend/components/quotations/QuotationItemsTable.tsx`

### 26/06/2026 - 16:45
- **Correção da Quebra no Módulo de Orçamentos (Kanban e Detalhes):**
  - Corrigido o erro fatal que impedia a renderização da listagem de orçamentos devido à chamada direta de `.toFixed(2)` em propriedades do tipo `Decimal` (que são recebidas como string no JSON). As chamadas foram blindadas com `Number(...)`.
  - Atualizada a rota `GET /api/quotations` para incluir `items` e `product` no Prisma `include`, possibilitando a exibição correta dos itens e seus respectivos detalhes no Drawer de visualização do Kanban.
  - Arquivos modificados: `frontend/app/(dashboard)/quotations/page.tsx`, `frontend/app/(dashboard)/quotations/view/ClientPage.tsx`, `frontend/app/api/quotations/route.ts`

### 26/06/2026 - 16:30
- **Melhorias no PDF da Proposta e Suporte a Observações e Logos:**
  - Adicionado o campo Observações (`notes`) na validação do schema e nos formulários de criação e edição de orçamentos.
  - Criada a pasta `frontend/public` e copiado o arquivo de logo oficial (`logo.jpg`).
  - Implementada a renderização da logo oficial no cabeçalho do PDF da proposta.
  - Implementada a marca d'água estilizada no fundo do PDF da proposta com opacidade de `0.035`.
  - Corrigido o mapeamento de itens no PDF para exibir SKU, título correto do item, descrição detalhada e preço/subtotal corretos (não zerados).
  - Adicionado o cálculo de impostos estimados por item (5% ISS para serviço e 12% ICMS para peças) e exibição do total de impostos estimados no resumo (Lei 12.741/12).
  - Arquivos modificados: `frontend/lib/validations/quotation.schema.ts`, `frontend/app/(dashboard)/quotations/new/ClientPage.tsx`, `frontend/app/(dashboard)/quotations/[id]/EditClientPage.tsx`, `frontend/app/print/quotation/[id]/page.tsx`
  - Arquivos criados: `frontend/public/logo.jpg`

### 25/06/2026 - 00:00
- **Restauração do Fluxo "Aprovar Orçamento → Enviar WhatsApp":**
  - Corrigida a função `handleApprove` em `quotations/page.tsx`: agora ao aprovar, redireciona para a página de print com parâmetros `autoDownload=true&redirectToChat=<phone>`, que gera o PDF, salva no `localStorage` e redireciona automaticamente para o chat com a mensagem preconfigurada e PDF anexado.
  - Corrigido bug de inconsistência `sessionStorage` vs `localStorage` na página de print (`print/quotation/[id]/page.tsx`), que impedia o `WhatsAppContainer` de encontrar o PDF salvo.
  - Corrigido método HTTP `PATCH` → `PUT` no `handleApproveAndSend` da página de print (a API route só exporta GET/PUT/DELETE).
  - Arquivos modificados: `quotations/page.tsx`, `print/quotation/[id]/page.tsx`

### 25/06/2026 - 00:15
- **Correção Crítica no Formato de Payload da Evolution API (v1.8.x):**
  - Identificado que o envio de mensagens (texto e PDF) falhava silenciosamente com erro `400 Bad Request` devido a payload desatualizado.
  - Atualizado `WhatsAppContainer.tsx` para enviar mensagens usando `textMessage: { text }` e `mediaMessage: { ... }`.
  - Atualizado `ChatArea.tsx` para o mesmo padrão e corrigido prop `INSTANCE_NAME` que estava ausente, impedindo chamadas corretas à API.
  - Arquivos modificados: `components/whatsapp/WhatsAppContainer.tsx`, `components/whatsapp/chat/ChatArea.tsx`

### 24/06/2026 - 23:45
- **BugFixes e Refinamentos Críticos (WhatsApp):**
  - Correção do bug onde "ao clicar no contato do CRM nada carrega": Implementada a geração de um "Chat Virtual" (virtual conversation) dentro do `WhatsAppContainer.tsx` sempre que um contato é clicado e não há histórico na Evolution API, resolvendo o problema da tela ficar em branco.
  - Correção da integração com tela de Orçamentos ("Quando gero orçamento e aprovo ele não abre mais o chat"): Re-inserida a lógica de leitura dos parâmetros de URL (`searchParams` via `useSearchParams` do `next/navigation`).
  - O sistema agora lê os parâmetros `phone`, `text`, e `autoAttach`, permitindo envio de PDF gerado no cache local de forma transparente via API da Evolution (`/message/sendMedia`) e limpando os parâmetros da URL para evitar loops.
  - Adicionado `Suspense` no `page.tsx` para permitir o hook `useSearchParams` com Next.js App Router (Turbopack).
  - Build testado com sucesso (TypeScript + Turbopack validado).

### 24/06/2026 - 23:25
- **Integração Real Evolution API no WhatsApp Clone (Fase 3):**
  - Todo o estado do `old_chat.tsx` foi migrado com sucesso para o `WhatsAppContainer.tsx`.
  - Remoção de arquivos temporários e limpeza da árvore do git.

## TODOs / Próximos Passos
- [x] Corrigir inicialização de novos chats via sidebar do CRM.
- [x] Corrigir integração de envio de orçamento automático (`autoAttach` + searchParams).
- [x] Realizar deploy para produção na Vercel (via GitHub push).
- [x] Restaurar fluxo "Aprovar Orçamento → Chat WhatsApp com PDF anexado".
- [x] Corrigir bug de renderização/toFixed no Kanban de Orçamentos e nos formulários de criação/edição.
- [ ] Integrar mais templates para notificações transacionais (se necessário).

