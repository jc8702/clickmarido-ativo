'use client';

import { useEffect, useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  time: string;
  timestamp?: number;
  status?: 'sent' | 'delivered' | 'read';
  isSystem?: boolean;
}

interface MessageListProps {
  messages?: Message[];
  loading?: boolean;
}

function formatDateDivider(timestamp?: number): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
}

function shouldShowDateDivider(currentMsg: Message, prevMsg?: Message): boolean {
  if (!prevMsg) return true;
  
  const currentDate = new Date((currentMsg.timestamp || 0) * 1000).toDateString();
  const prevDate = new Date((prevMsg.timestamp || 0) * 1000).toDateString();
  
  return currentDate !== prevDate;
}

export default function MessageList({ messages = [], loading = false }: MessageListProps) {
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
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto px-[5%] md:px-[8%] py-2 relative bg-[#e5ddd5] dark:bg-[#0b141a]"
    >
      {loading && messages.length === 0 && (
        <div className="flex justify-center py-4">
          <div className="bg-white/80 dark:bg-[#182229] text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
            Carregando mensagens...
          </div>
        </div>
      )}
      
      {!loading && messages.length === 0 && (
        <div className="flex justify-center my-4">
          <span className="bg-white/80 dark:bg-[#182229] text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
            Nenhuma mensagem encontrada
          </span>
        </div>
      )}
      
      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : undefined;
        const showDateDivider = shouldShowDateDivider(msg, prevMsg);
        const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.isMine !== msg.isMine;

        // System messages (encryption notice, etc)
        if (msg.isSystem) {
          return (
            <div key={msg.id} className="flex justify-center my-3">
              <div className="bg-white/80 dark:bg-[#182229]/90 text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm text-center">
                {msg.text}
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id}>
            {/* Date Divider */}
            {showDateDivider && (
              <div className="flex justify-center my-3">
                <div className="bg-white/80 dark:bg-[#182229]/90 text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
                  {formatDateDivider(msg.timestamp)}
                </div>
              </div>
            )}

            {/* Message Bubble */}
            <div className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} mb-[2px]`}>
              <div 
                className={`
                  relative max-w-[65%] rounded-lg px-[9px] pt-[6px] pb-[8px] shadow-sm
                  ${msg.isMine 
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-black dark:text-[#e9edef] rounded-tr-none' 
                    : 'bg-white dark:bg-[#202c33] text-black dark:text-[#e9edef] rounded-tl-none'
                  }
                  ${!isLastInGroup && msg.isMine ? 'rounded-tr-sm' : ''}
                  ${!isLastInGroup && !msg.isMine ? 'rounded-tl-sm' : ''}
                `}
              >
                {/* Sender name for groups */}
                {!msg.isMine && (prevMsg?.isMine || showDateDivider) && (
                  <div className="text-[12.5px] font-medium text-[#00a884] mb-1">
                    {msg.text.split(':')[0]}
                  </div>
                )}
                
                {/* Message text */}
                <div className="flex items-end gap-1">
                  <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                  
                  {/* Time + Status */}
                  <div className="flex items-center gap-0.5 ml-1 flex-shrink-0 self-end mb-[2px]">
                    <span className="text-[11px] text-gray-500 dark:text-gray-300 whitespace-nowrap">
                      {msg.time}
                    </span>
                    {msg.isMine && (
                      <span className="text-[#53bdeb] ml-0.5">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-[16px] h-[15px]" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-[16px] h-[15px]" />
                        ) : (
                          <Check className="w-[16px] h-[15px]" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
