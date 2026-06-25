# Especificação UI/UX: WhatsApp Web CRM
## Replicação Fiel da Interface do WhatsApp

**Data:** 24 de junho de 2026  
**Objetivo:** Construir interface idêntica ao WhatsApp Web para o Click Marido CRM  
**Escopo:** Layout, componentes, funcionalidades, interações, responsividade  
**Arquitetura:** React 19 + Next.js 15 + Tailwind CSS v4

---

## 📐 LAYOUT GERAL

### 1. Estrutura de Grid (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOP BAR (Logo + Menu)                    │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                           │
│  SIDEBAR (300px)     │        CHAT AREA (flex-1)               │
│  - Conversas         │  ┌─────────────────────────────────┐   │
│  - Tags              │  │ Header: Nome + Ícones           │   │
│  - Input Busca       │  ├─────────────────────────────────┤   │
│  - Lista de chats    │  │                                 │   │
│                      │  │  Area de Mensagens (scrollável) │   │
│  Abas:              │  │                                 │   │
│  ├─ Conversas       │  ├─────────────────────────────────┤   │
│  ├─ Contatos        │  │ Input + Botão Enviar            │   │
│  └─ Grupos          │  └─────────────────────────────────┘   │
│                      │                                           │
└──────────────────────┴──────────────────────────────────────────┘
```

### 2. Dimensões (em Tailwind)

**Sidebar:**
- Largura: `w-80` (320px) em desktop
- Em mobile: drawer overlay
- Altura: `h-[calc(100vh-4rem)]` (menos topbar)
- Padding interno: `p-4`

**Chat Area:**
- Flex: `flex-1`
- Altura: `h-[calc(100vh-4rem)]`
- Display flex: `flex flex-col`

**Top Bar:**
- Altura: `h-16` (64px)
- Sticky: `sticky top-0`
- Fundo: Dark mode → `bg-[#111827]` (Gray 900), Light mode → `bg-white`

---

## 🎨 TEMA E CORES

### Dark Mode (Padrão WhatsApp Web)

```css
/* Fundo geral */
--bg-primary: #111827;    /* Gray 900 */
--bg-secondary: #1f2937;  /* Gray 800 */
--bg-tertiary: #374151;   /* Gray 700 */

/* Textos */
--text-primary: #f3f4f6;  /* Gray 100 */
--text-secondary: #d1d5db; /* Gray 400 */
--text-muted: #9ca3af;    /* Gray 500 */

/* Destaque (Green WhatsApp) */
--brand-green: #31a24c;   /* WhatsApp Green */
--brand-green-light: #056162; /* Light Teal */
--brand-green-dark: #0d5f5f; /* Dark Teal */

/* Mensagens */
--message-sent: #056162;    /* Teal escuro (outgoing) */
--message-received: #1f2937; /* Gray 800 (incoming) */

/* Hover/Active */
--hover-bg: #262d35;        /* Gray 750 */
--active-bg: #2a3139;       /* Gray 725 */

/* Bordas */
--border-color: #2d3139;    /* Gray 700 com alpha */
```

### Light Mode (opcional)

```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-tertiary: #eeeeee;
--text-primary: #111827;
--text-secondary: #6b7280;
--text-muted: #9ca3af;
```

---

## 📋 COMPONENTES DETALHADOS

### A. TOP BAR

**Layout:**
```
[← Menu] [Logo] [Busca Global] [Ícones] [Menu]
```

**Componentes:**
1. **Logo/Branding (Left)**
   - Texto: "WhatsApp" em fonte bold `font-bold text-xl`
   - Cor: `text-white`
   - Ícone (opcional): WhatsApp logo
   - Padding: `pl-4`

2. **Search Bar (Center/Full width em small)**
   - Placeholder: "Pesquisar ou começar uma conversa"
   - Icon: Magnifying glass (Lucide: `Search`)
   - Rounded: `rounded-full`
   - Background: `bg-[#1f2937]`
   - Padding: `px-4 py-2`
   - Width: `w-full md:w-96`
   - Margin: `mx-auto`

3. **Action Icons (Right)**
   - **Photo Camera**: `Upload image/start video`
   - **More Options (•••)**: Dropdown menu
   - Espaçamento entre ícones: `gap-4`
   - Color: `text-gray-400 hover:text-white`
   - Cursor: `cursor-pointer`
   - Tamanho: `w-5 h-5`

**Código Estrutural:**
```tsx
<header className="sticky top-0 h-16 bg-[#111827] border-b border-[#2d3139] 
  flex items-center justify-between px-4 md:px-6 gap-4 z-40">
  {/* Logo */}
  <h1 className="text-white font-bold text-xl hidden md:block">WhatsApp</h1>
  
  {/* Search */}
  <div className="flex-1 max-w-96">
    <input placeholder="Pesquisar..." 
      className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2" />
  </div>
  
  {/* Icons */}
  <div className="flex items-center gap-4 text-gray-400">
    <Camera className="w-5 h-5 cursor-pointer hover:text-white" />
    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white" />
  </div>
</header>
```

---

### B. SIDEBAR (Esquerda)

#### B1. Abas (Tabs)

```
┌─────────────────────────────────────┐
│  Conversas │ Contatos │ Comunidades │
└─────────────────────────────────────┘
```

**Especificação:**
- Layout: `flex gap-0`
- Altura: `h-12`
- Border bottom na ativa: `border-b-2 border-[#31a24c]`
- Texto: `text-sm font-semibold`
- Padding: `px-4 py-3`
- Hover: `bg-[#1f2937]`
- Cor inativa: `text-gray-500`
- Cor ativa: `text-white`

**Código:**
```tsx
const [activeTab, setActiveTab] = useState<'conversations' | 'contacts' | 'communities'>('conversations');

<div className="flex h-12 border-b border-[#2d3139] bg-[#111827]">
  {['conversations', 'contacts', 'communities'].map((tab) => (
    <button key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 text-sm font-semibold transition-colors ${
        activeTab === tab 
          ? 'text-white border-b-2 border-[#31a24c]' 
          : 'text-gray-500 hover:text-white'
      }`}>
      {tab === 'conversations' && 'Conversas'}
      {tab === 'contacts' && 'Contatos'}
      {tab === 'communities' && 'Comunidades'}
    </button>
  ))}
</div>
```

---

#### B2. Barra de Busca e Ações

```
┌────────────────────────────────────────┐
│ 🔍 Pesquisar          [+] [⚙️] [⋮]     │
└────────────────────────────────────────┘
```

**Especificação:**
- Padding: `p-3`
- Border-bottom: `border-b border-[#2d3139]`
- Display: `flex items-center gap-2`

**Componentes:**
1. **Input Busca**
   - Placeholder: "Pesquisar ou começar uma nova conversa"
   - Icon: `Search` (Lucide)
   - Flex: `flex-1`
   - Radius: `rounded-full`
   - Padding: `px-4 py-2`
   - Background: `bg-[#1f2937]`

2. **Botão "+" (Novo Chat)**
   - Icon: `Plus` ou `MessageCirclePlus`
   - Size: `w-8 h-8`
   - Radius: `rounded-full`
   - Hover: `bg-[#2d3139]`
   - Tooltip: "Iniciar nova conversa"

3. **Botão Filtro**
   - Icon: `Filter` ou `Settings`
   - Dropdown com opções:
     - Não lidas
     - Fixadas
     - Arquivadas
     - Todas

4. **Menu (⋮)**
   - Icon: `MoreVertical`
   - Dropdown com opções:
     - Configurações
     - Sair
     - Sobre

**Código:**
```tsx
<div className="p-3 border-b border-[#2d3139] flex items-center gap-2">
  {/* Search */}
  <div className="flex-1 flex items-center bg-[#1f2937] rounded-full px-4 gap-2">
    <Search className="w-4 h-4 text-gray-500" />
    <input placeholder="Pesquisar..." 
      className="flex-1 bg-transparent text-white outline-none py-2 text-sm" />
  </div>
  
  {/* New Chat Button */}
  <button className="w-8 h-8 rounded-full hover:bg-[#2d3139] flex items-center justify-center">
    <Plus className="w-5 h-5 text-white" />
  </button>
  
  {/* Filter Button */}
  <button className="w-8 h-8 rounded-full hover:bg-[#2d3139] flex items-center justify-center">
    <Filter className="w-5 h-5 text-white" />
  </button>
  
  {/* More Options */}
  <button className="w-8 h-8 rounded-full hover:bg-[#2d3139] flex items-center justify-center">
    <MoreVertical className="w-5 h-5 text-white" />
  </button>
</div>
```

---

#### B3. Tags/Labels (Opcional)

**Exibição abaixo da barra de busca:**
```
┌─────────────────────────────────────┐
│ [⭐ Fixadas] [📌 Grupos] [👥 Grupo] │
│ [🏷️ Clientes] [🔴 Não lidas]        │
└─────────────────────────────────────┘
```

**Especificação:**
- Flex: `flex flex-wrap gap-2`
- Padding: `p-3`
- Height: `max-h-24 overflow-y-auto`

**Badge Componente:**
```tsx
const TagBadge = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all
      ${active 
        ? 'bg-[#31a24c] text-white' 
        : 'bg-[#1f2937] text-gray-400 hover:text-white'
      }`}>
    <span>{icon}</span>
    <span>{label}</span>
    {count > 0 && <span className="ml-1 text-[10px]">({count})</span>}
  </button>
);
```

---

#### B4. Lista de Conversas

**Layout:**
```
┌──────────────────────────────┐
│ 🟢 João Silva                │
│    Ultimo: "Tudo bem?"    → │
│    20:56                      │
├──────────────────────────────┤
│ 🔵 Maria Santos              │
│    Ultimo: "Enviei a foto" → │
│    19:32                      │
├──────────────────────────────┤
│ 🟡 Grupo Técnicos            │
│    João: "Qual é o problema"│
│    17:45                      │
└──────────────────────────────┘
```

**Especificação de Cada Item de Conversa:**

```tsx
interface ConversationItemProps {
  id: string;
  avatar: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  selected?: boolean;
  onClick: () => void;
}

const ConversationItem = (props: ConversationItemProps) => (
  <div
    onClick={props.onClick}
    className={`px-4 py-3 border-b border-[#2d3139] cursor-pointer transition-colors
      ${props.selected ? 'bg-[#2d3139]' : 'hover:bg-[#1f2937]'}
      `}>
    
    {/* Container: Flex com avatar + conteúdo */}
    <div className="flex items-center gap-3">
      
      {/* Avatar com status online */}
      <div className="relative flex-shrink-0">
        <img src={props.avatar} 
          alt={props.name}
          className="w-12 h-12 rounded-full object-cover" />
        
        {/* Green dot (online) */}
        {props.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111827]" />
        )}
      </div>
      
      {/* Conteúdo: Nome + Última Mensagem */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2 mb-1">
          <h3 className="text-white font-semibold text-sm truncate">
            {props.name}
          </h3>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {props.timestamp}
          </span>
        </div>
        
        {/* Última mensagem */}
        <p className="text-gray-400 text-xs truncate">
          {props.lastMessage}
        </p>
      </div>
      
      {/* Badge de não lidos (right) */}
      {props.unreadCount && props.unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-[#31a24c] text-white text-[10px] 
          font-bold flex items-center justify-center flex-shrink-0">
          {props.unreadCount > 99 ? '99+' : props.unreadCount}
        </div>
      )}
      
      {/* Ícone muted (sino riscado) */}
      {props.isMuted && (
        <BellOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
      
      {/* Ícone pinned (com push-pin) */}
      {props.isPinned && (
        <Pin className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
    </div>
  </div>
);
```

**Container da lista:**
```tsx
<div className="flex-1 overflow-y-auto bg-[#111827]">
  {conversations.map((conv) => (
    <ConversationItem
      key={conv.id}
      {...conv}
      selected={selectedConversationId === conv.id}
      onClick={() => setSelectedConversationId(conv.id)}
    />
  ))}
</div>
```

---

### C. CHAT AREA (Centro/Direita)

#### C1. Chat Header

```
┌──────────────────────────────────────────────────────┐
│ 👤 João Silva (Online) │ 📱 📞 🔍 ⚙️ ⋮              │
└──────────────────────────────────────────────────────┘
```

**Especificação:**
- Altura: `h-14`
- Border-bottom: `border-b border-[#2d3139]`
- Padding: `px-4 py-3`
- Display: `flex items-center justify-between`
- Fundo: `bg-[#111827]`

**Componentes:**

1. **Info do Contato (Left)**
   - Avatar + Nome + Status
   - Flex: `flex items-center gap-3`

   ```tsx
   <div className="flex items-center gap-3">
     <img src={avatar} className="w-10 h-10 rounded-full" />
     <div>
       <h2 className="text-white font-semibold text-sm">{contactName}</h2>
       <p className="text-gray-400 text-xs">
         {isOnline ? '🟢 Online' : `Último acesso às ${lastSeen}`}
       </p>
     </div>
   </div>
   ```

2. **Action Buttons (Right)**
   - Chamada de áudio: `Phone` icon
   - Chamada de vídeo: `Video` icon
   - Buscar mensagens: `Search` icon
   - Menu: `MoreVertical` icon
   - Espaçamento: `gap-4`
   - Tamanho: `w-5 h-5`
   - Hover: `text-green-400`

   ```tsx
   <div className="flex items-center gap-4 text-gray-400">
     <Phone className="w-5 h-5 cursor-pointer hover:text-[#31a24c] transition" />
     <Video className="w-5 h-5 cursor-pointer hover:text-[#31a24c] transition" />
     <Search className="w-5 h-5 cursor-pointer hover:text-[#31a24c] transition" />
     <MoreVertical className="w-5 h-5 cursor-pointer hover:text-[#31a24c] transition" />
   </div>
   ```

---

#### C2. Área de Mensagens

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 📅 Hoje                                          │
├─────────────────────────────────────────────────┤
│                                                   │
│ João Silva                                        │
│ ┌─────────────────────┐                          │
│ │ Opa, tudo bem?      │ 20:15                   │
│ └─────────────────────┘ ✓✓                       │
│                                                   │
│                 ┌──────────────┐                 │
│                 │ Tudo certo!  │ 20:16          │
│                 │ E aí?        │ (seu)          │
│                 └──────────────┘ ✓✓              │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Especificação:**

1. **Divider de Data**
   - Margin: `my-4`
   - Text: `text-gray-500 text-xs text-center`
   - Código:
   ```tsx
   <div className="my-4 flex items-center gap-3 px-4">
     <div className="flex-1 h-px bg-[#2d3139]" />
     <span className="text-gray-500 text-xs">Hoje</span>
     <div className="flex-1 h-px bg-[#2d3139]" />
   </div>
   ```

2. **Message Bubble**

   **Mensagem Recebida:**
   ```tsx
   <div className="flex justify-start mb-2">
     <div className="max-w-xs px-4 py-2 rounded-lg bg-[#1f2937] text-white text-sm">
       {message.content}
       <div className="text-gray-400 text-xs mt-1">
         {format(new Date(message.timestamp), 'HH:mm')}
       </div>
     </div>
   </div>
   ```

   **Mensagem Enviada:**
   ```tsx
   <div className="flex justify-end mb-2">
     <div className="max-w-xs px-4 py-2 rounded-lg bg-[#056162] text-white text-sm">
       {message.content}
       <div className="flex items-center justify-end gap-1 text-gray-200 text-xs mt-1">
         {format(new Date(message.timestamp), 'HH:mm')}
         {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
       </div>
     </div>
   </div>
   ```

3. **Container da Área de Mensagens**
   ```tsx
   <div ref={messagesEndRef} 
     className="flex-1 overflow-y-auto p-4 bg-[#0f1419] space-y-2">
     {messages.map((msg) => (
       msg.fromMe 
         ? <SentMessage key={msg.id} message={msg} />
         : <ReceivedMessage key={msg.id} message={msg} />
     ))}
   </div>
   ```

---

#### C3. Input Area (Footer)

**Layout:**
```
┌──────────────────────────────────────────────┐
│ [🙂] [📎] [input] [🎤]                        │
└──────────────────────────────────────────────┘
```

**Especificação:**
- Padding: `p-4`
- Border-top: `border-t border-[#2d3139]`
- Display: `flex items-end gap-3`
- Fundo: `bg-[#111827]`

**Componentes:**

1. **Botão Emoji**
   - Icon: `Smile` (Lucide)
   - Size: `w-6 h-6`
   - Click: Abre picker de emojis
   - Cor: `text-gray-400 hover:text-[#31a24c]`

2. **Botão Anexo**
   - Icon: `Paperclip`
   - Click: Abre file picker
   - Funcionalidades:
     - Fotos e vídeos
     - Documentos
     - Áudio
     - Contato

3. **Input Text**
   - Placeholder: "Digite uma mensagem..."
   - Min-height: `min-h-10`
   - Max-height: `max-h-24`
   - Resize: `resize-none`
   - Padding: `px-4 py-2`
   - Radius: `rounded-lg`
   - Background: `bg-[#1f2937]`
   - Flex: `flex-1`
   - Borders: `border border-[#2d3139]`
   - Autoexpand com textarea

4. **Botão Enviar / Microfone**
   - Se input vazio: Microfone (`Mic`)
   - Se input tem texto: Enviar (`Send`)
   - Rotação animada ao passar por cima
   - Cor: `text-[#31a24c]`

**Código:**
```tsx
const [message, setMessage] = useState('');
const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

<div className="p-4 border-t border-[#2d3139] bg-[#111827] flex items-end gap-3">
  
  {/* Emoji Button */}
  <button 
    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
    className="text-gray-400 hover:text-[#31a24c] flex-shrink-0">
    <Smile className="w-6 h-6" />
  </button>
  
  {/* Emoji Picker (Floating above) */}
  {emojiPickerOpen && (
    <div className="absolute bottom-20 left-4 z-50">
      {/* Use: emoji-picker-react or similar */}
    </div>
  )}
  
  {/* Attach Button */}
  <button className="text-gray-400 hover:text-[#31a24c] flex-shrink-0">
    <Paperclip className="w-6 h-6" />
  </button>
  
  {/* Input */}
  <textarea
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }}
    placeholder="Digite uma mensagem..."
    className="flex-1 bg-[#1f2937] text-white rounded-lg px-4 py-2 
      min-h-10 max-h-24 resize-none outline-none border border-[#2d3139]
      focus:border-[#31a24c] placeholder-gray-500"
  />
  
  {/* Send / Mic Button */}
  <button 
    onClick={() => message.trim() ? sendMessage() : startRecording()}
    className="text-[#31a24c] hover:opacity-80 flex-shrink-0 transition-all">
    {message.trim() ? (
      <Send className="w-6 h-6" />
    ) : (
      <Mic className="w-6 h-6" />
    )}
  </button>
</div>
```

---

## 🔧 FUNCIONALIDADES DETALHADAS

### 1. Novo Chat / Contato Não Cadastrado

**Trigger:** Botão "+" na sidebar

**Modal/Dialog:**
```
┌──────────────────────────────────────────┐
│ ✕ Iniciar Nova Conversa                 │
├──────────────────────────────────────────┤
│ Buscar contato ou número:                │
│ [____________________________________]   │
│                                          │
│ 👤 João Silva (+55 85 98765-4321)       │
│ 📱 Maria Santos (+55 85 91234-5678)     │
│ 🔴 + Criar novo contato                 │
│                                          │
│ [Cancelar] [Iniciar Conversa]           │
└──────────────────────────────────────────┘
```

**Fluxo:**
1. Usuário clica em "+"
2. Dialog abre com input de busca
3. Conforme digita, lista de contatos filtra
4. Se nenhum resultado: botão "Criar novo contato"
5. Seleção abre chat com contato

**Estado:**
```tsx
const [searchTerm, setSearchTerm] = useState('');
const [filteredContacts, setFilteredContacts] = useState([]);
const [newConversationNumber, setNewConversationNumber] = useState('');

useEffect(() => {
  if (searchTerm.length > 0) {
    const filtered = contacts.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
    setFilteredContacts(filtered);
  }
}, [searchTerm]);
```

---

### 2. Contexto/Menu de Conversa (Right-click)

**Ao clicar com botão direito (ou menu de ações) em uma conversa:**
```
┌────────────────────────┐
│ 📌 Fixar               │
│ 🔕 Silenciar           │
│ 📋 Arquivar            │
│ ❌ Excluir             │
│ ⚙️ Propriedades        │
└────────────────────────┘
```

**Implementação:**
```tsx
const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
const [contextConvId, setContextConvId] = useState<string | null>(null);

const handleContextMenu = (e: React.MouseEvent, convId: string) => {
  e.preventDefault();
  setContextConvId(convId);
  setContextMenu({ x: e.clientX, y: e.clientY });
};

const handlePin = (convId: string) => {
  // Update conversation: pinned = true
  setContextMenu(null);
};

// Render in conversation list
<ConversationItem
  onContextMenu={(e) => handleContextMenu(e, conv.id)}
  // ...
/>

// Render context menu
{contextMenu && (
  <div 
    className="fixed bg-[#1f2937] border border-[#2d3139] rounded-lg shadow-lg z-50
      flex flex-col py-1"
    style={{ top: contextMenu.y, left: contextMenu.x }}>
    <button onClick={() => handlePin(contextConvId)} className="px-4 py-2 hover:bg-[#2d3139]">
      📌 Fixar
    </button>
    {/* ... mais opções ... */}
  </div>
)}
```

---

### 3. Reações a Mensagens

**Ao passar mouse em uma mensagem:**
```
        👍 ❤️ 😂 😮 😢 🙏
Mensagem: [Opa, tudo bem?]
```

**Especificação:**
- Toolbar flutua acima/abaixo da mensagem
- Emojis: `👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`
- Plus (+) para mais opções
- Click em emoji = adiciona reação
- Click novamente = remove reação

**Implementação:**
```tsx
const [hoverMessageId, setHoverMessageId] = useState<string | null>(null);
const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});

const handleEmojiReaction = (messageId: string, emoji: string) => {
  setMessageReactions(prev => {
    const reactions = prev[messageId] || [];
    if (reactions.includes(emoji)) {
      reactions = reactions.filter(e => e !== emoji);
    } else {
      reactions = [...reactions, emoji];
    }
    return { ...prev, [messageId]: reactions };
  });
};

// In message render
<div 
  onMouseEnter={() => setHoverMessageId(msg.id)}
  onMouseLeave={() => setHoverMessageId(null)}
  className="relative">
  {/* Message content */}
  
  {hoverMessageId === msg.id && (
    <div className="absolute -top-10 left-0 bg-[#1f2937] rounded-lg p-2 
      flex gap-1 z-10 border border-[#2d3139]">
      {['👍', '❤️', '😂', '😮', '😢', '🙏', '+'].map(emoji => (
        <button
          key={emoji}
          onClick={() => emoji !== '+' && handleEmojiReaction(msg.id, emoji)}
          className="text-lg hover:scale-125 transition-transform cursor-pointer">
          {emoji}
        </button>
      ))}
    </div>
  )}
  
  {/* Show reactions below message */}
  {messageReactions[msg.id]?.length > 0 && (
    <div className="flex gap-1 mt-1 flex-wrap">
      {messageReactions[msg.id].map(emoji => (
        <span key={emoji} className="text-sm">{emoji}</span>
      ))}
    </div>
  )}
</div>
```

---

### 4. Status Online / Digitando

**Indicador de Status:**
```
João Silva
🟢 Online

ou

Maria Santos
⏱️ Digitando...

ou

Carlos
Último acesso às 15:30
```

**Implementação com WebSocket (simulado):**
```tsx
const [userStatus, setUserStatus] = useState<'online' | 'typing' | 'offline'>('offline');
const [lastSeen, setLastSeen] = useState<Date>(new Date());

// Listen to typing events
useEffect(() => {
  const timeout = setTimeout(() => {
    if (userStatus === 'typing') setUserStatus('online');
  }, 3000); // Stop showing "typing" after 3 seconds of inactivity
  
  return () => clearTimeout(timeout);
}, [userStatus]);

// Render status
<p className="text-gray-400 text-xs">
  {userStatus === 'online' && '🟢 Online'}
  {userStatus === 'typing' && '⏱️ Digitando...'}
  {userStatus === 'offline' && `Último acesso às ${format(lastSeen, 'HH:mm')}`}
</p>
```

---

### 5. Busca Global

**Ao clicar em search na top bar:**
```
┌─────────────────────────────────────────┐
│ 🔍 Buscar em todas as conversas...      │
├─────────────────────────────────────────┤
│ Recentes                                 │
│ João: "Opa, tudo bem?"                  │
│ Maria: "Enviei a foto"                  │
│                                          │
│ [Ver mais resultados]                   │
└─────────────────────────────────────────┘
```

---

### 6. Modal de Propriedades do Chat

**Ao clicar em ⚙️ no header:**
```
┌────────────────────────────────────────┐
│ ✕ Propriedades do Chat                 │
├────────────────────────────────────────┤
│ [Avatar grande]                         │
│ João Silva                              │
│ +55 85 98765-4321                       │
│ Último acesso: 10:30                    │
│                                          │
│ ─────────────────────────────────────   │
│ 📌 Fixado                               │
│ 🔕 Silencioso                           │
│ 🚫 Bloqueado                            │
│                                          │
│ ─────────────────────────────────────   │
│ Mídia e Documentos (234)                │
│ [Fotos] [Vídeos] [Docs]                │
│                                          │
│ ─────────────────────────────────────   │
│ [Limpar Chat] [Excluir Chat]            │
│                                          │
│ [Fechar]                                │
└────────────────────────────────────────┘
```

---

## 📱 RESPONSIVIDADE

### Desktop (≥1024px)
- Sidebar visível: 320px
- Chat area: flex-1
- Layout: 2 colunas

### Tablet (768px - 1023px)
- Sidebar overlay ao lado
- Chat area maior
- Ajustes de padding/margin

### Mobile (<768px)
- Sidebar como drawer (hamburger menu)
- Chat area full width quando chat selecionado
- Header compacto
- Input encolhe um pouco

**Código de responsividade:**
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);

<div className="flex h-screen">
  {/* Sidebar - Hidden on mobile, shown on desktop */}
  <aside className={`
    w-80 bg-[#111827] border-r border-[#2d3139]
    ${sidebarOpen ? 'fixed inset-0 z-50 md:relative md:z-auto' : 'hidden md:flex flex-col'}
  `}>
    {/* Sidebar content */}
  </aside>
  
  {/* Chat Area */}
  <main className="flex-1 flex flex-col">
    {/* Chat content */}
  </main>
</div>
```

---

## 🎯 CHECKLIST DE COMPONENTES

### Criar/Modificar Componentes

- [ ] **WhatsAppHeader.tsx** — Top bar com logo e ações
- [ ] **WhatsAppSidebar.tsx** — Sidebar com conversas
- [ ] **ConversationTabs.tsx** — Abas de conversas/contatos
- [ ] **SearchBar.tsx** — Busca de conversas
- [ ] **ConversationList.tsx** — Lista de conversas
- [ ] **ConversationItem.tsx** — Item individual de conversa
- [ ] **ChatHeader.tsx** — Header do chat ativo
- [ ] **MessageList.tsx** — Área de mensagens
- [ ] **MessageBubble.tsx** — Bubble de mensagem
- [ ] **ChatInput.tsx** — Input de mensagem
- [ ] **EmojiPicker.tsx** — Picker de emojis
- [ ] **NewChatModal.tsx** — Modal de novo chat
- [ ] **ChatContextMenu.tsx** — Menu contextual
- [ ] **ChatPropertiesModal.tsx** — Modal de propriedades
- [ ] **TagBadges.tsx** — Tags/labels
- [ ] **TypingIndicator.tsx** — Indicador de digitação
- [ ] **MessageReactions.tsx** — Reações às mensagens
- [ ] **AttachmentModal.tsx** — Modal de anexos

### Atualizar Página Principal

- [ ] **conversas/page.tsx** — Reescrever com nova arquitetura
  - [ ] Integrar WhatsAppHeader
  - [ ] Integrar WhatsAppSidebar
  - [ ] Integrar ChatArea
  - [ ] Estado global de seleção de chat
  - [ ] Handlers de mensagens

---

## 📊 ESTRUTURA DE PASTAS SUGERIDA

```
frontend/src/components/
├── whatsapp/                        (NOVA PASTA)
│   ├── WhatsAppHeader.tsx
│   ├── WhatsAppSidebar.tsx
│   ├── WhatsAppContainer.tsx        (wrapper principal)
│   ├── sidebar/
│   │   ├── ConversationTabs.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── TagBadges.tsx
│   ├── chat/
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageReactions.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── ChatInput.tsx
│   │   └── EmojiPicker.tsx
│   ├── modals/
│   │   ├── NewChatModal.tsx
│   │   ├── ChatPropertiesModal.tsx
│   │   └── AttachmentModal.tsx
│   ├── menus/
│   │   └── ChatContextMenu.tsx
│   └── hooks/
│       ├── useWhatsAppChat.ts
│       ├── useConversations.ts
│       └── useMessageReactions.ts
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Estrutura Base (Semana 1)
1. Criar WhatsAppContainer com grid layout
2. Criar WhatsAppHeader
3. Criar WhatsAppSidebar básico
4. Integrar em conversas/page.tsx

### Fase 2: Sidebar Completa (Semana 1-2)
5. Criar ConversationTabs
6. Criar SearchBar com filtros
7. Criar ConversationList
8. Criar ConversationItem com status
9. Adicionar Tags/Labels

### Fase 3: Chat Area (Semana 2)
10. Criar ChatHeader
11. Criar MessageList e MessageBubble
12. Criar ChatInput com autoexpand
13. Implementar envio de mensagens

### Fase 4: Funcionalidades (Semana 2-3)
14. Modal de novo chat
15. Menu contextual
16. Reações a mensagens
17. Indicador de digitação
18. Emoji picker

### Fase 5: Polish e Responsividade (Semana 3)
19. Ajustes mobile
20. Drawer sidebar
21. Testes E2E
22. Performance otimization

---

## 📝 NOTAS TÉCNICAS

### Estado Global (Zustand/Context recomendado)

```typescript
interface ChatStore {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  
  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => void;
  loadMessages: (convId: string) => Promise<void>;
  sendMessage: (convId: string, text: string) => Promise<void>;
  updateConversationStatus: (convId: string, data: any) => void;
}
```

### WebSocket para Real-time (opcional mas recomendado)

- Conectar ao servidor WebSocket
- Escutar eventos:
  - `message.new` — Nova mensagem
  - `conversation.typing` — Digitando
  - `user.status` — Status online/offline
  - `message.reaction` — Reação adicionada
- Emitir eventos:
  - `message.send`
  - `typing.start` / `typing.stop`
  - `conversation.read`

---

**Documento de Especificação Completo. Pronto para implementação!**
