'use client';

import { MessageCirclePlus, MoreVertical, Search, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface WhatsAppHeaderProps {
  onNewChat?: () => void;
  onFilterClick?: () => void;
}

export default function WhatsAppHeader({ onNewChat, onFilterClick }: WhatsAppHeaderProps) {
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

  return (
    <header className="h-[60px] bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center justify-between px-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <h1 className="text-black dark:text-white font-bold text-[17px]">WhatsApp</h1>
      </div>
      
      {/* Action Icons */}
      <div className="flex items-center gap-2">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          title="Nova conversa"
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#aebac1] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all"
        >
          <MessageCirclePlus className="w-[22px] h-[22px]" />
        </button>
        
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
              <button className="w-full text-left px-6 py-2.5 text-black dark:text-[#e9edef] text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors">
                Novo grupo
              </button>
              <button className="w-full text-left px-6 py-2.5 text-black dark:text-[#e9edef] text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors">
                Mensagens enviadas
              </button>
              <button className="w-full text-left px-6 py-2.5 text-black dark:text-[#e9edef] text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors">
                Mensagens favoritas
              </button>
              <button className="w-full text-left px-6 py-2.5 text-black dark:text-[#e9edef] text-[15px] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors">
                Configurações
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
