'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LeftIconBar from './LeftIconBar';
import WhatsAppSidebar from './WhatsAppSidebar';
import WelcomeScreen from './WelcomeScreen';
import ChatArea from './chat/ChatArea';

const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
export const INSTANCE_NAME = 'clickmarido_instance';

export interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  updatedAt?: number;
}

export default function WhatsAppContainer() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeIcon, setActiveIcon] = useState('chats');

  // API States
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [contactsMap, setContactsMap] = useState<Record<string, string>>({});

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastQrGenerationRef = useRef<number>(0);

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      ...(options.headers || {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    try {
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

  // Carregar contatos do CRM
  const loadCrmContacts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/customers?limit=500', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const list = result.data || result || [];
        setCrmCustomers(list);
      }
    } catch (err) {
      console.error('Error loading CRM contacts:', err);
    }
  }, []);

  const resolveName = useCallback((chat: any): string => {
    if (chat.id && chat.id.includes('@g.us')) {
       if (chat.name && chat.name !== 'Contato' && !chat.name.includes('-')) {
         return chat.name;
       }
       return 'Grupo WhatsApp';
    }
    const phone = chat.id ? chat.id.split('@')[0] : '';
    
    // 1. Tentar achar no CRM
    const crmMatch = crmCustomers.find(c => {
      if (!c.phone) return false;
      const crmPhone = c.phone.replace(/\D/g, '');
      if (crmPhone === phone) return true;
      
      if (phone.startsWith('55') && phone.length >= 12 && crmPhone.length >= 10) {
        if (phone.endsWith(crmPhone)) return true;
        if (crmPhone.startsWith('55') && crmPhone.endsWith(phone.slice(4))) return true;
        const phoneDdd = phone.slice(2,4);
        const phoneRest = phone.slice(4);
        let crmDdd = '';
        let crmRest = '';
        if (crmPhone.startsWith('55')) {
          crmDdd = crmPhone.slice(2,4);
          crmRest = crmPhone.slice(4);
        } else {
          crmDdd = crmPhone.slice(0,2);
          crmRest = crmPhone.slice(2);
        }
        if (phoneDdd === crmDdd) {
          if (phoneRest.slice(-8) === crmRest.slice(-8)) return true;
        }
      }
      return false;
    });

    if (crmMatch && crmMatch.name) return crmMatch.name;

    // 2. Map
    const resolved = contactsMap[chat.id] || contactsMap[phone] || (chat.name !== phone && chat.name !== 'Contato' ? chat.name : null);
    if (resolved) return resolved;
    
    // 3. Formatar
    if (phone.length > 10) {
      return `+${phone.slice(0,2)} ${phone.slice(2,4)} ${phone.slice(4,9)}-${phone.slice(9)}`;
    }
    return phone;
  }, [contactsMap, crmCustomers]);

  const loadChats = useCallback(async () => {
    if (!connected) return;
    try {
      const res = await apiFetch(`/chat/findChats/${INSTANCE_NAME}`);
      
      const phoneToNameMap = new Map<string, string>();
      crmCustomers.forEach((client: any) => {
        if (client.phone) {
          const normalized = client.phone.replace(/[\s\-().+]/g, '');
          phoneToNameMap.set(normalized, client.name);
          if (normalized.length >= 8) {
            phoneToNameMap.set(normalized.slice(-8), client.name);
          }
        }
      });

      if (res.ok) {
        const data = await res.json();
        const list = (data || []).map((c: any) => {
          let chatDate = c.updatedAt || c.createdAt;
          if (!chatDate && c.lastMessage?.messageTimestamp) {
            chatDate = c.lastMessage.messageTimestamp;
          }
          if (!chatDate) {
            chatDate = Date.now() / 1000;
          }
          
          let lastMsg = 'Sem mensagem';
          if (c.lastMessage) {
              const msg = c.lastMessage.message || c.lastMessage;
              if (msg.conversation) lastMsg = msg.conversation;
              else if (msg.extendedTextMessage?.text) lastMsg = msg.extendedTextMessage.text;
              else if (msg.imageMessage) lastMsg = msg.imageMessage.caption ? `📷 ${msg.imageMessage.caption}` : '📷 Foto';
              else if (msg.videoMessage) lastMsg = msg.videoMessage.caption ? `🎥 ${msg.videoMessage.caption}` : '🎥 Vídeo';
              else if (msg.audioMessage) lastMsg = '🎵 Áudio';
              else if (msg.documentMessage) lastMsg = msg.documentMessage.title ? `📄 ${msg.documentMessage.title}` : '📄 Documento';
              else if (msg.stickerMessage) lastMsg = '💟 Figurinha';
          }

          const phoneId = c.id?.split('@')[0] || '';
          const normalizedPhone = phoneId.replace(/[\s\-().+]/g, '');
          let matchedName = phoneToNameMap.get(normalizedPhone);
          if (!matchedName && normalizedPhone.length >= 8) {
            matchedName = phoneToNameMap.get(normalizedPhone.slice(-8));
          }
          const finalName = resolveName({...c, name: matchedName || c.name || c.verifiedName || phoneId || 'Contato'});

          // Formatar data para "HH:mm" se for de hoje, senao "DD/MM"
          const dateObj = new Date(typeof chatDate === 'number' ? (chatDate > 1e11 ? chatDate : chatDate * 1000) : chatDate);
          const isToday = new Date().toDateString() === dateObj.toDateString();
          const timeString = isToday ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

          return {
            id: c.id || c.jid,
            contactName: finalName,
            contactNumber: phoneId,
            unreadCount: c.unreadCount || 0,
            lastMessage: lastMsg,
            timestamp: timeString,
            updatedAt: dateObj.getTime(),
            isPinned: c.isPinned || false,
            isMuted: c.isMuted || false,
          };
        });

        list.sort((a: any, b: any) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          return b.updatedAt - a.updatedAt;
        });

        setConversations(list);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  }, [connected, apiFetch, crmCustomers, resolveName]);

  // Use effects for initialization and polling
  useEffect(() => {
    loadCrmContacts();
  }, [loadCrmContacts]);

  useEffect(() => {
    checkConnectionStatus();
    loadChats();

    pollingRef.current = setInterval(() => {
      checkConnectionStatus();
      loadChats();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [checkConnectionStatus, loadChats]);

  useEffect(() => {
    if (typeof window !== 'undefined' && connected && crmCustomers.length > 0 && searchParams) {
      const urlPhone = searchParams.get('phone');
      const textParam = searchParams.get('text');
      const autoAttach = searchParams.get('autoAttach');
      
      if (urlPhone) {
        let cleanPhone = urlPhone.replace(/\D/g, '');
        if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
          cleanPhone = '55' + cleanPhone;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;
        setSelectedConvId(jid);
        
        if (autoAttach === 'true') {
           const pendingPdf = localStorage.getItem('auto_attach_pdf');
           const pendingPdfName = localStorage.getItem('auto_attach_name') || 'Orcamento.pdf';
           if (pendingPdf) {
              apiFetch(`/message/sendMedia/${INSTANCE_NAME}`, {
                method: 'POST',
                body: JSON.stringify({
                  number: jid,
                  mediaMessage: {
                    mediatype: 'document',
                    mimetype: 'application/pdf',
                    caption: textParam || '',
                    media: pendingPdf,
                    fileName: pendingPdfName
                  }
                })
              }).then(() => {
                 localStorage.removeItem('auto_attach_pdf');
                 localStorage.removeItem('auto_attach_name');
              }).catch(console.error);
           }
        } else if (textParam) {
           apiFetch(`/message/sendText/${INSTANCE_NAME}`, {
              method: 'POST',
              body: JSON.stringify({
                 number: jid,
                 textMessage: { text: textParam }
              })
           }).catch(console.error);
        }
        
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('phone');
        newUrl.searchParams.delete('text');
        newUrl.searchParams.delete('autoAttach');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [searchParams, connected, crmCustomers.length, apiFetch]);

  let selectedConversation = conversations.find(c => c.id === selectedConvId);

  // Criar conversa virtual se não existir (ex: contato do CRM sem chat previo ou via URL param)
  if (!selectedConversation && selectedConvId) {
    const phoneId = selectedConvId.split('@')[0];
    const crmMatch = crmCustomers.find(c => {
      if (!c.phone) return false;
      const crmPhone = c.phone.replace(/\D/g, '');
      return crmPhone === phoneId || 
             (crmPhone.startsWith('55') && crmPhone === phoneId) || 
             (phoneId.startsWith('55') && crmPhone === phoneId.slice(2));
    });

    selectedConversation = {
      id: selectedConvId,
      contactName: crmMatch ? crmMatch.name : phoneId,
      contactNumber: phoneId,
      unreadCount: 0,
      lastMessage: 'Nova conversa iniciada',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-[#111b21]">
      {/* Left Icon Bar */}
      <LeftIconBar activeIcon={activeIcon} onIconClick={setActiveIcon} />

      {/* Sidebar */}
      <WhatsAppSidebar
        conversations={conversations}
        selectedConvId={selectedConvId}
        onSelectConv={setSelectedConvId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        connected={connected}
        qrCode={qrCode}
        crmCustomers={crmCustomers}
        apiFetch={apiFetch}
      />

      {/* Chat Area or Welcome Screen */}
      {selectedConversation ? (
        <ChatArea 
            conversation={selectedConversation} 
            apiFetch={apiFetch}
        />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
