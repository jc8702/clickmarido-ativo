# RESUMO DE PROJETO: Click Marido CRM

## Informações Gerais
- **Status Atual:** Melhorias no PDF da Proposta e Orçamentos Concluídas. Exibição completa de SKU, itens, descrição, impostos estimados por item, soma de impostos aproximados, logo no cabeçalho, logo em marca d'água de fundo e campo de Observações/Escopo funcional na criação/edição.
- **Objetivo Central:** Migrar o Módulo WhatsApp para a nova arquitetura sem perder funcionalidades antigas como geração de orçamento integrado e seleção de contatos.
- **Última Atualização:** 26/06/2026 - 16:30

## Histórico de Alterações

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
- [ ] Integrar mais templates para notificações transacionais (se necessário).

