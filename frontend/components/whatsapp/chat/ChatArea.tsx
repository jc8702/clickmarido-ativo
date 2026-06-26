'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { parseMessage, filterMessagesByChat, ParsedMessage } from './messageParser';
import { INSTANCE_NAME as DEFAULT_INSTANCE_NAME } from '../utils/constants';
import { Conversation } from '../types';
import { SendMessageResult } from '../hooks/useEvolutionApi';

type SendTextFn = (number: string, text: string) => Promise<SendMessageResult>;
type SendMediaFn = (number: string, media: string, options?: { mediatype?: 'image' | 'video' | 'audio' | 'document'; mimetype?: string; caption?: string; fileName?: string }) => Promise<SendMessageResult>;

export default function ChatArea({ conversation, apiFetch, sendText, sendMedia, INSTANCE_NAME: propInstanceName, onCloseChat, onDeleteChat }: { conversation: Conversation, apiFetch?: any, sendText?: SendTextFn, sendMedia?: SendMediaFn, INSTANCE_NAME?: string, onCloseChat?: () => void, onDeleteChat?: () => void }) {
  const instanceName = propInstanceName || DEFAULT_INSTANCE_NAME;
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      }).catch((err: any) => {
        // Ignorar timeouts (apiFetch já gerencia seu próprio AbortController)
        if (err?.message === 'API_TIMEOUT') return null;
        throw err;
      });

      if (res && res.ok) {
        const d = await res.json();
        // Suporta múltiplos formatos de resposta da EvolutionAPI
        if (d) {
          if (Array.isArray(d)) loadedMessages = d;
          else if (Array.isArray(d.records)) loadedMessages = d.records;
          else if (d.messages) {
            if (Array.isArray(d.messages)) loadedMessages = d.messages;
            else if (Array.isArray(d.messages.records)) loadedMessages = d.messages.records;
          }
          else if (Array.isArray(d.data)) loadedMessages = d.data;
          else if (d.data && typeof d.data === 'object') {
            // Suporte a formato { data: { records: [...] } }
            const dataObj = d.data as any;
            if (Array.isArray(dataObj.records)) loadedMessages = dataObj.records;
          }
        }
      }

      if (loadedMessages.length > 0) {
         // Filtrar mensagens apenas da conversa atual para evitar vazamento
         loadedMessages = filterMessagesByChat(loadedMessages, targetJid);

         // Usar o parser robusto para formatar mensagens
         const formattedMsgs = loadedMessages.map(m => parseMessage(m));
         
         formattedMsgs.sort((a, b) => a.timestamp - b.timestamp);
         
         // Deduplicação: só atualizar estado se houve mudança real
         const newIdsStr = formattedMsgs.map(m => m.id).join(',');
         if (newIdsStr !== lastMessageIdsRef.current) {
           setMessages(formattedMsgs);
           lastMessageIdsRef.current = newIdsStr;
         }
         setError(null);
      } else if (!silent) {
         // Só limpar mensagens se não for polling silencioso
         setMessages([]);
         lastMessageIdsRef.current = '';
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      if (!silent) {
        setError('Erro ao carregar mensagens. Verifique a conexão.');
      }
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
         setError(null);
       }
       
       loadMessages(conversation.id);
       
       // Polling para atualizações silenciosas
       chatPollingRef.current = setInterval(() => {
         loadMessages(conversation.id, true);
       }, 4000);
    }
    
    return () => {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
    };
  }, [conversation?.id, loadMessages]);

  const handleSendMessage = async (text: string, file: File | null = null) => {
    if (!sendText || (!text.trim() && !file)) return;
    
    const jid = conversation.id.includes('@') ? conversation.id : `${conversation.id}@s.whatsapp.net`;
    
    try {
      // Envio de arquivo / anexo
      if (file && sendMedia) {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('video/')) mediaType = 'video';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';

            try {
              const result = await sendMedia(jid, base64, {
                mediatype: mediaType,
                mimetype: file.type,
                caption: text,
                fileName: file.name,
              });
              
              if (!result.success) {
                setError(result.error || 'Erro ao enviar mídia. Tente novamente.');
              } else {
                loadMessages(conversation.id, true);
              }
            } catch (err) {
              setError('Erro ao enviar mídia. Verifique a conexão.');
            }
            resolve();
          };
          reader.onerror = () => {
            setError('Erro ao processar arquivo.');
            resolve();
          };
        });
      }
      
      // Envio de texto simples
      const result = await sendText(jid, text);
      
      if (!result.success) {
        setError(result.error || 'Erro ao enviar mensagem. Tente novamente.');
      } else {
        loadMessages(conversation.id, true);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError('Erro ao enviar mensagem. Verifique a conexão.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0b141a] relative">
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <ChatHeader conversation={conversation} onCloseChat={onCloseChat} onDeleteChat={onDeleteChat} />
        
        {/* Barra de erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2 flex items-center justify-between">
            <span className="text-red-700 dark:text-red-300 text-[13px]">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 text-[13px] font-medium"
            >
              ✕
            </button>
          </div>
        )}
        
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
