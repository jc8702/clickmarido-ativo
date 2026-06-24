'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { TableShimmer } from '@/components/Shimmer';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { toast } from 'react-hot-toast';

// Configurações da Evolution API Local
const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
const INSTANCE_NAME = 'clickmarido_instance';

// Helpers para estilo WhatsApp
const parseToDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  
  if (typeof val === 'number') {
    if (val < 9999999999) return new Date(val * 1000);
    return new Date(val);
  }
  
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num)) {
      if (num < 9999999999) return new Date(num * 1000);
      return new Date(num);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  
  return new Date();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-[#df5138]', 'bg-[#54be54]', 'bg-[#e2a82b]', 'bg-[#9158e2]', 
    'bg-[#e258a5]', 'bg-[#3b82f6]', 'bg-[#14b8a6]', 'bg-[#f97316]'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return 'WA';
  const cleanName = name.replace(/\D/g, '').length > 5 ? 'Cliente' : name; // se for só número, põe Cliente
  const parts = cleanName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'WA';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
};

const formatChatTime = (dateVal?: any) => {
  if (!dateVal) return '';
  try {
    const date = parseToDate(dateVal);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Ontem';
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

const getMessageBody = (m: any): string => {
  if (!m) return 'Sem mensagem';
  if (typeof m === 'string') return m;
  
  const msg = m.message || m;
  if (!msg) return 'Sem mensagem';
  
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  
  if (msg.imageMessage) {
    return msg.imageMessage.caption ? `📷 ${msg.imageMessage.caption}` : '📷 Foto';
  }
  if (msg.videoMessage) {
    return msg.videoMessage.caption ? `🎥 ${msg.videoMessage.caption}` : '🎥 Vídeo';
  }
  if (msg.audioMessage) return '🎵 Áudio';
  if (msg.documentMessage) {
    return msg.documentMessage.title ? `📄 ${msg.documentMessage.title}` : '📄 Documento';
  }
  if (msg.stickerMessage) return '💟 Figurinha';
  
  if (msg.ephemeralMessage?.message) {
    return getMessageBody(msg.ephemeralMessage.message);
  }
  if (msg.viewOnceMessage?.message) {
    return getMessageBody(msg.viewOnceMessage.message);
  }
  if (msg.viewOnceMessageV2?.message) {
    return getMessageBody(msg.viewOnceMessageV2.message);
  }
  if (msg.reactionMessage) {
    return `Reagiu com: ${msg.reactionMessage.text || ''}`;
  }
  
  return '[Mídia]';
};

interface Chat {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: string;
  updatedAt?: string;
}

interface Message {
  id: string;
  fromMe: boolean;
  body: string;
  timestamp: number;
}

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'logs'>('live');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados do WhatsApp Live
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Função para fazer scroll para baixo
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Rolar para o fim sempre que as mensagens forem carregadas ou atualizadas
  useEffect(() => {
    if (chatMessages.length > 0) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, scrollToBottom]);

  // Logs de notificações automáticas
  const { messages, total, totalPages, isLoading: loadingLogs, mutate: mutateLogs } = useMessages({
    page,
    limit: 15,
    search: debouncedSearch,
    status: statusFilter,
  });

  useEscapeToClose(isModalOpen, () => setIsModalOpen(false));

  // Debounce para busca de logs
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Função para fazer fetch com autenticação na Evolution API
  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      ...(options.headers || {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
  }, []);

  // Verificar o status da API e da Conexão do WhatsApp
  const checkConnectionStatus = useCallback(async () => {
    try {
      // 1. Verificar se o servidor Evolution API está de fato respondendo
      const healthRes = await fetch(`${API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': API_KEY }
      }).catch(() => null);

      if (!healthRes) {
        setApiOnline(false);
        setConnected(false);
        return;
      }

      setApiOnline(true);
      const data = await healthRes.json();

      // Se a instância não existe, criar uma nova
      if (data.status === 404 || data.error === 'Not Found' || (data.response?.message && data.response.message[0]?.includes('does not exist'))) {
        setConnected(false);
        const createRes = await apiFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            token: API_KEY,
            qrcode: true
          })
        }).catch(() => null);

        if (createRes && createRes.ok) {
          const createData = await createRes.json();
          const qr = createData.qrcode?.base64 || createData.base64 || null;
          setQrCode(qr);
        }
        return;
      }
      
      if (data.instance?.state === 'open' || data.state === 'open') {
        setConnected(true);
        setQrCode(null);
      } else {
        setConnected(false);
        // Tentar obter ou gerar QR Code se não estiver conectado
        const connectRes = await apiFetch(`/instance/connect/${INSTANCE_NAME}`, { method: 'POST' }).catch(() => null);
        if (connectRes && connectRes.ok) {
          const connectData = await connectRes.json();
          const qr = connectData.base64 || connectData.qrcode?.base64 || connectData.code || null;
          setQrCode(qr);
        }
      }
    } catch (err) {
      setApiOnline(false);
      setConnected(false);
    }
  }, [apiFetch]);

  // Carregar lista de conversas/chats
  const loadChats = useCallback(async () => {
    if (!connected) return;
    setLoadingChats(true);
    try {
      const res = await apiFetch(`/chat/findChats/${INSTANCE_NAME}`);
      if (res.ok) {
        const data = await res.json();
        // Normalizar dados da Evolution API
        const list = (data || []).map((c: any) => {
          // Determinar data de forma robusta
          let chatDate = c.updatedAt || c.createdAt;
          if (!chatDate && c.lastMessage?.messageTimestamp) {
            chatDate = c.lastMessage.messageTimestamp;
          }
          if (!chatDate) {
            chatDate = Date.now() / 1000;
          }
          
          return {
            id: c.id || c.jid,
            name: c.name || c.id?.split('@')[0] || 'Contato',
            unreadCount: c.unreadCount || 0,
            lastMessage: getMessageBody(c.lastMessage),
            updatedAt: chatDate,
          };
        });

        // Ordenação lógica do WhatsApp:
        // 1. Mensagens não lidas primeiro
        // 2. Por data decrescente (mais recente primeiro)
        list.sort((a: any, b: any) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          
          const dateA = parseToDate(a.updatedAt).getTime() || 0;
          const dateB = parseToDate(b.updatedAt).getTime() || 0;
          return dateB - dateA;
        });

        setChats(list);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [connected, apiFetch]);

  // Carregar mensagens de uma conversa selecionada
  const loadMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/chat/findMessages/${INSTANCE_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          where: { key: { remoteJid: chatId } },
          limit: 40
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Evolution API retorna uma lista de mensagens
        const list = (data.records || data || []).map((m: any) => {
          let ts = m.messageTimestamp;
          if (!ts && m.createdAt) {
            ts = new Date(m.createdAt).getTime() / 1000;
          }
          if (!ts) {
            ts = Date.now() / 1000;
          }
          
          return {
            id: m.key?.id || String(Math.random()),
            fromMe: m.key?.fromMe ?? false,
            body: getMessageBody(m),
            timestamp: ts,
          };
        });
        
        // Garantir ordenação cronológica estrita crescente (antigas no topo, novas embaixo)
        list.sort((a: any, b: any) => a.timestamp - b.timestamp);
        
        setChatMessages(list);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [apiFetch]);

  // Enviar nova mensagem no chat vivo
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChat) return;

    const textToSend = newMessageText;
    setNewMessageText('');

    try {
      const res = await apiFetch(`/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          number: selectedChat.id.split('@')[0],
          text: textToSend
        })
      });

      if (res.ok) {
        // Adicionar localmente para feedback instantâneo
        setChatMessages(prev => [
          ...prev,
          {
            id: String(Math.random()),
            fromMe: true,
            body: textToSend,
            timestamp: Date.now() / 1000
          }
        ]);
        // Atualizar lista de chats
        setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, lastMessage: textToSend } : c));
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (err) {
      toast.error('Erro de conexão ao enviar mensagem');
    }
  };

  // Poll de status a cada 10 segundos
  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 10000);
    return () => clearInterval(interval);
  }, [checkConnectionStatus]);

  // Carregar conversas quando pareado
  useEffect(() => {
    if (connected) {
      loadChats();
    }
  }, [connected, loadChats]);

  // Carregar mensagens quando um chat é selecionado
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat, loadMessages]);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(chatSearch.toLowerCase()) || 
    chat.id.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            WhatsApp Hub
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Espelhe seu WhatsApp Web local de graça ou visualize o histórico de notificações automáticas.
          </p>
        </div>
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'live'
                ? 'bg-white dark:bg-neutral-900 shadow-sm text-purple-600 dark:text-purple-400'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            💬 Chat Vivo (WhatsApp Web)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-neutral-900 shadow-sm text-purple-600 dark:text-purple-400'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            📋 Logs de Notificações
          </button>
        </div>
      </div>

      {/* ABA 1: CHAT LIVE */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Diagnóstico da API Offline */}
          {apiOnline === false && (
            <Card className="lg:col-span-3 p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-neutral-50 dark:from-neutral-800/20 to-white dark:to-neutral-900">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-8 h-8 animate-bounce-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Serviço de WhatsApp Local Desconectado</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Para utilizar o Chat de WhatsApp gratuitamente sem pagar por APIs oficiais, você precisa rodar a Evolution API localmente na sua máquina usando o Docker.
                </p>
              </div>

              {/* Bloco de Código com Comando Docker */}
              <div className="w-full max-w-lg bg-neutral-900 text-neutral-200 p-4 rounded-xl text-left font-mono text-xs overflow-x-auto border border-neutral-800 shadow-inner">
                <p className="text-neutral-500 mb-1"># Execute este comando no terminal para iniciar o serviço:</p>
                <p className="text-purple-400 select-all">docker run -d --name evolution-api -p 8080:8080 -e AUTHENTICATION_API_KEY=clickmarido_key -e TEMPLATE_ENABLED=true evoapicloud/evolution-api:v1.8.2</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={checkConnectionStatus} size="sm">
                  🔄 Verificar Conexão Novamente
                </Button>
              </div>
            </Card>
          )}

          {/* Aguardando Pareamento (Exibe QR Code) */}
          {apiOnline === true && !connected && (
            <Card className="lg:col-span-3 p-8 flex flex-col md:flex-row items-center justify-center gap-12 bg-white dark:bg-neutral-850">
              <div className="space-y-4 max-w-sm">
                <Badge variant="warning">Aguardando Escaneamento</Badge>
                <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-200">Conecte seu WhatsApp</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Abra o WhatsApp no seu celular, vá em **Aparelhos conectados** &rarr; **Conectar aparelho** e aponte a câmera para o QR Code ao lado.
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs text-neutral-400">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping"></span>
                  Buscando e atualizando QR Code em tempo real...
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                {qrCode ? (
                  <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" className="w-48 h-48 rounded" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                    Gerando QR Code...
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Layout Principal de Chat Ativo (3 colunas: 1 lista, 2 conversas) */}
          {apiOnline === true && connected && (
            <>
              {/* Lista de Conversas (Col 1) */}
              <Card className="flex flex-col h-full overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 bg-white dark:bg-[#111b21]">
                <div className="p-3 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-[#f0f2f5] dark:bg-[#202c33] flex justify-between items-center">
                  <h3 className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                    Conversas Ativas ({filteredChats.length})
                  </h3>
                  <button onClick={loadChats} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                    🔄 Atualizar
                  </button>
                </div>
                
                {/* Campo de Pesquisa de Contatos estilo WhatsApp */}
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-[#f0f2f5] dark:bg-[#111b21] flex items-center">
                  <div className="flex-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Pesquisar ou começar uma nova conversa"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-[#202c33] border-none rounded-lg text-xs text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {loadingChats ? (
                    <div className="p-4 text-center text-xs text-neutral-400">Carregando chats...</div>
                  ) : filteredChats.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400">Nenhuma conversa encontrada.</div>
                  ) : (
                    filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#2a3942]/40 transition-colors flex items-center gap-3 ${
                          selectedChat?.id === chat.id ? 'bg-[#efeae2]/45 dark:bg-[#2a3942]/20 border-l-4 border-emerald-500' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner shrink-0 ${getAvatarColor(chat.name)}`}>
                          {getInitials(chat.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className="font-bold text-xs text-neutral-850 dark:text-neutral-200 truncate">{chat.name}</p>
                            <span className="text-[9px] text-neutral-400 shrink-0 ml-2">
                              {formatChatTime(chat.updatedAt)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-400 truncate pr-2">
                              {chat.lastMessage}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="bg-emerald-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full shrink-0 animate-pulse">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Box de Chat da Conversa Selecionada (Col 2 e 3) */}
              <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 bg-[#efeae2] dark:bg-[#0b141a] transition-all relative">
                {selectedChat ? (
                  <>
                    {/* Header da Conversa */}
                    <div className="p-3 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-3 z-10 shadow-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner ${getAvatarColor(selectedChat.name)}`}>
                        {getInitials(selectedChat.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-neutral-850 dark:text-neutral-200 truncate">{selectedChat.name}</h3>
                        <p className="text-[10px] text-neutral-400 font-mono truncate">{selectedChat.id.split('@')[0]}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Online
                      </div>
                    </div>

                    {/* Timeline de Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#fff_1px,transparent_1px)]" />
                      
                      <div className="relative z-10 space-y-2">
                        {loadingMessages ? (
                          <div className="text-center text-xs text-neutral-400 py-12">Carregando histórico...</div>
                        ) : (
                          chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-xl px-3 py-1.5 text-xs shadow-sm relative leading-relaxed ${
                                  msg.fromMe
                                    ? 'bg-[#d9fdd3] text-neutral-800 dark:bg-[#005c4b] dark:text-neutral-100 rounded-tr-none'
                                    : 'bg-white text-neutral-800 dark:bg-[#202c33] dark:text-neutral-100 rounded-tl-none'
                                }`}
                              >
                                <p className="pr-10 break-words">{msg.body}</p>
                                <span className={`text-[9px] absolute bottom-1 right-2 ${msg.fromMe ? 'text-neutral-500/80 dark:text-neutral-300/80' : 'text-neutral-400/80'}`}>
                                  {formatChatTime(msg.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Barra de Input para Enviar Mensagem */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex gap-2 items-center border-t border-neutral-200/50 dark:border-neutral-800/50 z-10">
                      <div className="flex-1">
                        <input
                          required
                          type="text"
                          placeholder="Digite uma mensagem..."
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#2a3942] border-none rounded-full text-xs text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white rounded-full flex items-center justify-center shadow-md shrink-0"
                      >
                        <svg className="w-4 h-4 rotate-45 transform translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 relative">
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#fff_1px,transparent_1px)]" />
                    <div className="relative z-10 flex flex-col items-center">
                      <svg className="w-16 h-16 mb-4 text-emerald-600/60 dark:text-emerald-400/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18a5.969 5.969 0 01-.474-3.65A8.962 8.962 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">WhatsApp Web Emulado</h4>
                      <p className="text-xs max-w-xs leading-relaxed text-neutral-500 dark:text-neutral-400">Selecione uma conversa ativa ao lado para visualizar o histórico de mensagens e responder em tempo real.</p>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ABA 2: LOGS DE NOTIFICAÇÕES DO CRM (CÓDIGO ORIGINAL) */}
      {activeTab === 'logs' && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar por telefone nos logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-neutral-800 dark:text-neutral-200"
            >
              <option value="">Todos os status</option>
              <option value="SENT">Enviado</option>
              <option value="FAILED">Falha</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variáveis / Erro</TableHead>
                </TableRow>
              </TableHeader>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loadingLogs ? (
                  <TableShimmer cols={5} rows={5} />
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                      Nenhuma notificação encontrada no banco de dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="whitespace-nowrap text-sm text-neutral-800 dark:text-neutral-200">
                        {new Date(msg.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-neutral-800 dark:text-neutral-200">
                        {msg.phone}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                        {msg.template}
                      </TableCell>
                      <TableCell>
                        <Badge variant={msg.status === 'SENT' ? 'success' : 'danger'}>
                          {msg.status === 'SENT' ? 'Enviado' : 'Falha'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate" title={msg.error || JSON.stringify(msg.variables)}>
                        {msg.status === 'FAILED' ? msg.error : JSON.stringify(msg.variables)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Página {page} de {totalPages} ({total} registros)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <NewMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          mutateLogs();
        }}
      />
    </div>
  );
}

function NewMessageModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState('payment_reminder');
  const [var1, setVar1] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          template,
          variables: { '1': var1 }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Mensagem enviada com sucesso!');
      onSuccess();
      setPhone('');
      setVar1('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-bold mb-4">Enviar Mensagem Rápida</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-850 dark:text-neutral-200">Telefone (com DDD)</label>
            <Input
              required
              placeholder="Ex: 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-850 dark:text-neutral-200">Template</label>
            <select
              required
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-800 dark:text-neutral-200"
            >
              <option value="payment_reminder">Lembrete de Pagamento</option>
              <option value="service_order_completed">OS Concluída</option>
              <option value="warranty_expiring">Garantia Expirando</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-850 dark:text-neutral-200">Variável 1 (Nome do Cliente, etc)</label>
            <Input
              required
              placeholder="Valor da variável do template..."
              value={var1}
              onChange={(e) => setVar1(e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">Preencha com o nome ou número do documento, conforme esperado pelo template da Meta.</p>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
