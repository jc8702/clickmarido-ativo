'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { INSTANCE_NAME as DEFAULT_INSTANCE_NAME } from '../WhatsAppContainer';

export default function ChatArea({ conversation, apiFetch, INSTANCE_NAME: propInstanceName }: { conversation: any, apiFetch?: any, INSTANCE_NAME?: string }) {
  const instanceName = propInstanceName || DEFAULT_INSTANCE_NAME;
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdsRef = useRef<string>('');

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
         // Filtrar mensagens apenas da conversa atual para evitar vazamento de outras conversas
         const targetJid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
         loadedMessages = loadedMessages.filter(m => {
            const mJid = m.key?.remoteJid || m.remoteJid || '';
            // Ignorar sufixo :XXXX para lidar com JIDs antigos/múltiplos devices se existirem, ou usar exato
            return mJid === targetJid || mJid.split(':')[0] === targetJid.split(':')[0];
         });

         // Formatar mensagens para a UI
         const formattedMsgs = loadedMessages.map(m => {
            const isMe = m.fromMe === true;
            let text = 'Sem mensagem';
            
            const msgObj = m.message || m;
            if (msgObj) {
              if (msgObj.conversation) text = msgObj.conversation;
              else if (msgObj.extendedTextMessage?.text) text = msgObj.extendedTextMessage.text;
              else if (msgObj.imageMessage) text = msgObj.imageMessage.caption ? `📷 ${msgObj.imageMessage.caption}` : '📷 Foto';
              else if (msgObj.videoMessage) text = msgObj.videoMessage.caption ? `🎥 ${msgObj.videoMessage.caption}` : '🎥 Vídeo';
              else if (msgObj.audioMessage) text = '🎵 Áudio';
              else if (msgObj.documentMessage) text = msgObj.documentMessage.title ? `📄 ${msgObj.documentMessage.title}` : '📄 Documento';
              else if (msgObj.stickerMessage) text = '💟 Figurinha';
              else if (msgObj.ephemeralMessage?.message?.conversation) text = msgObj.ephemeralMessage.message.conversation;
              else if (msgObj.ephemeralMessage?.message?.extendedTextMessage?.text) text = msgObj.ephemeralMessage.message.extendedTextMessage.text;
            }
            
            let ts = m.messageTimestamp || m.timestamp || (Date.now() / 1000);
            if (ts > 1e11) ts = Math.floor(ts / 1000);
            
            const dateObj = new Date(ts * 1000);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return {
              id: m.key?.id || m.id || Math.random().toString(),
              text,
              isMine: isMe,
              time: timeStr,
              timestamp: ts
            };
         });
         
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

  useEffect(() => {
    if (conversation?.id) {
       setMessages([]);
       lastMessageIdsRef.current = '';
       loadMessages(conversation.id);
       
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
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] relative">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/rnj2LpE031a.png")' }}
      />
      
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <ChatHeader conversation={conversation} />
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
