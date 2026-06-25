'use client';

import { Search, Archive, BellOff, Pin, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Conversation } from './WhatsAppContainer';
import WhatsAppHeader from './WhatsAppHeader';
import FilterPills, { FilterType } from './FilterPills';

interface WhatsAppSidebarProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConv: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  connected?: boolean;
  qrCode?: string | null;
  crmCustomers?: any[];
  apiFetch?: any;
  onNewChat?: () => void;
}

export default function WhatsAppSidebar({
  conversations,
  selectedConvId,
  onSelectConv,
  open,
  onToggle,
  connected = true,
  qrCode = null,
  crmCustomers = [],
  apiFetch,
  onNewChat
}: WhatsAppSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filtro de busca
    if (searchTerm) {
      result = result.filter(c => 
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactNumber.includes(searchTerm)
      );
    }

    // Filtros de tipo
    switch (activeFilter) {
      case 'unread':
        result = result.filter(c => c.unreadCount > 0);
        break;
      case 'groups':
        result = result.filter(c => c.id.includes('@g.us'));
        break;
      // 'all' e 'favorites' mostram todas por enquanto
    }

    // Ordenar: fixados primeiro, depois por data
    result.sort((a, b) => {
      if ((a as any).isPinned && !(b as any).isPinned) return -1;
      if (!(a as any).isPinned && (b as any).isPinned) return 1;
      return ((b as any).updatedAt || 0) - ((a as any).updatedAt || 0);
    });

    return result;
  }, [conversations, searchTerm, activeFilter]);

  // Contar não lidas
  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  // Contar fixadas
  const pinnedCount = conversations.filter(c => (c as any).isPinned).length;

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
        w-full md:w-[400px] bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-[#222d34]
        flex flex-col fixed md:relative inset-0 z-40 md:z-auto
        transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <WhatsAppHeader onNewChat={onNewChat} />

        {/* Status de Conexão - Mostrar QR Code se desconectado */}
        {!connected && qrCode && (
          <div className="bg-white dark:bg-[#111b21] p-6 flex flex-col items-center justify-center border-b border-gray-200 dark:border-[#222d34] flex-shrink-0 z-50">
            <h3 className="text-black dark:text-white font-medium mb-4 text-center">Conecte o seu WhatsApp</h3>
            <div className="bg-white p-2 rounded-lg mb-4">
              <img 
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                alt="WhatsApp QR Code" 
                className="w-48 h-48 object-contain" 
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-[#8696a0] text-center">
              Abra o WhatsApp no seu celular, toque em Dispositivos Conectados e aponte a câmera para esta tela.
            </p>
          </div>
        )}

        {/* Search + Filters */}
        {connected && (
          <div className="bg-white dark:bg-[#111b21] flex-shrink-0">
            {/* Search Bar */}
            <div className="px-3 py-2">
              <div className="flex items-center bg-gray-100 dark:bg-[#202c33] rounded-lg px-3 gap-3 h-[35px]">
                <Search className="w-[18px] h-[18px] text-gray-500 dark:text-[#8696a0] flex-shrink-0" />
                <input 
                  type="text"
                  placeholder="Pesquisar ou começar uma nova conversa"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-black dark:text-[#e9edef] outline-none text-[14px] placeholder-gray-400 dark:placeholder-[#8696a0]"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-gray-500 dark:text-[#8696a0] hover:text-black dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Pills */}
            <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>
        )}

        {/* List */}
        {connected && (
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21]">
            {/* Arquivadas */}
            {!showArchived && (
              <button
                onClick={() => setShowArchived(true)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors border-b border-gray-200 dark:border-[#222d34]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#202c33] flex items-center justify-center">
                  <Archive className="w-5 h-5 text-[#00a884]" />
                </div>
                <span className="text-[#00a884] text-[17px] font-medium">Arquivadas</span>
              </button>
            )}

            {/* Conversas */}
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-[#8696a0] text-sm">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConvId === conv.id}
                  onClick={() => {
                    onSelectConv(conv.id);
                    onToggle();
                  }}
                />
              ))
            )}
          </div>
        )}
      </aside>
    </>
  );
}

// Componente de item de conversa
function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isGroup = conversation.id.includes('@g.us');
  const isPinned = (conversation as any).isPinned;
  const isMuted = (conversation as any).isMuted;

  // Determinar ícone do último remetente (para grupos)
  const lastMessagePrefix = isGroup && (conversation as any).lastMessageSender 
    ? `${(conversation as any).lastMessageSender}: ` 
    : '';

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-3 cursor-pointer transition-colors border-b border-gray-200 dark:border-[#222d34]
        ${isSelected ? 'bg-gray-100 dark:bg-[#2a3942]' : 'hover:bg-gray-50 dark:hover:bg-[#202c33]'}`}
    >
      {/* Avatar */}
      <div className="w-[49px] h-[49px] rounded-full bg-gray-300 dark:bg-[#6b7c85] flex items-center justify-center flex-shrink-0 overflow-hidden mr-3 relative">
        {conversation.avatar ? (
          <img src={conversation.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 212 212" width="49" height="49">
            <path fill="#6b7c85" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
            <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z" />
          </svg>
        )}
        
        {/* Online indicator */}
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-white dark:border-[#111b21]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + Time + Pin */}
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-black dark:text-[#e9edef] text-[17px] truncate flex-1">
            {conversation.contactName}
          </span>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {isPinned && (
              <Pin className="w-4 h-4 text-gray-500 dark:text-[#8696a0] rotate-45" />
            )}
            <span className={`text-[12px] ${
              conversation.unreadCount > 0 ? 'text-[#00a884]' : 'text-gray-500 dark:text-[#8696a0]'
            }`}>
              {conversation.timestamp}
            </span>
          </div>
        </div>

        {/* Last Message + Unread + Muted */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Read receipts */}
            {conversation.lastMessage && (
              <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb] flex-shrink-0">
                <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
              </svg>
            )}
            
            {/* Message content */}
            <span className={`text-[14px] truncate ${
              conversation.unreadCount > 0 ? 'text-black dark:text-[#e9edef]' : 'text-gray-500 dark:text-[#8696a0]'
            }`}>
              {lastMessagePrefix}{conversation.lastMessage}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Muted icon */}
            {isMuted && (
              <BellOff className="w-4 h-4 text-gray-500 dark:text-[#8696a0]" />
            )}
            
            {/* Unread badge */}
            {conversation.unreadCount > 0 && (
              <div className="min-w-[20px] h-[20px] rounded-full bg-[#00a884] text-[#111b21] text-[12px] font-medium flex items-center justify-center px-1">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
