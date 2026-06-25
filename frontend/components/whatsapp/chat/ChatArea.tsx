'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { parseMessage, filterMessagesByChat, ParsedMessage } from './messageParser';
import { INSTANCE_NAME as DEFAULT_INSTANCE_NAME } from '../WhatsAppContainer';

export default function ChatArea({ conversation, apiFetch, INSTANCE_NAME: propInstanceName }: { conversation: any, apiFetch?: any, INSTANCE_NAME?: string }) {
  const instanceName = propInstanceName || DEFAULT_INSTANCE_NAME;
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdsRef = useRef<string>('');
  const currentChatIdRef = useRef<string>('');

  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    if (!apiFetch) return;
    if (!silent) setLoading(true);
    
    try {
      // 1. Tentar findMessages direto
      let loadedMessages: any[] = [];
      const targetJid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
      const res = await apiFetch(`/chat/findMessages/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: targetJid } })
      }).catch(() => null);

      if (res && res.ok) {
        const d = await res.json();
        // Extract messages helper logic
        if (d) {
          if (Array.isArray(d)) loadedMessages = d;
          else if (Array.isArray(d.records)) loadedMessages = d.records;
          else if (d.messages) {
            if (Array.isArray(d.messages)) loadedMessages = d.messages;
            else if (Array.isArray(d.messages.records)) loadedMessages = d.messages.records;
          }
          else if (Array.isArray(d.data)) loadedMessages = d.data;
        }
      }

      if (loadedMessages.length > 0) {
         // Filtrar mensagens apenas da conversa atual para evitar vazamento
         loadedMessages = filterMessagesByChat(loadedMessages, targetJid);

         // Usar o parser robusto para formatar mensagens
         const formattedMsgs = loadedMessages.map(m => parseMessage(m));
         
         formattedMsgs.sort((a, b) => a.timestamp - b.timestamp);
         setMessages(formattedMsgs);
         
         const newIdsStr = formattedMsgs.map(m => m.id).join(',');
         lastMessageIdsRef.current = newIdsStr;
      } else {
         setMessages([]);
         lastMessageIdsRef.current = '';
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [apiFetch, instanceName]);

  // Limpar mensagens ao trocar de conversa
  useEffect(() => {
    if (conversation?.id) {
       // Se mudou de conversa, limpar imediatamente
       if (currentChatIdRef.current !== conversation.id) {
         setMessages([]);
         lastMessageIdsRef.current = '';
         currentChatIdRef.current = conversation.id;
       }
       
       loadMessages(conversation.id);
       
       // Polling para atualizações
       chatPollingRef.current = setInterval(() => {
         loadMessages(conversation.id, true);
       }, 4000);
    }
    
    return () => {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
    };
  }, [conversation?.id, loadMessages]);

  const handleSendMessage = async (text: string, file: File | null = null) => {
    if (!apiFetch || (!text.trim() && !file)) return;
    
    try {
      const jid = conversation.id.includes('@') ? conversation.id : `${conversation.id}@s.whatsapp.net`;
      
      // Envio de arquivo / anexo
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          let mediaType = 'document';
          if (file.type.startsWith('image/')) mediaType = 'image';
          else if (file.type.startsWith('video/')) mediaType = 'video';
          else if (file.type.startsWith('audio/')) mediaType = 'audio';

          await apiFetch(`/message/sendMedia/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
              number: jid,
              mediaMessage: {
                mediatype: mediaType,
                mimetype: file.type,
                caption: text,
                media: base64,
                fileName: file.name
              }
            })
          });
          loadMessages(conversation.id, true);
        };
        return;
      }
      
      // Envio de texto simples
      await apiFetch(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: jid,
          textMessage: { text: text }
        })
      });
      
      loadMessages(conversation.id, true);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0b141a] relative">
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <ChatHeader conversation={conversation} />
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
