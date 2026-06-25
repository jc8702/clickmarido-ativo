# Roadmap de Pendências — Módulo WhatsApp

**Última atualização:** 25/06/2026

---

## Resumo

| Categoria | Pendências | Requer Backend |
|-----------|-----------|----------------|
| Funcionalidades removidas | 6 | Sim |
| Botões desabilitados | 5 | Parcial |
| Melhorias visuais | 4 | Não |
| **Total** | **15** | |

---

## 1. Funcionalidades que precisam de Backend

### 1.1 Favoritos
- **O que:** Salvar conversas como favoritas e filtrar por elas
- **Onde:** WhatsAppSidebar, FilterPills, WhatsAppContainer
- **Schema sugerido:**
  ```prisma
  model WhatsAppFavorite {
    id        String   @id @default(cuid())
    phone     String
    userId    String
    createdAt DateTime @default(now())
    @@unique([phone, userId])
  }
  ```
- **Endpoints necessários:**
  - `POST /api/whatsapp/favorites` — adicionar/remover
  - `GET /api/whatsapp/favorites` — listar favoritos do usuário
- **Esforço:** Baixo

### 1.2 Arquivamento
- **O que:** Mover conversas para "Arquivadas" e listar separadamente
- **Onde:** WhatsAppSidebar, WhatsAppContainer
- **Schema sugerido:**
  ```prisma
  model WhatsAppArchived {
    id        String   @id @default(cuid())
    phone     String
    userId    String
    archivedAt DateTime @default(now())
    @@unique([phone, userId])
  }
  ```
- **Endpoints necessários:**
  - `POST /api/whatsapp/archive` — arquivar/desarquivar
  - `GET /api/whatsapp/archived` — listar arquivadas
- **Esforço:** Baixo

### 1.3 Etiquetas/Labels
- **O que:** Criar etiquetas (Cliente, Lead, Urgente) e associar a conversas
- **Onde:** FilterPills, WhatsAppSidebar
- **Schema sugerido:**
  ```prisma
  model WhatsAppLabel {
    id     String @id @default(cuid())
    name   String
    color  String
    userId String
  }

  model WhatsAppConversationLabel {
    id        String @id @default(cuid())
    phone     String
    labelId   String
    userId    String
    @@unique([phone, labelId, userId])
  }
  ```
- **Endpoints necessários:**
  - `GET/POST/DELETE /api/whatsapp/labels`
  - `POST /api/whatsapp/labels/assign`
- **Esforço:** Médio

### 1.4 Chamadas de voz/vídeo
- **O que:** Iniciar chamadas via Evolution API
- **Onde:** ChatHeader
- **Endpoint:** `POST /instance/call/{instanceName}`
- **Status:** Evolution API v1.8.2 suporta parcialmente
- **Esforço:** Alto (depende da API)

### 1.5 Busca dentro da conversa
- **O que:** Filtrar mensagens por texto dentro de uma conversa aberta
- **Onde:** ChatArea, ChatHeader
- **Endpoint:** `POST /chat/findMessages/` com filtro adicional
- **Esforço:** Médio

### 1.6 Dados do contato
- **O que:** Exibir informações detalhadas do contato (nome, telefone, email, notas)
- **Onde:** ChatHeader
- **Dependência:** CRM integration
- **Esforço:** Médio

---

## 2. Botões desabilitados (sem backend, mas com handler futuro)

| Botão | Local | Ação esperada |
|-------|-------|---------------|
| Fechar conversa | ChatHeader | Remover conversa da lista ativa |
| Apagar conversa | ChatHeader | Deletar histórico via Evolution API |
| Nova conversa | WhatsAppHeader | Abrir modal de seleção de contato |
| Nova conversa (verde) | LeftIconBar | Mesmo que acima |
| Novo grupo | WhatsAppHeader (removido) | Criar grupo via Evolution API |

---

## 3. Melhorias visuais (sem dependência de backend)

### 3.1 Emoji picker completo
- **Atual:** 16 emojis hardcoded
- **Solução:** Usar lib `emoji-mart` ou expandir lista
- **Esforço:** Baixo

### 3.2 Mensagens de sistema
- **Atual:** Renderiza `isSystem` mas não gera automaticamente
- **Solução:** Gerar "Mensagem criptografada de ponta a ponta" no início
- **Esforço:** Baixo

### 3.3 Avatar do contato
- **Atual:** SVG genérico quando não tem foto
- **Solução:** Buscar foto via Evolution API ou usar iniciais
- **Esforço:** Baixo

### 3.4 Status de envio (check marks)
- **Atual:** Sempre single check (status nunca é populado)
- **Solução:** Popular campo `status` no ChatArea ao formatar mensagens
- **Esforço:** Baixo

---

## 4. Implementações sugeridas na ordem

| # | Item | Depende de | Esforço |
|---|------|-----------|---------|
| 1 | Popular status de envio | Nada | Baixo |
| 2 | Emoji picker completo | Nada | Baixo |
| 3 | Mensagem de sistema inicial | Nada | Baixo |
| 4 | Avatar com iniciais | Nada | Baixo |
| 5 | Favoritos (backend) | Schema + API | Baixo |
| 6 | Arquivamento (backend) | Schema + API | Baixo |
| 7 | Etiquetas (backend) | Schema + API | Médio |
| 8 | Busca na conversa | Nada | Médio |
| 9 | Dados do contato | CRM | Médio |
| 10 | Chamadas voz/vídeo | Evolution API | Alto |

---

## 5. Notas técnicas

### Evolution API v1.8.2
- Limitações: chamadas suportadas parcialmente
- Recomendação: atualizar para v2.x quando possível

### Schema Prisma
- Todas as tabelas sugeridas usam `userId` para multi-tenant
- Compatível com a estrutura existente (Neon + Prisma)

### Frontend
- Nenhuma dependência nova necessária (exceto emoji-mart opcional)
- Todos os componentes modificados mantêm compatibilidade
