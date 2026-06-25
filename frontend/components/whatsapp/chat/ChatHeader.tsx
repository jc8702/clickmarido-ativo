'use client';

import { Search, MoreVertical } from 'lucide-react';

interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  isOnline?: boolean;
}

export default function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <header className="h-16 px-4 bg-whatsapp-card border-b border-whatsapp-border flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-white font-bold">
            {conversation.contactName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div>
          <h2 className="text-white font-semibold">{conversation.contactName}</h2>
          <p className="text-gray-400 text-xs">
            {conversation.isOnline ? 'online' : 'visto por último hoje às 14:30'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-gray-400">
        <Search className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
        <MoreVertical className="w-5 h-5 cursor-pointer hover:text-whatsapp-green transition" />
      </div>
    </header>
  );
}
