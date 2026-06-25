'use client';

import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  time: string;
}

export default function MessageList({ messages = [], loading = false }: { messages?: Message[], loading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 relative">
      {loading && messages.length === 0 && (
        <div className="text-center py-4 text-gray-500">
           Carregando mensagens...
        </div>
      )}
      
      {!loading && messages.length === 0 && (
         <div className="flex justify-center my-4">
            <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow-sm">
               Nenhuma mensagem encontrada
            </span>
         </div>
      )}
      
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[85%] md:max-w-[65%] rounded-lg px-3 pt-2 pb-1 relative shadow-sm
            ${msg.isMine ? 'bg-whatsapp-sent text-white rounded-tr-none' : 'bg-whatsapp-card text-white rounded-tl-none'}`}
          >
            <p className="text-[14.2px] leading-relaxed mb-3 mr-12 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
            
            <div className="absolute bottom-1 right-2 flex items-center gap-1">
              <span className="text-[11px] text-gray-300">{msg.time}</span>
              {msg.isMine && (
                <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb]">
                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                </svg>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
