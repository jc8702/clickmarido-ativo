# Instruções de Implementação: Interface WhatsApp
## Click Marido CRM — Replicação Fiel do WhatsApp Web

**Direcionado a:** Seu agente IA (Antigravity)  
**Objetivo:** Implementar interface idêntica ao WhatsApp Web  
**Arquitetura:** React 19 + Next.js 15 + Tailwind CSS v4  
**Duração estimada:** 7-10 dias de desenvolvimento

---

## 🎯 VISÃO GERAL DO PROJETO

### Estado Atual
- ✅ Arquivo `conversas/page.tsx` existe mas é básico
- ✅ Componentes de UI base existem em `components/ui/`
- ✅ Tailwind CSS v4 configurado
- ❌ Layout WhatsApp não implementado
- ❌ Componentes específicos do WhatsApp não existem

### Estado Final Desejado
- ✅ Layout idêntico ao WhatsApp Web (dark mode)
- ✅ Sidebar com lista de conversas
- ✅ Chat area com histórico de mensagens
- ✅ Input de mensagens com todos os recursos
- ✅ Modais e menus contextuais
- ✅ Responsividade mobile/tablet
- ✅ Animações suaves

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO

### CICLO 1: Análise (1 dia)

**TAREFA 1.1: Validar Estrutura Existente**

```bash
# Verificar página atual
cat frontend/src/app/(dashboard)/conversas/page.tsx | wc -l

# Resposta esperada: 230+ linhas (estrutura básica existe)

# Listar componentes UI disponíveis
ls -la frontend/src/components/ui/ | grep -E "\.tsx$"

# Resposta: avatar, button, dialog, input, etc. existem
```

**TAREFA 1.2: Criar Estrutura de Pastas**

```bash
# Criar pasta whatsapp em components
mkdir -p frontend/src/components/whatsapp/{sidebar,chat,modals,menus,hooks}

# Responder: Qual é o path completo? Deve ser exato.
# Esperado: /home/claude/clickmarido/frontend/src/components/whatsapp/
```

**TAREFA 1.3: Validar Tailwind Config**

```bash
# Verificar colors configuradas
grep -A 30 "colors:" frontend/tailwind.config.ts

# Procurar por: 
# - bg-[#111827] (gray 900)
# - bg-[#1f2937] (gray 800)
# - Se não existem, precisarão ser adicionadas como cores customizadas
```

**RELATÓRIO DA TAREFA 1.3:**
```json
{
  "estrutura_ok": true/false,
  "tailwind_colors_custom_necessarias": true/false,
  "colors_necessarias": ["#111827", "#1f2937", "#2d3139", "#056162", "#31a24c"],
  "proxima_fase": "CICLO_2"
}
```

---

### CICLO 2: Setup de Cores (1 dia)

**TAREFA 2.1: Adicionar Cores Customizadas ao Tailwind (SE NECESSÁRIO)**

Se a TAREFA 1.3 indicou que cores não existem:

**Arquivo:** `frontend/tailwind.config.ts`

**ENCONTRAR:** Seção `colors` dentro de `extend`

**ANTES:**
```typescript
extend: {
  colors: {
    // cores existentes
  }
}
```

**DEPOIS:**
```typescript
extend: {
  colors: {
    // ADICIONAR APENAS ISTO:
    whatsapp: {
      dark: '#111827',      // bg-whatsapp-dark
      card: '#1f2937',      // bg-whatsapp-card
      border: '#2d3139',    // border-whatsapp-border
      sent: '#056162',      // bg-whatsapp-sent
      green: '#31a24c',     // text-whatsapp-green / bg-whatsapp-green
    },
    // manter cores antigas
  }
}
```

**TAREFA 2.2: Validar Compilação**

```bash
cd frontend
npm run build 2>&1 | head -20

# Esperado: Sem erros de tailwind
# Se houver erro: PAUSE e reporte exato
```

---

### CICLO 3: Criar Componentes Base (2-3 dias)

#### PASSO 3.1: WhatsAppContainer (Componente Wrapper Principal)

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/WhatsAppContainer.tsx`

```typescript
'use client';

import { useState } from 'react';
import WhatsAppHeader from './WhatsAppHeader';
import WhatsAppSidebar from './WhatsAppSidebar';
import ChatArea from './chat/ChatArea';

interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
}

export default function WhatsAppContainer() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-whatsapp-dark">
      {/* Sidebar */}
      <WhatsAppSidebar
        conversations={conversations}
        selectedConvId={selectedConvId}
        onSelectConv={setSelectedConvId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Chat Area */}
      {selectedConversation ? (
        <ChatArea conversation={selectedConversation} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Selecione uma conversa para começar
        </div>
      )}
    </div>
  );
}
```

**INSTRUÇÃO PARA AGENTE:**
- Criar arquivo exatamente como mostrado
- Não modificar imports
- Não adicionar funcionalidades extras
- Testar: `npm run build` (deve compilar sem erros)

---

#### PASSO 3.2: WhatsAppHeader

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/WhatsAppHeader.tsx`

```typescript
'use client';

import { Search, Camera, MoreVertical } from 'lucide-react';

export default function WhatsAppHeader() {
  return (
    <header className="sticky top-0 h-16 bg-whatsapp-dark border-b border-whatsapp-border
      flex items-center justify-between px-4 md:px-6 gap-4 z-40">
      
      {/* Logo */}
      <h1 className="text-white font-bold text-xl hidden md:block">WhatsApp</h1>
      
      {/* Search */}
      <div className="flex-1 max-w-96">
        <div className="flex items-center gap-2 bg-whatsapp-card rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Pesquisar ou começar uma conversa"
            className="flex-1 bg-transparent text-white outline-none text-sm placeholder-gray-500"
          />
        </div>
      </div>
      
      {/* Action Icons */}
      <div className="flex items-center gap-4 text-gray-400">
        <Camera className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
        <MoreVertical className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
      </div>
    </header>
  );
}
```

**INSTRUÇÃO:**
- Criar arquivo exatamente
- Este é um componente visual apenas (sem lógica)
- Testar: visualmente deve aparecer no topo da página

---

#### PASSO 3.3: WhatsAppSidebar

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/WhatsAppSidebar.tsx`

```typescript
'use client';

import { Filter, Plus, MoreVertical, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface WhatsAppSidebarProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConv: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

export default function WhatsAppSidebar({
  conversations,
  selectedConvId,
  onSelectConv,
  open,
  onToggle
}: WhatsAppSidebarProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-80 bg-whatsapp-dark border-r border-whatsapp-border
        flex flex-col fixed md:relative inset-0 z-40 md:z-auto
        transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header com Close button (mobile) */}
        <div className="p-4 border-b border-whatsapp-border flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">Conversas</h2>
          <button onClick={onToggle} className="md:hidden text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex h-12 border-b border-whatsapp-border bg-whatsapp-dark">
          {['conversations', 'contacts'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as 'conversations' | 'contacts')}
              className={`flex-1 text-sm font-semibold transition-colors ${
                activeTab === tab 
                  ? 'text-white border-b-2 border-whatsapp-green' 
                  : 'text-gray-500 hover:text-white'
              }`}>
              {tab === 'conversations' ? 'Conversas' : 'Contatos'}
            </button>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="p-3 border-b border-whatsapp-border flex items-center gap-2">
          <div className="flex-1 flex items-center bg-whatsapp-card rounded-full px-4 gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent text-white outline-none text-sm placeholder-gray-500"
            />
          </div>
          
          <button className="w-8 h-8 rounded-full hover:bg-whatsapp-card flex items-center justify-center text-gray-400">
            <Plus className="w-5 h-5" />
          </button>
          
          <button className="w-8 h-8 rounded-full hover:bg-whatsapp-card flex items-center justify-center text-gray-400">
            <Filter className="w-5 h-5" />
          </button>
          
          <button className="w-8 h-8 rounded-full hover:bg-whatsapp-card flex items-center justify-center text-gray-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Nenhuma conversa ainda
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConv(conv.id);
                  onToggle(); // Close sidebar on mobile after selection
                }}
                className={`px-4 py-3 border-b border-whatsapp-border cursor-pointer transition-colors
                  ${selectedConvId === conv.id ? 'bg-whatsapp-card' : 'hover:bg-whatsapp-card'}`}>
                
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-whatsapp-card flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {conv.contactName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {conv.contactName}
                      </h3>
                      <span className="text-gray-500 text-xs flex-shrink-0">
                        {conv.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-xs truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  
                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-whatsapp-green text-white text-[10px]
                      font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
```

**INSTRUÇÃO:**
- Copiar arquivo exatamente
- Não modificar tipos
- Responsividade para mobile incluída (drawer)

---

#### PASSO 3.4: ChatArea (Componente Principal do Chat)

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/chat/ChatArea.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Smile, Paperclip, Phone, Video, Search, MoreVertical } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatAreaProps {
  conversation: Conversation;
}

export default function ChatArea({ conversation }: ChatAreaProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content: inputText,
      fromMe: true,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-whatsapp-dark h-[calc(100vh-4rem)]">
      {/* Header */}
      <ChatHeader conversation={conversation} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput 
        value={inputText}
        onChange={setInputText}
        onSend={handleSendMessage}
      />
    </div>
  );
}
```

**INSTRUÇÃO:**
- Criar arquivo
- Lógica básica de mensagens incluída
- MessageList e ChatInput são componentes separados (próximos passos)

---

#### PASSO 3.5: ChatHeader

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/chat/ChatHeader.tsx`

```typescript
'use client';

import { Phone, Video, Search, MoreVertical } from 'lucide-react';

interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  isOnline?: boolean;
}

export default function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <header className="h-14 border-b border-whatsapp-border bg-whatsapp-dark
      flex items-center justify-between px-4 md:px-6">
      
      {/* Contact Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-whatsapp-card flex items-center justify-center">
          <span className="text-white font-bold">
            {conversation.contactName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div>
          <h2 className="text-white font-semibold text-sm">
            {conversation.contactName}
          </h2>
          <p className="text-gray-400 text-xs">
            {conversation.isOnline ? '🟢 Online' : '⏱️ Último acesso'}
          </p>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4 text-gray-400">
        <Phone className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
        <Video className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
        <Search className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
        <MoreVertical className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
      </div>
    </header>
  );
}
```

---

#### PASSO 3.6: MessageList

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/chat/MessageList.tsx`

```typescript
'use client';

import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  timestamp: string;
  read: boolean;
}

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <>
      {messages.map((msg) => (
        <div 
          key={msg.id}
          className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
          
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            msg.fromMe 
              ? 'bg-whatsapp-sent text-white rounded-tr-sm'
              : 'bg-whatsapp-card text-white rounded-tl-sm'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            
            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
              msg.fromMe ? 'text-gray-200' : 'text-gray-400'
            }`}>
              {format(new Date(msg.timestamp), 'HH:mm')}
              {msg.fromMe && (
                msg.read 
                  ? <CheckCheck className="w-3 h-3" />
                  : <Check className="w-3 h-3" />
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
```

---

#### PASSO 3.7: ChatInput

**CRIAR ARQUIVO:** `frontend/src/components/whatsapp/chat/ChatInput.tsx`

```typescript
'use client';

import { Send, Mic, Smile, Paperclip } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
}

export default function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-whatsapp-border bg-whatsapp-dark flex items-end gap-3">
      
      {/* Emoji Button */}
      <button className="text-gray-400 hover:text-whatsapp-green flex-shrink-0">
        <Smile className="w-6 h-6" />
      </button>

      {/* Attach Button */}
      <button className="text-gray-400 hover:text-whatsapp-green flex-shrink-0">
        <Paperclip className="w-6 h-6" />
      </button>

      {/* Input */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem..."
        className="flex-1 bg-whatsapp-card text-white rounded-lg px-4 py-2
          min-h-10 max-h-24 resize-none outline-none border border-whatsapp-border
          focus:border-whatsapp-green placeholder-gray-500"
      />

      {/* Send / Mic Button */}
      <button 
        onClick={onSend}
        className="text-whatsapp-green hover:opacity-80 flex-shrink-0 transition-all">
        {value.trim() ? (
          <Send className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
```

---

### CICLO 4: Integrar em conversas/page.tsx (1 dia)

**TAREFA 4.1: Reescrever página conversas**

**ARQUIVO:** `frontend/src/app/(dashboard)/conversas/page.tsx`

**TROCAR TUDO POR:**

```typescript
'use client';

import WhatsAppContainer from '@/components/whatsapp/WhatsAppContainer';
import WhatsAppHeader from '@/components/whatsapp/WhatsAppHeader';

export default function ConversasPage() {
  return (
    <div className="flex flex-col h-screen bg-whatsapp-dark">
      <WhatsAppHeader />
      <WhatsAppContainer />
    </div>
  );
}
```

**INSTRUÇÃO:**
- Remover TUDO que estava antes
- Adicionar APENAS isto
- Não deixar imports mortos

---

### CICLO 5: Testes e Validação (1 dia)

**TAREFA 5.1: Teste Visual**

```bash
cd frontend
npm run dev

# Abrir http://localhost:3000/conversas
# Verificar:
# ✓ Header aparece
# ✓ Sidebar aparece
# ✓ Chat area vazio no início
# ✓ Botões funcionam
# ✓ Input funciona
# ✓ Pode enviar mensagem (teste manual)
```

**TAREFA 5.2: Build Test**

```bash
npm run build

# Esperado: Sem erros
# Se houver erro: PAUSE e reporte exato
```

**TAREFA 5.3: Teste Mobile (F12 → Device Toggle)**

```
✓ Sidebar fecha ao clicar fora
✓ Botão menu abre sidebar
✓ Layout reajusta
✓ Input funciona em mobile
```

---

## 📝 PRÓXIMOS PASSOS (APÓS CONCLUSÃO BÁSICA)

### Fase 2: Modais e Funcionalidades Avançadas

- [ ] Modal de novo chat (`NewChatModal.tsx`)
- [ ] Modal de propriedades (`ChatPropertiesModal.tsx`)
- [ ] Menu contextual (`ChatContextMenu.tsx`)
- [ ] Emoji picker (`EmojiPicker.tsx`)
- [ ] Reações a mensagens (`MessageReactions.tsx`)
- [ ] Indicador de digitação (`TypingIndicator.tsx`)
- [ ] Anexos (`AttachmentModal.tsx`)
- [ ] Perfil de contato (expandido)
- [ ] Busca em conversas
- [ ] Tags/labels de conversas

### Fase 3: Backend Integration

- [ ] Conectar com API real de Evolution
- [ ] Carregar conversas do banco
- [ ] Carregar mensagens do banco
- [ ] Sincronizar status online
- [ ] WebSocket para real-time
- [ ] Persistência de typing status
- [ ] Reações persistidas

### Fase 4: Performance e UX

- [ ] Lazy loading de mensagens
- [ ] Virtual scroll para grandes listas
- [ ] Caching de conversas
- [ ] Animações suaves
- [ ] Loading states
- [ ] Error handling
- [ ] Dark/light mode toggle

---

## 🚨 CHECKLIST FINAL

Antes de fazer commit:

- [ ] Todos os arquivos criados listados acima existem
- [ ] `npm run build` passa sem erros
- [ ] `npm run type-check` passa sem erros
- [ ] Página `/conversas` carrega sem erros no console
- [ ] Layout corresponde à screenshot do WhatsApp
- [ ] Sidebar tem todos os elementos:
  - [ ] Logo
  - [ ] Tabs
  - [ ] Search bar
  - [ ] Action buttons (+, filter, menu)
  - [ ] Lista de conversas
- [ ] Chat area tem:
  - [ ] Header com info do contato
  - [ ] Área de mensagens
  - [ ] Input com todos os botões
- [ ] Responsive:
  - [ ] Desktop: layout 2 colunas
  - [ ] Mobile: sidebar drawer
  - [ ] Tablet: layout intermediário

---

## 📊 ESTRUTURA FINAL DE PASTAS

```
frontend/src/components/whatsapp/
├── WhatsAppContainer.tsx         ✅ CRIAR
├── WhatsAppHeader.tsx            ✅ CRIAR
├── WhatsAppSidebar.tsx           ✅ CRIAR
├── sidebar/
│   └── ConversationItem.tsx      (opcional - pode extrair depois)
├── chat/
│   ├── ChatArea.tsx              ✅ CRIAR
│   ├── ChatHeader.tsx            ✅ CRIAR
│   ├── MessageList.tsx           ✅ CRIAR
│   ├── ChatInput.tsx             ✅ CRIAR
│   └── MessageBubble.tsx         (opcional - pode extrair depois)
├── modals/                        (criar quando precisar)
├── menus/                         (criar quando precisar)
└── hooks/                         (criar quando precisar)
```

---

## ⚠️ REGRAS CRÍTICAS PARA AGENTE IA

1. ❌ **NÃO** modifique layouts existentes de outras páginas
2. ❌ **NÃO** crie componentes que não estejam neste plano
3. ✅ **SEMPRE** teste `npm run build` após criar arquivo
4. ✅ **SEMPRE** use cores de Tailwind (prefira customizadas)
5. ✅ **SEMPRE** faça commit após cada ciclo completado
6. ✅ **SEMPRE** reporte se encontrar arquivo/import que não existe
7. ❌ **NUNCA** deixe imports mortos
8. ✅ **SEMPRE** mantenha TypeScript strict

---

**Documento de Implementação Completo. Pronto para começar!**

Próximo passo: **Agente começa CICLO 1 (Análise)**
