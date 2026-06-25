'use client';

import { MessageCirclePlus } from 'lucide-react';

interface WhatsAppHeaderProps {
  onNewChat?: () => void;
}

export default function WhatsAppHeader({ onNewChat }: WhatsAppHeaderProps) {
  return (
    <header className="h-[60px] bg-white dark:bg-[#202c33] border-b border-gray-300 dark:border-[#222d34] flex items-center justify-between px-4 flex-shrink-0">
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
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all"
        >
          <MessageCirclePlus className="w-[22px] h-[22px]" />
        </button>
      </div>
    </header>
  );
}
