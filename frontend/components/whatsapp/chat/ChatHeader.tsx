'use client';

import { MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatHeaderProps {
  conversation: {
    id: string;
    contactName: string;
    contactNumber: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  onCloseChat?: () => void;
  onDeleteChat?: () => void;
}

export default function ChatHeader({ conversation, onCloseChat, onDeleteChat }: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGroup = conversation.id.includes('@g.us');

  return (
    <header className="h-[60px] bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center justify-between px-4 flex-shrink-0">
      {/* Contact Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-[40px] h-[40px] rounded-full bg-gray-400 dark:bg-[#6b7c85] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 212 212" width="40" height="40">
              <path fill="#6b7c85" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z" />
              <path fill="#cfd4d6" d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z" />
            </svg>
          )}
        </div>
        
        {/* Name + Status */}
        <div className="min-w-0">
          <h2 className="text-black dark:text-[#e9edef] text-[16px] font-normal truncate">
            {conversation.contactName}
          </h2>
          <p className="text-gray-500 dark:text-[#8696a0] text-[13px] truncate">
            {conversation.isOnline 
              ? 'online' 
              : conversation.lastSeen 
                ? `visto por último hoje às ${conversation.lastSeen}`
                : isGroup ? 'toque para ver informações do grupo' : 'clique para ver mensagens'
            }
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#aebac1] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[230px] bg-white dark:bg-[#233138] rounded-md shadow-lg py-2 z-50">
              {onCloseChat && (
                <button 
                  onClick={() => { onCloseChat(); setMenuOpen(false); }}
                  className="w-full text-left px-6 py-2.5 text-black dark:text-[#e9edef] text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                >
                  Fechar conversa
                </button>
              )}
              {onDeleteChat && (
                <button 
                  onClick={() => { 
                    if (window.confirm('Tem certeza que deseja apagar esta conversa?')) {
                      onDeleteChat(); 
                    }
                    setMenuOpen(false); 
                  }}
                  className="w-full text-left px-6 py-2.5 text-red-500 text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                >
                  Apagar conversa
                </button>
              )}
              {!onCloseChat && !onDeleteChat && (
                <div className="px-6 py-2.5 text-gray-400 dark:text-[#8696a0] text-[13px]">
                  Nenhuma ação disponível
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
