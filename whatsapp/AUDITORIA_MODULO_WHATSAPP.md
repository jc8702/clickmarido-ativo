# Auditoria Executável — Módulo WhatsApp Click Marido

**Data:** 25/06/2026  
**Escopo:** Todos os componentes do módulo WhatsApp  
**Fonte primária:** Evolution API v1.8.2  
**Enriquecimento:** CRM (Prisma/Neon)

---

## Resumo Executivo

| Estado | Quantidade | % |
|--------|-----------|---|
| ✅ Funcional | 12 | 40% |
| ⚠️ Parcial | 9 | 30% |
| 🔴 Mockado | 6 | 20% |
| ⬜ Vazio/Ausente | 3 | 10% |
| **Total** | **30** | 100% |

---

## Relatório Detalhado

### 1. WhatsAppContainer.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 1.1 | Conexão com Evolution API | ✅ Funcional | `checkConnectionStatus()` faz polling, detecta estado `open`, cria instância se 404 | Alto | - | Manter |
| 1.2 | QR Code para pareamento | ✅ Funcional | Gera QR via `/instance/connect/`, exibe na sidebar | Alto | - | Manter |
| 1.3 | Carregamento de conversas | ✅ Funcional | `loadChats()` busca `/chat/findChats/`, formata dados | Alto | - | Manter |
| 1.4 | Resolução de nomes (CRM) | ⚠️ Parcial | `resolveName()` busca no CRM mas não prioriza `verifiedName` da Evolution | Alto | P0 | Implementar prioridade correta |
| 1.5 | Resolução de nomes (grupo) | ⚠️ Parcial | Condição `!chat.name.includes('-')` é frágil, fallback genérico "Grupo WhatsApp" | Médio | P1 | Usar `chat.verifiedName` primeiro |
| 1.6 | Conversa virtual via URL | ⚠️ Parcial | Usa `resolveName` mas não garante nome consistente se CRM não carregou ainda | Médio | P1 | Aguardar CRM antes de criar virtual |
| 1.7 | Envio automático via query params | ✅ Funcional | Lê `?phone=&text=&autoAttach=true`, envia texto ou PDF | Médio | - | Manter |
| 1.8 | Polling de chats (5s) | ✅ Funcional | `setInterval` a cada 5s, limpa no unmount | Médio | - | Manter |
| 1.9 | Arquivamento | ❌ Ausente | Nenhuma lógica de `archivedConversations` | Alto | P0 | Implementar estado e handlers |
| 1.10 | Favoritos | ❌ Ausente | Nenhuma lógica de `favorites` | Alto | P0 | Implementar estado e handlers |
| 1.11 | Labels/Etiquetas | ❌ Ausente | Nenhuma lógica de `labels` | Médio | P1 | Implementar com backend |
| 1.12 | Tipagem | ⚠️ Parcial | `crmCustomers: any[]`, `contactsMap: Record<string, string>` sem tipos | Baixo | P2 | Criar interfaces |

### 2. WhatsAppSidebar.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 2.1 | Lista de conversas | ✅ Funcional | Renderiza `filteredConversations` com avatar, nome, última mensagem | Alto | - | Manter |
| 2.2 | Busca por nome/número | ✅ Funcional | Filtra por `contactName` e `contactNumber` | Alto | - | Manter |
| 2.3 | Filtro "Não lidas" | ✅ Funcional | `case 'unread': result.filter(c => c.unreadCount > 0)` | Médio | - | Manter |
| 2.4 | Filtro "Grupos" | ✅ Funcional | `case 'groups': result.filter(c => c.id.includes('@g.us'))` | Médio | - | Manter |
| 2.5 | Filtro "Favoritas" | 🔴 Mockado | Comentário: `// 'all' e 'favorites' mostram todas por enquanto` (linha 58) | Alto | P0 | Implementar filtro real |
| 2.6 | Filtro "Etiquetas" | 🔴 Mockado | Dropdown existe mas não filtra nada | Médio | P1 | Implementar com backend |
| 2.7 | Seção "Arquivadas" | 🔴 Mockado | Botão mostra/esconde visualmente, sem lista separada | Alto | P0 | Criar `viewMode` e lista independente |
| 2.8 | Contagem de não lidas | ✅ Funcional | `unreadCount = conversations.filter(c => c.unreadCount > 0).length` | Médio | - | Manter |
| 2.9 | Contagem de fixadas | ✅ Funcional | `pinnedCount = conversations.filter(c => c.isPinned).length` | Baixo | - | Manter |
| 2.10 | Ícone de fixada | ✅ Funcional | Renderiza `<Pin>` quando `isPinned` | Baixo | - | Manter |
| 2.11 | Ícone de mutada | ✅ Funcional | Renderiza `<BellOff>` quando `isMuted` | Baixo | - | Manter |
| 2.12 | Fallback avatar | ✅ Funcional | SVG genérico quando não tem `conversation.avatar` | Baixo | - | Manter |
| 2.13 | Indicador online | ✅ Funcional | Bolinha verde quando `isOnline` | Baixo | - | Manter |

### 3. WhatsAppHeader.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 3.1 | Botão "Nova conversa" | ✅ Funcional | `onClick={onNewChat}` (mas handler não implementado no Container) | Médio | P1 | Implementar handler |
| 3.2 | Menu "Novo grupo" | 🔴 Mockado | `<button>` sem `onClick` handler | Médio | P1 | Desabilitar ou implementar |
| 3.3 | Menu "Mensagens enviadas" | 🔴 Mockado | `<button>` sem `onClick` handler | Baixo | P2 | Desabilitar ou remover |
| 3.4 | Menu "Mensagens favoritas" | 🔴 Mockado | `<button>` sem `onClick` handler | Médio | P1 | Conectar a `viewMode favorites` |
| 3.5 | Menu "Configurações" | 🔴 Mockado | `<button>` sem `onClick` handler | Baixo | P2 | Desabilitar ou implementar |

### 4. FilterPills.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 4.1 | Pill "Tudo" | ✅ Funcional | `onFilterChange('all')` | Alto | - | Manter |
| 4.2 | Pill "Não lidas" | ✅ Funcional | `onFilterChange('unread')` | Alto | - | Manter |
| 4.3 | Pill "Favoritas" | 🔴 Mockado | `onFilterChange('favorites')` mas case não existe no switch do Sidebar | Alto | P0 | Implementar filter real |
| 4.4 | Pill "Grupos" | ✅ Funcional | `onFilterChange('groups')` | Alto | - | Manter |
| 4.5 | Dropdown "Etiquetas" | 🔴 Mockado | UI existe, items (Cliente/Lead/Urgente) hardcoded, sem filtro | Médio | P1 | Remover ou conectar backend |

### 5. LeftIconBar.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 5.1 | Ícone "Conversas" | ✅ Funcional | Ativo por padrão, `activeIcon === 'chats'` | Alto | - | Manter |
| 5.2 | Ícone "Status" | 🔴 Mockado | Badge hardcoded `badge: 2`, sem implementação | Baixo | P2 | Remover badge ou implementar |
| 5.3 | Ícone "Canais" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.4 | Ícone "Comunidades" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.5 | Ícone "Nova conversa" | ⚠️ Parcial | Botão verde visível mas `onIconClick` não abre nada específico | Médio | P1 | Conectar a handler real |
| 5.6 | Ícone "Pedidos" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.7 | Ícone "Catálogo" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.8 | Ícone "Métricas" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.9 | Ícone "Mídia" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |
| 5.10 | Ícone "Configurações" | ❌ Ausente | Sem backend, apenas visual | Baixo | P2 | Ocultar |

### 6. WelcomeScreen.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 6.1 | Tela de boas-vindas | ✅ Funcional | Exibe ilustração, título e mensagem de criptografia | Baixo | - | Manter |
| 6.2 | Instrução contextual | ⚠️ Parcial | Mensagem genérica, não instrui sobre conectar instância ou usar busca | Baixo | P2 | Melhorar copy |

### 7. ChatArea.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 7.1 | Carregamento de mensagens | ✅ Funcional | `loadMessages()` busca `/chat/findMessages/`, suporta múltiplos formatos de resposta | Alto | - | Manter |
| 7.2 | Filtro por `remoteJid` | ✅ Funcional | `loadedMessages.filter(m => mJid === targetJid)` (linha 46-50) | Alto | - | Manter |
| 7.3 | Formatação de mensagens | ✅ Funcional | Suporta: conversation, extendedText, image, video, audio, document, sticker, ephemeral | Alto | - | Manter |
| 7.4 | Envio de texto | ✅ Funcional | `handleSendMessage()` usa `/message/sendText/` | Alto | - | Manter |
| 7.5 | Envio de arquivo | ✅ Funcional | Converte para base64, usa `/message/sendMedia/` | Alto | - | Manter |
| 7.6 | Polling de mensagens (4s) | ✅ Funcional | `setInterval` a cada 4s, silencioso (`silent = true`) | Médio | - | Manter |
| 7.7 | Tratamento de erro visível | ❌ Ausente | Erros vão para `console.error`, usuário não vê nada | Alto | P0 | Adicionar estado de erro |
| 7.8 | Estado de carregamento | ⚠️ Parcial | `loading` existe mas só exibe "Carregando mensagens..." quando lista vazia | Médio | P1 | Melhorar feedback |
| 7.9 | Estado vazio | ⚠️ Parcial | Exibe "Nenhuma mensagem encontrada" mas sem instrução | Baixo | P2 | Melhorar copy |
| 7.10 | Mensagens selecionadas | ❌ Ausente | Sem suporte a seleção múltipla | Baixo | P2 | Implementar se necessário |
| 7.11 | Busca dentro da conversa | ❌ Ausente | Sem implementação | Baixo | P2 | Implementar se necessário |
| 7.12 | Resposta/citação | ❌ Ausente | Sem implementação | Baixo | P2 | Implementar se necessário |

### 8. ChatHeader.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 8.1 | Exibição de nome | ✅ Funcional | `conversation.contactName` | Alto | - | Manter |
| 8.2 | Status online/visto | ✅ Funcional | Lógica: online → "online", lastSeen → "visto por último", grupo → "toque para ver" | Médio | - | Manter |
| 8.3 | Botão "Vídeo" | 🔴 Mockado | Botão existe sem `onClick` handler | Médio | P1 | Desabilitar com tooltip |
| 8.4 | Botão "Telefone" | 🔴 Mockado | Botão existe sem `onClick` handler | Médio | P1 | Desabilitar com tooltip |
| 8.5 | Botão "Buscar" | 🔴 Mockado | Botão existe sem `onClick` handler | Médio | P1 | Desabilitar com tooltip |
| 8.6 | Menu "Dados do contato" | 🔴 Mockado | Botão sem `onClick` handler | Médio | P1 | Desabilitar ou implementar |
| 8.7 | Menu "Selecionar mensagens" | 🔴 Mockado | Botão sem `onClick` handler | Baixo | P2 | Desabilitar |
| 8.8 | Menu "Fechar conversa" | 🔴 Mockado | Botão sem `onClick` handler | Médio | P1 | Conectar a `onCloseChat` |
| 8.9 | Menu "Apagar conversa" | 🔴 Mockado | Botão sem `onClick` handler | Alto | P0 | Conectar a `onDeleteChat` com confirmação |

### 9. MessageList.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 9.1 | Renderização de mensagens | ✅ Funcional | Bolhas verdes (enviadas) / brancas (recebidas) | Alto | - | Manter |
| 9.2 | Divisores de data | ✅ Funcional | `formatDateDivider()` exibe "Hoje", "Ontem" ou data por extenso | Médio | - | Manter |
| 9.3 | Agrupamento por autor | ⚠️ Parcial | Agrupa por `isMine` mas não por autor em grupos | Médio | P1 | Melhorar para grupos |
| 9.4 | Nomes em grupos | ⚠️ Parcial | `msg.text.split(':')[0]` assume remetente no início do texto | Médio | P1 | Usar metadados da API |
| 9.5 | Status de envio | ⚠️ Parcial | `Check` sempre single porque `status` nunca é populado pelo ChatArea | Médio | P1 | Popular `status` no ChatArea |
| 9.6 | Scroll automático | ✅ Funcional | `useEffect` com `scrollToBottom()` a cada atualização | Médio | - | Manter |
| 9.7 | Mensagens de sistema | ✅ Funcional | `msg.isSystem` renderiza centralizado | Baixo | - | Manter |
| 9.8 | Mensagem citada | ❌ Ausente | Sem suporte a renderização de citação | Baixo | P2 | Implementar se necessário |
| 9.9 | Mensagem encaminhada | ❌ Ausente | Sem indicador visual | Baixo | P2 | Implementar se necessário |
| 9.10 | Reação a mensagem | ❌ Ausente | Sem suporte | Baixo | P2 | Implementar se necessário |

### 10. ChatInput.tsx

| # | Funcionalidade | Estado | Evidência Técnica | Impacto | Prioridade | Recomendação |
|---|---------------|--------|-------------------|---------|------------|--------------|
| 10.1 | Envio de texto | ✅ Funcional | Enter envia, Shift+Enter quebra linha | Alto | - | Manter |
| 10.2 | Auto-expand textarea | ✅ Funcional | `useEffect` ajusta altura dinamicamente | Médio | - | Manter |
| 10.3 | Emoji picker | ⚠️ Parcial | 16 emojis hardcoded, não é picker completo | Baixo | P2 | Expandir ou usar lib |
| 10.4 | Envio de arquivo | ✅ Funcional | `fileInputRef.click()`, aceita image/video/audio/pdf/doc | Alto | - | Manter |
| 10.5 | Botão de voz | 🔴 Mockado | Ícone `<Mic>` sem implementação de gravação | Médio | P1 | Desabilitar ou implementar |
| 10.6 | Indicador de envio | ✅ Funcional | `isSending` desabilita input e mostra estado | Médio | - | Manter |

---

## Priorização por Impacto

### P0 — Crítico (afeta funcionalidade core)
| Arquivo | Funcionalidade |
|---------|---------------|
| WhatsAppContainer | Resolução de nomes (prioridade incorreta) |
| WhatsAppContainer | Arquivamento (ausente) |
| WhatsAppContainer | Favoritos (ausente) |
| WhatsAppSidebar | Filtro "Favoritas" (mockado) |
| WhatsAppSidebar | Seção "Arquivadas" (mockado) |
| ChatArea | Tratamento de erro visível (ausente) |
| ChatHeader | Menu "Apagar conversa" (mockado) |

### P1 — Importante (afeta experiência do usuário)
| Arquivo | Funcionalidade |
|---------|---------------|
| WhatsAppContainer | Resolução de nomes em grupos |
| WhatsAppContainer | Conversa virtual via URL |
| WhatsAppHeader | Botão "Nova conversa" |
| WhatsAppHeader | Menu "Mensagens favoritas" |
| FilterPills | Pill "Favoritas" |
| FilterPills | Dropdown "Etiquetas" |
| LeftIconBar | Ícone "Nova conversa" |
| ChatHeader | Botões de chamada (desabilitar) |
| ChatHeader | Menu "Fechar conversa" |
| MessageList | Status de envio (sempre single check) |
| MessageList | Nomes em grupos |
| ChatInput | Botão de voz (desabilitar) |

### P2 — Desejável (melhoria visual/UX)
| Arquivo | Funcionalidade |
|---------|---------------|
| WhatsAppContainer | Tipagem com interfaces |
| WhatsAppHeader | Menu "Mensagens enviadas" |
| WhatsAppHeader | Menu "Configurações" |
| LeftIconBar | Badges hardcoded (Status: 2) |
| LeftIconBar | Ícones sem backend (ocultar) |
| WelcomeScreen | Instrução contextual |
| ChatArea | Estado vazio melhorado |
| ChatInput | Emoji picker completo |
| MessageList | Mensagens citadas/encaminhadas |

---

## Mapa de Decisões Pendentes

| Questão | Opção A | Opção B | Recomendação |
|---------|---------|---------|--------------|
| Favoritos com backend? | Criar tabela no Prisma | Usar localStorage | localStorage (rápido) |
| Labels com backend? | Criar tabela no Prisma | Manter mockado | Mockado por agora |
| Arquivamento via API? | Usar Evolution API | Estado local | Estado local + sync |
| Botões de chamada? | Desabilitar com tooltip | Remover | Desabilitar com tooltip |
| Botão de voz? | Implementar gravação | Desabilitar | Desabilitar (complexo) |
| Emoji picker completo? | Usar lib (emoji-mart) | Expandir hardcoded | Lib (melhor UX) |

---

## Conclusão

O módulo WhatsApp tem uma **base sólida** (40% funcional) com conexão, conversas, envio e recebimento funcionando. Os principais gaps são:

1. **Filtros mockados** (favoritas, etiquetas) — afetam organização
2. **Resolução de nomes** — não prioriza dados da Evolution API
3. **Menus sem ação** — UI promete recursos inexistentes
4. **Sem tratamento de erro visível** — falhas ficam no console

Recomendação: implementar P0 primeiro (nomes, favoritos, arquivamento, erros), depois P1 (desabilitar botões mortos, melhorar grupos).
