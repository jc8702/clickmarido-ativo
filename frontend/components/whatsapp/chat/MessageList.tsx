'use client';

import { useEffect, useRef } from 'react';
import { Check, CheckCheck, Image, Film, Music, FileText, SmilePlus, Forward, Reply, Trash2 } from 'lucide-react';
import { ParsedMessage, MessageType, groupMessagesByDate, MessageGroup, MessageStatus as MsgStatus } from './messageParser';

interface MessageListProps {
  messages?: ParsedMessage[];
  loading?: boolean;
}

// ==========================================
// COMPONENTE DE MÍDIA
// ==========================================

function MessageMedia({ msg }: { msg: ParsedMessage }) {
  const { type, media } = msg;
  
  if (!media) return null;
  
  // Placeholder para mídia (em produção, usaria URL real)
  const mediaPlaceholder = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative w-full max-w-[300px] rounded-lg overflow-hidden bg-gray-200 dark:bg-[#182229] mb-1">
            {media.thumbnail ? (
              <img 
                src={`data:image/jpeg;base64,${media.thumbnail}`} 
                alt={msg.caption || 'Imagem'}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <Image className="w-12 h-12 text-gray-400 dark:text-[#8696a0]" />
              </div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="relative w-full max-w-[300px] rounded-lg overflow-hidden bg-gray-200 dark:bg-[#182229] mb-1">
            {media.thumbnail ? (
              <div className="relative">
                <img 
                  src={`data:image/jpeg;base64,${media.thumbnail}`} 
                  alt={msg.caption || 'Vídeo'}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <Film className="w-12 h-12 text-gray-400 dark:text-[#8696a0]" />
              </div>
            )}
            {media.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {Math.floor(media.duration / 60)}:{String(media.duration % 60).padStart(2, '0')}
              </div>
            )}
          </div>
        );
        
      case 'audio':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#182229] rounded-lg mb-1">
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="h-8 flex items-center">
                <div className="w-full h-1 bg-gray-300 dark:bg-[#3b4a54] rounded-full overflow-hidden">
                  <div className="w-0 h-full bg-[#00a884] rounded-full" />
                </div>
              </div>
              {media.duration && (
                <div className="text-[11px] text-gray-500 dark:text-[#8696a0] mt-0.5">
                  0:{String(media.duration).padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'document':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#182229] rounded-lg mb-1 max-w-[280px]">
            <div className="w-10 h-10 rounded-lg bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#00a884]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-black dark:text-[#e9edef] truncate">
                {media.filename || 'Documento'}
              </div>
              {media.filesize && (
                <div className="text-[11px] text-gray-500 dark:text-[#8696a0]">
                  {formatFileSize(media.filesize)}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'sticker':
        return (
          <div className="w-full max-w-[200px] mb-1">
            {media.url ? (
              <img 
                src={media.url} 
                alt="Figurinha"
                className="w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-[150px] bg-gray-100 dark:bg-[#182229] rounded-lg">
                <SmilePlus className="w-12 h-12 text-gray-400 dark:text-[#8696a0]" />
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return mediaPlaceholder();
}

// ==========================================
// COMPONENTE DE RESPOSTA CITADA
// ==========================================

function ReplyPreview({ replyTo }: { replyTo: ParsedMessage['replyTo'] }) {
  if (!replyTo) return null;
  
  return (
    <div className="bg-[#f0f2f5] dark:bg-[#182229] rounded-t-lg p-2 mb-1 border-l-4 border-[#00a884]">
      <div className="flex items-center gap-1 text-[11px] text-[#00a884] font-medium mb-0.5">
        <Reply className="w-3 h-3" />
        <span>{replyTo.sender || 'Você'}</span>
      </div>
      <div className="text-[12px] text-gray-600 dark:text-[#8696a0] truncate">
        {replyTo.text}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE REAÇÃO
// ==========================================

function ReactionBubble({ msg }: { msg: ParsedMessage }) {
  if (msg.type !== 'reaction' || !msg.reaction) return null;
  
  return (
    <div className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="text-lg">{msg.reaction.emoji}</span>
        <span className="text-[11px] text-gray-500 dark:text-[#8696a0]">
          {msg.time}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE STATUS DA MENSAGEM
// ==========================================

function MessageStatus({ status }: { status: MsgStatus }) {
  const iconClass = "w-[16px] h-[15px]";
  
  switch (status) {
    case 'read':
      return (
        <span className="text-[#53bdeb] ml-0.5">
          <CheckCheck className={iconClass} />
        </span>
      );
    case 'delivered':
      return (
        <span className="text-[#8696a0] ml-0.5">
          <CheckCheck className={iconClass} />
        </span>
      );
    case 'sent':
      return (
        <span className="text-[#8696a0] ml-0.5">
          <Check className={iconClass} />
        </span>
      );
    case 'pending':
      return (
        <span className="text-gray-400 ml-0.5">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </span>
      );
    case 'error':
      return (
        <span className="text-red-500 ml-0.5 text-[12px]">
          ⚠️
        </span>
      );
    default:
      return null;
  }
}

// ==========================================
// COMPONENTE DE MENSAGEM
// ==========================================

function MessageBubble({ 
  msg, 
  isLastInGroup, 
  isFirstInGroup 
}: { 
  msg: ParsedMessage; 
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
}) {
  // Mensagens de sistema
  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-white/80 dark:bg-[#182229]/90 text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm text-center max-w-[80%]">
          {msg.text}
        </div>
      </div>
    );
  }
  
  // Reações
  if (msg.type === 'reaction') {
    return <ReactionBubble msg={msg} />;
  }
  
  return (
    <div className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} mb-[2px]}`}>
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
        {!msg.isMine && isFirstInGroup && msg.senderName && (
          <div className="text-[12.5px] font-medium text-[#00a884] mb-1">
            {msg.senderName}
          </div>
        )}
        
        {/* Reply preview */}
        {msg.isReply && msg.replyTo && (
          <ReplyPreview replyTo={msg.replyTo} />
        )}
        
        {/* Forwarded indicator */}
        {msg.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-[#8696a0] mb-1">
            <Forward className="w-3 h-3" />
            <span>Encaminhada</span>
          </div>
        )}
        
        {/* Media */}
        <MessageMedia msg={msg} />
        
        {/* Message text */}
        <div className="flex items-end gap-1">
          {msg.text && (
            <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
              {msg.text}
            </p>
          )}
          
          {/* Time + Status */}
          <div className="flex items-center gap-0.5 ml-1 flex-shrink-0 self-end mb-[2px]">
            <span className="text-[11px] text-gray-500 dark:text-gray-300 whitespace-nowrap">
              {msg.time}
            </span>
            {msg.isMine && (
              <MessageStatus status={msg.status} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

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

  // Agrupar mensagens por data
  const groups = groupMessagesByDate(messages);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto px-[5%] md:px-[8%] py-2 relative bg-[#e5ddd5] dark:bg-[#0b141a]"
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none dark:hidden"
        style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/rnj2LpE031a.png")' }}
      />
      
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
      
      {groups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date Divider */}
          <div className="flex justify-center my-3">
            <div className="bg-white/80 dark:bg-[#182229]/90 text-gray-600 dark:text-[#8696a0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
              {group.date}
            </div>
          </div>
          
          {/* Messages */}
          {group.messages.map((msg, msgIndex) => {
            const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : undefined;
            const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : undefined;
            
            const isFirstInGroup = !prevMsg || 
              prevMsg.isMine !== msg.isMine || 
              prevMsg.senderName !== msg.senderName;
            
            const isLastInGroup = !nextMsg || 
              nextMsg.isMine !== msg.isMine || 
              nextMsg.senderName !== msg.senderName;
            
            return (
              <MessageBubble 
                key={msg.id} 
                msg={msg}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
