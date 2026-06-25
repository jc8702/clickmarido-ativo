'use client';

import { Search, X, Pin, BellOff } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Conversation } from './WhatsAppContainer';
import FilterPills, { FilterType } from './FilterPills';
import { WhatsAppLabel } from './hooks/useWhatsAppApi';

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
  // Favorites
  isFavorite?: (phone: string) => boolean;
  toggleFavorite?: (phone: string) => Promise<boolean>;
  // Archived
  isArchived?: (phone: string) => boolean;
  toggleArchive?: (phone: string) => Promise<boolean>;
  // Labels
  labels?: WhatsAppLabel[];
  toggleLabelOnConversation?: (phone: string, labelId: string) => Promise<boolean>;
  getLabelsForPhone?: (phone: string) => WhatsAppLabel[];
  // Navigation
  activeIcon?: string;
  onIconClick?: (icon: string) => void;
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
  onNewChat,
  isFavorite,
  toggleFavorite,
  isArchived,
  toggleArchive,
  labels = [],
  toggleLabelOnConversation,
  getLabelsForPhone,
  activeIcon = 'chats',
  onIconClick,
}: WhatsAppSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.contactName.toLowerCase().includes(term) ||
        c.contactNumber.includes(term) ||
        c.lastMessage.toLowerCase().includes(term)
      );
    }

    // Filtrar por etiqueta
    if (selectedLabelId && getLabelsForPhone) {
      result = result.filter(c => {
        const phone = c.contactNumber;
        const convLabels = getLabelsForPhone(phone);
        return convLabels.some(l => l.id === selectedLabelId);
      });
    }

    // Filtrar por tipo
    switch (activeFilter) {
      case 'unread':
        result = result.filter(c => c.unreadCount > 0);
        break;
      case 'groups':
        result = result.filter(c => c.id.includes('@g.us'));
        break;
      case 'favorites':
        result = result.filter(c => isFavorite?.(c.contactNumber) ?? false);
        break;
      case 'archived':
        result = result.filter(c => isArchived?.(c.contactNumber) ?? false);
        break;
    }

    // Ordenar: fixados primeiro, depois por data
    result.sort((a, b) => {
      if ((a as any).isPinned && !(b as any).isPinned) return -1;
      if (!(a as any).isPinned && (b as any).isPinned) return 1;
      return ((b as any).updatedAt || 0) - ((a as any).updatedAt || 0);
    });

    return result;
  }, [conversations, searchTerm, activeFilter, selectedLabelId, isFavorite, isArchived, getLabelsForPhone]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-full md:w-[400px] lg:w-[340px] xl:w-[400px]
        bg-white dark:bg-[#111b21] 
        border-r border-gray-200 dark:border-[#222d34]
        flex flex-col fixed md:relative inset-0 z-40 md:z-auto
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header - WhatsApp Web style */}
        <div className="h-[60px] bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-[#6b7c85] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 212 212" width="40" height="40">
                <path fill="#6b7c85" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
                <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z" />
              </svg>
            </div>
            <span className="text-black dark:text-[#e9edef] text-[16px] font-normal">
              Conversas
            </span>
          </div>
        </div>

        {/* Status de Conexão - QR Code se desconectado */}
        {!connected && qrCode && (
          <div className="bg-white dark:bg-[#111b21] p-4 flex flex-col items-center justify-center border-b border-gray-200 dark:border-[#222d34] flex-shrink-0">
            <h3 className="text-black dark:text-white font-medium mb-3 text-center text-[15px]">
              Conecte o seu WhatsApp
            </h3>
            <div className="bg-white p-2 rounded-lg mb-3 shadow-sm">
              <img 
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                alt="WhatsApp QR Code" 
                className="w-44 h-44 object-contain" 
              />
            </div>
            <p className="text-[13px] text-gray-500 dark:text-[#8696a0] text-center leading-snug">
              Abra o WhatsApp no seu celular, toque em <strong>Dispositivos Conectados</strong> e aponte a câmera para esta tela.
            </p>
          </div>
        )}

        {/* Search + Filters */}
        {connected && (
          <div className="bg-white dark:bg-[#111b21] flex-shrink-0 border-b border-gray-200 dark:border-[#222d34]">
            {/* Search Bar - WhatsApp Web style */}
            <div className="px-3 py-2">
              <div className="flex items-center bg-gray-100 dark:bg-[#202c33] rounded-lg px-3 gap-3 h-[35px] focus-within:bg-white dark:focus-within:bg-[#2a3942] transition-colors">
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
                    className="text-gray-500 dark:text-[#8696a0] hover:text-black dark:hover:text-white transition-colors"
                    title="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Pills */}
            <FilterPills 
              activeFilter={activeFilter} 
              onFilterChange={(f) => {
                setActiveFilter(f);
                if (f !== 'labels') setSelectedLabelId(null);
              }} 
              selectedLabelId={selectedLabelId}
              onSelectLabel={setSelectedLabelId}
              labels={labels}
            />
          </div>
        )}

        {/* Conversation List */}
        {connected && (
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21]">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#202c33] flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400 dark:text-[#8696a0]" />
                </div>
                <p className="text-gray-500 dark:text-[#8696a0] text-[14px] text-center">
                  {searchTerm 
                    ? `Nenhum resultado para "${searchTerm}"`
                    : 'Nenhuma conversa encontrada'
                  }
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-3 text-[#00a884] text-[14px] hover:underline"
                  >
                    Limpar busca
                  </button>
                )}
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
                  isFavorite={isFavorite?.(conv.contactNumber) ?? false}
                  onToggleFavorite={() => toggleFavorite?.(conv.contactNumber)}
                  isArchived={isArchived?.(conv.contactNumber) ?? false}
                  onToggleArchive={() => toggleArchive?.(conv.contactNumber)}
                  convLabels={getLabelsForPhone?.(conv.contactNumber) ?? []}
                  labels={labels}
                  onToggleLabel={(labelId) => toggleLabelOnConversation?.(conv.contactNumber, labelId)}
                />
              ))
            )}
          </div>
        )}
      </aside>
    </>
  );
}

// ==========================================
// COMPONENTE DE ITEM DE CONVERSA
// WhatsApp Web faithful
// ==========================================

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick,
  isFavorite,
  onToggleFavorite,
  isArchived,
  onToggleArchive,
  convLabels,
  labels,
  onToggleLabel,
}: { 
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  isArchived: boolean;
  onToggleArchive?: () => void;
  convLabels?: WhatsAppLabel[];
  labels?: WhatsAppLabel[];
  onToggleLabel?: (labelId: string) => void;
}) {
  const isGroup = conversation.id.includes('@g.us');
  const isPinned = (conversation as any).isPinned;
  const isMuted = (conversation as any).isMuted;
  const hasUnread = conversation.unreadCount > 0;

  // Determinar prefixo do último remetente (para grupos)
  const lastMessagePrefix = isGroup && (conversation as any).lastMessageSender 
    ? `${(conversation as any).lastMessageSender}: ` 
    : '';

  // Determinar ícone de status da última mensagem (para conversas individuais)
  const showCheckmarks = !isGroup && conversation.lastMessage && !hasUnread;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center px-3 py-[10px] cursor-pointer 
        transition-colors duration-100
        border-b border-gray-100 dark:border-[#222d34]
        ${isSelected 
          ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' 
          : 'hover:bg-gray-50 dark:hover:bg-[#202c33]'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Avatar */}
      <div className="w-[49px] h-[49px] rounded-full bg-gray-200 dark:bg-[#6b7c85] flex items-center justify-center flex-shrink-0 overflow-hidden mr-3 relative">
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
          <div className="absolute bottom-0 right-0 w-[13px] h-[13px] bg-[#00a884] rounded-full border-2 border-white dark:border-[#111b21]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + Time + Pin */}
        <div className="flex justify-between items-center mb-[2px]">
          <span className={`text-[17px] truncate flex-1 ${hasUnread ? 'font-medium text-black dark:text-[#e9edef]' : 'text-black dark:text-[#e9edef]'}`}>
            {conversation.contactName}
          </span>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {isPinned && (
              <Pin className="w-4 h-4 text-gray-400 dark:text-[#8696a0] rotate-45" />
            )}
            <span className={`text-[12px] ${
              hasUnread ? 'text-[#00a884] font-medium' : 'text-gray-500 dark:text-[#8696a0]'
            }`}>
              {conversation.timestamp}
            </span>
          </div>
        </div>

        {/* Last Message + Status + Unread */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Checkmarks for sent messages */}
            {showCheckmarks && (
              <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb] flex-shrink-0">
                <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
              </svg>
            )}
            
            {/* Message content */}
            <span className={`text-[14px] truncate leading-[20px] ${
              hasUnread ? 'text-black dark:text-[#e9edef] font-medium' : 'text-gray-500 dark:text-[#8696a0]'
            }`}>
              {lastMessagePrefix}{conversation.lastMessage}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Muted icon */}
            {isMuted && (
              <BellOff className="w-4 h-4 text-gray-400 dark:text-[#8696a0]" />
            )}
            
            {/* Unread badge */}
            {hasUnread && (
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
