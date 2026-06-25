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
