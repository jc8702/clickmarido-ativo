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
  pushName?: string;
  sender?: string;
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

  // Estados do WhatsApp Live adicionais para clone
  const [sidebarMode, setSidebarMode] = useState<'chats' | 'contacts'>('chats');
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  // Mapa de JID/telefone -> nome real (da Evolution API)
  const [contactsMap, setContactsMap] = useState<Record<string, string>>({});

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdsRef = useRef<string>('');
  const lastQrGenerationRef = useRef<number>(0);

  // Função para fazer scroll para baixo
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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
        lastQrGenerationRef.current = Date.now();
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
        lastQrGenerationRef.current = 0;
      } else {
        setConnected(false);
        // Evitar gerar QR Codes repetitivos em intervalos curtos (cooldown de 50s) para não interromper a leitura do usuário
        const now = Date.now();
        const timeSinceLastGen = now - lastQrGenerationRef.current;
        if (!qrCode || timeSinceLastGen > 50000) {
          lastQrGenerationRef.current = now;
          const connectRes = await apiFetch(`/instance/connect/${INSTANCE_NAME}`, { method: 'POST' }).catch(() => null);
          if (connectRes && connectRes.ok) {
            const connectData = await connectRes.json();
            const qr = connectData.base64 || connectData.qrcode?.base64 || connectData.code || null;
            setQrCode(qr);
          }
        }
      }
    } catch (err) {
      setApiOnline(false);
      setConnected(false);
    }
  }, [apiFetch, qrCode]);

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
            name: c.name || c.pushName || c.lastMessage?.pushName || c.id?.split('@')[0] || 'Contato',
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

  // Buscar nomes reais dos contatos na Evolution API
  const loadWaContacts = useCallback(async () => {
    try {
      // Tenta GET primeiro
      let contacts: any[] = [];
      const resGet = await apiFetch(`/contact/findContacts/${INSTANCE_NAME}`).catch(() => null);
      if (resGet && resGet.ok) {
        const d = await resGet.json();
        contacts = Array.isArray(d) ? d : (d.contacts || d.data || []);
      }
      // Fallback: POST sem filtro
      if (contacts.length === 0) {
        const resPost = await apiFetch(`/contact/findContacts/${INSTANCE_NAME}`, {
          method: 'POST',
          body: JSON.stringify({ limit: 500 })
        }).catch(() => null);
        if (resPost && resPost.ok) {
          const d = await resPost.json();
          contacts = Array.isArray(d) ? d : (d.contacts || d.data || []);
        }
      }
      if (contacts.length > 0) {
        const map: Record<string, string> = {};
        contacts.forEach((c: any) => {
          const name = c.pushName || c.name || c.verifiedName || c.notify || '';
          if (!name) return;
          // Indexar pelo JID completo e pelo número puro
          const jid = c.id || c.remoteJid || c.jid || '';
          if (jid) {
            map[jid] = name;
            map[jid.split('@')[0]] = name;
          }
        });
        setContactsMap(map);
      }
    } catch (err) {
      console.error('Error loading WA contacts:', err);
    }
  }, [apiFetch]);

  // Carregar contatos do CRM
  const loadCrmContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/customers?limit=150', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const list = result.data || result || [];
        setCrmCustomers(list);
      }
    } catch (err) {
      console.error('Error loading CRM contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Resolver nome de um chat priorizando: contactsMap > nome da API > pushName > número
  const resolveName = useCallback((chat: Chat): string => {
    if (chat.id.includes('@g.us')) {
       // Se for um grupo, tentamos usar o chat.name. Se for apenas o ID numérico ou vazio, fallback para "Grupo WhatsApp"
       if (chat.name && chat.name !== 'Contato' && !chat.name.includes('-')) {
         return chat.name;
       }
       return 'Grupo WhatsApp';
    }
    const phone = chat.id.split('@')[0];
    const resolved = contactsMap[chat.id] || contactsMap[phone] || chat.name;
    if (resolved && resolved !== 'Contato' && resolved !== phone) return resolved;
    
    // Se não achou nome, formata o telefone para ficar amigável
    if (phone.length > 10) {
      return `+${phone.slice(0,2)} ${phone.slice(2,4)} ${phone.slice(4,9)}-${phone.slice(9)}`;
    }
    return phone;
  }, [contactsMap]);

  // ── Função auxiliar: extrai lista de mensagens de qualquer formato de resposta da Evolution API
  const extractMessages = (d: any): any[] => {
    if (!d) return [];
    if (Array.isArray(d)) return d;
    // { records: [...] }
    if (Array.isArray(d.records)) return d.records;
    // { messages: [...] } or { messages: { records: [...] } }
    if (d.messages) {
      if (Array.isArray(d.messages)) return d.messages;
      if (Array.isArray(d.messages.records)) return d.messages.records;
    }
    // { data: [...] }
    if (Array.isArray(d.data)) return d.data;
    return [];
  };

  // Carregar mensagens de uma conversa selecionada — estratégia de 3 camadas
  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const phoneNumber = chatId.split('@')[0];
      const last8 = phoneNumber.slice(-8); // últimos 8 dígitos para fuzzy matching (9º dígito BR)

      let rawList: any[] = [];

      const tryPost = async (body: object): Promise<any[]> => {
        const res = await apiFetch(`/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          body: JSON.stringify(body)
        }).catch(() => null);
        if (!res || !res.ok) return [];
        const d = await res.json();
        return extractMessages(d);
      };

      // Gerar variação do número (problema do 9º dígito no Brasil)
      const isBR = phoneNumber.startsWith('55') && phoneNumber.length >= 12;
      let altChatId = '';
      if (isBR) {
        const ddd = phoneNumber.slice(2, 4);
        const rest = phoneNumber.slice(4);
        if (rest.length === 9) {
          altChatId = `55${ddd}${rest.slice(1)}@s.whatsapp.net`;
        } else if (rest.length === 8) {
          altChatId = `55${ddd}9${rest}@s.whatsapp.net`;
        }
      }

      // Estratégia 1 — filtro Prisma por remoteJid (campo direto)
      let list1 = await tryPost({ where: { remoteJid: chatId }, limit: 100 });
      let list2: any[] = [];
      if (altChatId) {
        list2 = await tryPost({ where: { remoteJid: altChatId }, limit: 100 });
      }
      
      rawList = [...list1, ...list2];

      // Estratégia 2 — filtro Prisma JSON nested
      if (rawList.length === 0) {
        list1 = await tryPost({ where: { key: { path: ['remoteJid'], equals: chatId } }, limit: 100 });
        if (altChatId) {
          list2 = await tryPost({ where: { key: { path: ['remoteJid'], equals: altChatId } }, limit: 100 });
        }
        rawList = [...list1, ...list2];
      }

      // Estratégia 3 — sem filtro servidor + filtragem 100% client-side
      if (rawList.length === 0) {
        rawList = await tryPost({ limit: 400 });
      }

      // ── Filtragem client-side robusta ──
      const filtered = rawList.filter((m: any) => {
        // Pegar JID de todas as posições possíveis
        const jid = m.key?.remoteJid || m.remoteJid || m.chatId || '';
        if (!jid) return false;
        const jidPhone = jid.split('@')[0];
        // Match exato OU últimos 8 dígitos (lida com variação do 9º dígito)
        return jidPhone === phoneNumber || jidPhone.slice(-8) === last8;
      });

      // ── Mapear e deduplicar por ID ──
      const seen = new Set<string>();
      const list = filtered
        .map((m: any) => {
          let ts = m.messageTimestamp;
          if (!ts && m.createdAt) ts = new Date(m.createdAt).getTime() / 1000;
          if (!ts) ts = Date.now() / 1000;
          const id = m.key?.id || m.id || `rnd-${Math.random()}`;
          return {
            id,
            fromMe: m.key?.fromMe ?? m.fromMe ?? false,
            body: getMessageBody(m),
            timestamp: ts,
            pushName: m.pushName || m.participant || '',
            sender: m.key?.participant || m.participant || m.key?.remoteJid || m.remoteJid || '',
          };
        })
        .filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

      list.sort((a, b) => a.timestamp - b.timestamp);

      // Atualizar state apenas quando os IDs mudarem (evita re-renders desnecessários)
      const newIds = list.map(m => m.id).join(',');
      if (newIds !== lastMessageIdsRef.current) {
        lastMessageIdsRef.current = newIds;
        setChatMessages(list);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [apiFetch]);


  // Enviar nova mensagem no chat vivo
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChat) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');

    // Adicionar localmente imediatamente para feedback instantâneo (optimistic UI)
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      fromMe: true,
      body: textToSend,
      timestamp: Date.now() / 1000
    };
    setChatMessages(prev => [...prev, optimisticMsg]);

    const phoneNumber = selectedChat.id.split('@')[0];

    // Tentar múltiplos formatos de body (v1.8.x e v2 da Evolution API)
    const payloads = [
      // Formato v2 / mais recente
      { number: phoneNumber, textMessage: { text: textToSend } },
      // Formato v1.x legado
      { number: phoneNumber, text: textToSend },
      // Formato alternativo com options
      { number: phoneNumber, options: { delay: 1200 }, textMessage: { text: textToSend } },
    ];

    let sent = false;
    for (const payload of payloads) {
      try {
        const res = await apiFetch(`/message/sendText/${INSTANCE_NAME}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          sent = true;
          // Atualizar lista de chats com a última mensagem
          setChats(prev => prev.map(c =>
            c.id === selectedChat.id
              ? { ...c, lastMessage: textToSend, updatedAt: (Date.now() / 1000).toString() }
              : c
          ));
          break;
        }
        const errBody = await res.text();
        console.warn(`Payload rejeitado (${res.status}):`, errBody);
      } catch (err) {
        console.error('Erro de rede ao tentar payload:', err);
      }
    }

    if (!sent) {
      // Reverter mensagem optimista se todos os formatos falharam
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      toast.error('Falha ao enviar mensagem. Verifique se o WhatsApp está conectado.');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!selectedChat) return;

    const phoneNumber = selectedChat.id.split('@')[0];

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      // Remover o prefixo data:mime/type;base64,
      const pureBase64 = base64Url.split(',')[1];
      
      const optimisticMsg = {
        id: `optimistic-doc-${Date.now()}`,
        fromMe: true,
        body: `📄 Enviando arquivo: ${file.name}...`,
        timestamp: Date.now() / 1000
      };
      setChatMessages(prev => [...prev, optimisticMsg]);

      try {
        const payload = {
          number: phoneNumber,
          options: { delay: 1200 },
          mediaMessage: {
            mediatype: 'document',
            fileName: file.name,
            media: pureBase64
          }
        };

        const res = await apiFetch(`/message/sendDocument/${INSTANCE_NAME}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setChats(prev => prev.map(c =>
            c.id === selectedChat.id
              ? { ...c, lastMessage: `📄 ${file.name}`, updatedAt: (Date.now() / 1000).toString() }
              : c
          ));
        } else {
          setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
          toast.error('Falha ao enviar documento. Verifique a API.');
        }
      } catch (err) {
        setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        toast.error('Erro de rede ao enviar documento.');
      }
    };
    reader.readAsDataURL(file);
    
    // reset input
    e.target.value = '';
  };


  // Selecionar um contato do CRM para iniciar chat
  const handleSelectCrmCustomer = (cust: any) => {
    const formattedPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    if (!formattedPhone) {
      toast.error('Cliente sem telefone cadastrado.');
      return;
    }
    const jid = `${formattedPhone}@s.whatsapp.net`;
    
    const virtualChat: Chat = {
      id: jid,
      name: cust.name,
      unreadCount: 0,
      lastMessage: 'Nova conversa (Iniciar chat)',
      updatedAt: (Date.now() / 1000).toString()
    };
    
    // Adicionar na lista de chats se não existir
    setChats(prev => {
      const exists = prev.some(c => c.id === jid);
      if (exists) return prev;
      return [virtualChat, ...prev];
    });
    
    setSelectedChat(virtualChat);
    setChatMessages([]);
    setSidebarMode('chats');
    setChatSearch('');
  };

  // Auto-selecionar chat via URL Params (ex: integração de orçamentos)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const phoneParam = urlParams.get('phone');
      const textParam = urlParams.get('text');
      
      if (phoneParam) {
        const jid = `${phoneParam}@s.whatsapp.net`;
        const virtualChat: Chat = {
          id: jid,
          name: phoneParam,
          unreadCount: 0,
          lastMessage: 'Nova conversa iniciada pelo sistema',
          updatedAt: (Date.now() / 1000).toString()
        };
        
        setChats(prev => {
          if (prev.some(c => c.id === jid)) return prev;
          return [virtualChat, ...prev];
        });
        
        setSelectedChat(virtualChat);
        setSidebarMode('chats');
        
        if (textParam) {
          setNewMessageText(textParam);
        }
        
        // Remove params da URL para não re-abrir caso a página recarregue
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Poll de status a cada 15 segundos
  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 15000);
    return () => clearInterval(interval);
  }, [checkConnectionStatus]);

  // Carregar conversas quando pareado + polling a cada 30s para novos chats
  useEffect(() => {
    if (connected) {
      loadChats();
      loadCrmContacts();
      loadWaContacts(); // busca nomes reais dos contatos
      // Polling da lista de chats e contatos
      chatPollingRef.current = setInterval(() => {
        loadChats();
        // Não precisamos puxar a lista inteira de contatos a cada 8s, focar só nos chats
      }, 8000);
      return () => {
        if (chatPollingRef.current) clearInterval(chatPollingRef.current);
      };
    }
  }, [connected, loadChats, loadCrmContacts, loadWaContacts]);

  // Carregar mensagens quando um chat é selecionado + polling a cada 4s para receber em tempo real
  useEffect(() => {
    if (selectedChat) {
      // Limpar mensagens do chat anterior IMEDIATAMENTE ao trocar de contato
      setChatMessages([]);
      lastMessageIdsRef.current = '';

      // Cancelar polling anterior
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Capturar o chatId no momento da execução para evitar race condition
      const currentChatId = selectedChat.id;

      // Carregar mensagens do novo chat
      loadMessages(currentChatId);

      // Iniciar polling apenas para este chat
      pollingRef.current = setInterval(() => {
        loadMessages(currentChatId, true); // silent = não mostra loading spinner
      }, 4000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    } else {
      // Chat deselecionado: limpar tudo
      setChatMessages([]);
      lastMessageIdsRef.current = '';
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [selectedChat?.id, loadMessages]);


  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(chatSearch.toLowerCase()) || 
    chat.id.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const filteredCrmCustomers = crmCustomers.filter(cust => {
    const formattedPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    if (!formattedPhone) return false;
    
    // Omitir os que já têm chat ativo nas Conversas Recentes
    const hasActiveChat = chats.some(c => c.id.split('@')[0] === formattedPhone);
    if (hasActiveChat) return false;
    
    const searchLower = chatSearch.toLowerCase();
    return cust.name.toLowerCase().includes(searchLower) || formattedPhone.includes(chatSearch);
  });

  // Função para agrupar e renderizar mensagens na timeline do WhatsApp
  const renderMessages = () => {
    let lastDateStr = '';
    return chatMessages.map((msg, index) => {
      const msgDate = parseToDate(msg.timestamp);
      const dateStr = msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      
      let showDateSeparator = false;
      if (dateStr !== lastDateStr) {
        showDateSeparator = true;
        lastDateStr = dateStr;
      }

      // Determinar o texto do badge de data (Hoje, Ontem ou Data Inteira)
      let displayDate = dateStr;
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      if (dateStr === today) displayDate = 'Hoje';
      else if (dateStr === yesterday) displayDate = 'Ontem';

      return (
        <React.Fragment key={msg.id || index}>
          {showDateSeparator && (
            <div className="flex justify-center my-4">
              <span className="bg-white/80 dark:bg-[#182229] text-neutral-600 dark:text-[#8696a0] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-neutral-200/40 dark:border-neutral-800/40">
                {displayDate}
              </span>
            </div>
          )}
          <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} mb-1`}>
            <div
              className={`max-w-[75%] lg:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm relative leading-relaxed message-bubble ${
                msg.fromMe
                  ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none message-bubble-me'
                  : 'bg-white dark:bg-[#202c33] rounded-tl-none message-bubble-other'
              }`}
            >
              {!msg.fromMe && selectedChat?.id.includes('@g.us') && msg.sender && (
                <div className="text-[12px] font-bold text-[#128c7e] dark:text-[#53bdeb] mb-0.5 truncate max-w-[200px]">
                  {msg.pushName || msg.sender.split('@')[0]}
                </div>
              )}
              <p className="pr-12 break-words text-[14px] leading-5 text-[#111b21] dark:text-[#e9edef]">{msg.body}</p>
              <span className="text-[10px] absolute bottom-1 right-2 text-[#667781] dark:text-[#a6b0b6] shrink-0 select-none">
                {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

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
        <>
          {/* Estilos CSS customizados para os rabichos das mensagens e padrão de doodle */}
          <style dangerouslySetInnerHTML={{ __html: `
            .message-bubble {
              position: relative;
            }
            .message-bubble-me::after {
              content: "";
              position: absolute;
              right: -6px;
              top: 0;
              width: 0;
              height: 0;
              border-left: 6px solid #d9fdd3;
              border-bottom: 6px solid transparent;
            }
            .dark .message-bubble-me::after {
              border-left-color: #005c4b;
            }
            .message-bubble-other::after {
              content: "";
              position: absolute;
              left: -6px;
              top: 0;
              width: 0;
              height: 0;
              border-right: 6px solid #ffffff;
              border-bottom: 6px solid transparent;
            }
            .dark .message-bubble-other::after {
              border-right-color: #202c33;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #55555540;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #55555560;
            }
            .whatsapp-doodle {
              background-color: #efeae2;
              background-image: radial-gradient(#000000 0.5px, transparent 0.5px), radial-gradient(#000000 0.5px, #efeae2 0.5px);
              background-size: 20px 20px;
              background-position: 0 0, 10px 10px;
              opacity: 0.05;
            }
            .dark .whatsapp-doodle {
              background-color: #0b141a;
              background-image: radial-gradient(#ffffff 0.5px, transparent 0.5px), radial-gradient(#ffffff 0.5px, #0b141a 0.5px);
              opacity: 0.03;
            }
          `}} />

          {/* Diagnóstico da API Offline */}
          {apiOnline === false && (
            <Card className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-neutral-50 dark:from-neutral-800/20 to-white dark:to-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xl">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-8 h-8 animate-bounce-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Serviço de WhatsApp Local Desconectado</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Para utilizar o Chat de WhatsApp gratuitamente sem pagar por APIs oficiais, o contêiner Docker da **Evolution API** precisa estar ativo localmente na sua máquina com volume de dados persistente para manter a sessão conectada.
                </p>
              </div>

              {/* Bloco de Código com Comando Docker Compose e Script */}
              <div className="w-full max-w-lg bg-neutral-950 text-neutral-200 p-4 rounded-xl text-left font-mono text-xs overflow-x-auto border border-neutral-800/80 shadow-inner space-y-4">
                <div>
                  <p className="text-emerald-500 font-bold mb-1"># Opção 1: Execute o script de inicialização rápida na raiz do projeto:</p>
                  <p className="text-neutral-100 select-all font-semibold bg-neutral-900 px-2 py-1 rounded border border-neutral-800 inline-block">iniciar-whatsapp.bat</p>
                </div>
                <div className="border-t border-neutral-850 pt-3">
                  <p className="text-purple-400 font-bold mb-1"># Opção 2: Ou inicie o Docker Compose persistente no terminal:</p>
                  <p className="text-neutral-100 select-all font-semibold bg-neutral-900 px-2 py-1 rounded border border-neutral-800 inline-block">docker compose up -d evolution-api</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={checkConnectionStatus} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow">
                  🔄 Verificar Conexão Novamente
                </Button>
              </div>
            </Card>
          )}

          {/* Aguardando Pareamento (Exibe QR Code) */}
          {apiOnline === true && !connected && (
            <Card className="p-8 flex flex-col md:flex-row items-center justify-center gap-12 bg-white dark:bg-neutral-850">
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

          {/* Layout Principal de Chat Ativo (Estilo WhatsApp Web - Tela Cheia) */}
          {apiOnline === true && connected && (
            <div className="flex border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl overflow-hidden bg-white dark:bg-[#111b21] h-[calc(100vh-140px)] min-h-[550px] max-h-[850px] shadow-lg">
              {/* Barra Lateral Esquerda (Sidebar) */}
              <div className={`w-full lg:w-[380px] flex flex-col border-r border-neutral-200/50 dark:border-neutral-800/50 h-full shrink-0 bg-white dark:bg-[#111b21] ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Cabeçalho da Sidebar */}
                <div className="p-3 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-[#f0f2f5] dark:bg-[#202c33] flex justify-between items-center shrink-0">
                  {sidebarMode === 'chats' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-inner">
                          CM
                        </div>
                        <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">WhatsApp Hub</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSidebarMode('contacts')}
                          title="Nova conversa com contato do CRM"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-350 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                        <button 
                          onClick={loadChats} 
                          title="Sincronizar"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSidebarMode('chats');
                            setChatSearch('');
                          }} 
                          className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 rounded-full"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </button>
                        <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">Nova Conversa</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Campo de Pesquisa */}
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#111b21] flex items-center shrink-0">
                  <div className="flex-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder={sidebarMode === 'chats' ? 'Pesquisar ou começar uma nova conversa' : 'Pesquisar nos clientes do CRM'}
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg text-xs text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Lista de Contatos/Chats */}
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50 custom-scrollbar bg-white dark:bg-[#111b21]">
                  {sidebarMode === 'chats' ? (
                    loadingChats ? (
                      <div className="p-4 text-center text-xs text-neutral-400">Carregando conversas...</div>
                    ) : filteredChats.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-500">
                        Nenhuma conversa ativa encontrada.<br/>
                        <button 
                          onClick={() => setSidebarMode('contacts')} 
                          className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Clique aqui para iniciar um chat com cliente CRM
                        </button>
                      </div>
                    ) : (
                      filteredChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`p-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800/50 ${
                            selectedChat?.id === chat.id ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner shrink-0 ${getAvatarColor(resolveName(chat))}`}>
                            {getInitials(resolveName(chat))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <p className="font-bold text-xs text-neutral-850 dark:text-neutral-200 truncate">{resolveName(chat)}</p>
                              <span className="text-[9px] text-neutral-400 shrink-0 ml-2">
                                {formatChatTime(chat.updatedAt)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-neutral-450 dark:text-neutral-400 truncate pr-2">
                                {chat.lastMessage}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="bg-emerald-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full shrink-0">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    loadingContacts ? (
                      <div className="p-4 text-center text-xs text-neutral-400">Carregando contatos CRM...</div>
                    ) : filteredCrmCustomers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-400">Nenhum contato do CRM encontrado.</div>
                    ) : (
                      filteredCrmCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCrmCustomer(cust)}
                          className="p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#2a3942]/40 transition-colors flex items-center gap-3"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner shrink-0 ${getAvatarColor(cust.name)}`}>
                            {getInitials(cust.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-neutral-850 dark:text-neutral-200 truncate">{cust.name}</p>
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-400 truncate">{cust.phone || 'Sem telefone'}</p>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* Box de Conversa Ativa */}
              <div className={`flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                {selectedChat ? (
                  <>
                    {/* Header da Conversa */}
                    <div className="p-3 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between z-10 shadow-sm shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Botão Voltar Mobile */}
                        <button 
                          onClick={() => setSelectedChat(null)} 
                          className="lg:hidden text-neutral-600 dark:text-neutral-350 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 rounded-full shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner shrink-0 ${getAvatarColor(resolveName(selectedChat))}`}>
                          {getInitials(resolveName(selectedChat))}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-neutral-850 dark:text-neutral-200 truncate">{resolveName(selectedChat)}</h3>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{selectedChat.id.split('@')[0]}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {!selectedChat.id.includes('@g.us') && !crmCustomers.some(c => c.phone && c.phone.replace(/\D/g, '') === selectedChat.id.split('@')[0]) && (
                          <button
                            onClick={() => toast.success('Funcionalidade de Adicionar Cliente será aberta em breve!')}
                            className="text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Adicionar CRM
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Online
                        </div>
                      </div>
                    </div>

                    {/* Timeline de Mensagens com Doodle */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 relative custom-scrollbar">
                      {/* Padrão de Fundo do WhatsApp */}
                      <div className="absolute inset-0 whatsapp-doodle pointer-events-none" />
                      
                      <div className="relative z-10 space-y-2">
                        {loadingMessages ? (
                          <div className="text-center text-xs text-neutral-400 py-12">Carregando histórico...</div>
                        ) : chatMessages.length === 0 ? (
                          <div className="text-center text-xs text-neutral-500 py-24 bg-white/40 dark:bg-[#202c33]/20 rounded-xl p-6 max-w-sm mx-auto shadow-sm border border-neutral-200/50 dark:border-neutral-800/50">
                            Nenhuma mensagem neste chat.<br/>
                            Envie uma mensagem abaixo para iniciar a conversa!
                          </div>
                        ) : (
                          renderMessages()
                        )}
                      </div>
                    </div>

                    {/* Barra de Input para Enviar Mensagem */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex gap-2 items-center border-t border-neutral-200/50 dark:border-neutral-800/50 z-10 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[#8696a0] hover:text-[#00a884] transition-colors shrink-0"
                        title="Anexar arquivo (PDF, imagens, etc)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleSendDocument}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      />
                      <div className="flex-1">
                        <input
                          required
                          type="text"
                          placeholder="Digite uma mensagem..."
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#2a3942] border-none rounded-lg text-[14px] text-neutral-850 dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] focus:outline-none focus:ring-0 shadow-sm"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="p-2 text-[#8696a0] hover:text-[#00a884] transition-colors shrink-0"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 relative">
                    <div className="absolute inset-0 whatsapp-doodle pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center max-w-sm">
                      <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-[#182229] flex items-center justify-center text-emerald-600/70 dark:text-emerald-400/50 mb-6 shadow-sm">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18a5.969 5.969 0 01-.474-3.65A8.962 8.962 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2 text-base">WhatsApp Web CRM</h4>
                      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Selecione uma conversa ao lado ou clique em **"+"** no topo da barra lateral para iniciar uma conversa com qualquer cliente do seu CRM.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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
