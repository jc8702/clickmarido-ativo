'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LeftIconBar from './LeftIconBar';
import WhatsAppSidebar from './WhatsAppSidebar';
import WelcomeScreen from './WelcomeScreen';
import ChatArea from './chat/ChatArea';
import { useFavorites, useArchived, useLabels } from './hooks/useWhatsAppApi';
import { useEvolutionApi, ConnectionStatus } from './hooks/useEvolutionApi';
import { normalizePhone } from './utils/phone';
import { resolveNameLegacy, formatChatDate, normalizeChatTimestamp } from './utils/names';
import { extractLastMessage } from './utils/messages';
import { Conversation } from './types';

const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
const INSTANCE_NAME = 'clickmarido_instance';



export default function WhatsAppContainer() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeIcon, setActiveIcon] = useState('chats');

  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [contactsMap, setContactsMap] = useState<Record<string, string>>({});

  // Refs para evitar recriação de callbacks e polling restart
  const crmCustomersRef = useRef<any[]>([]);
  const contactsMapRef = useRef<Record<string, string>>({});

  // ==========================================
  // EVOLUTION API HOOK
  // ==========================================
  const {
    status: connectionStatus,
    apiOnline,
    qrCode,
    error: apiError,
    apiFetch,
    sendText,
    sendMedia,
    loadChats: loadChatsFromApi,
  } = useEvolutionApi({
    apiUrl: API_URL,
    apiKey: API_KEY,
    instanceName: INSTANCE_NAME,
    pollingInterval: 5000,
    qrCooldown: 50000,
    apiTimeout: 10000,
  });

  // Derivar estado de conexão do status
  const connected = connectionStatus === 'connected';

  // WhatsApp Backend API hooks
  const { favorites, fetchFavorites, toggleFavorite, isFavorite } = useFavorites();
  const { archived, fetchArchived, toggleArchive, isArchived } = useArchived();
  const { labels, fetchLabels, createLabel, deleteLabel, toggleLabelOnConversation, getLabelsForPhone } = useLabels();

  // ==========================================
  // CARREGAR CONTATOS DO CRM + POPULAR CONTACTS MAP
  // ==========================================
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
        crmCustomersRef.current = list;

        // Popular contactsMap a partir do CRM para cache de resolução de nomes
        const newMap: Record<string, string> = {};
        for (const c of list) {
          if (c.phone && c.name) {
            const normalized = normalizePhone(c.phone);
            // Mapear por diferentes formatos do telefone
            newMap[normalized] = c.name;
            if (normalized.startsWith('55') && normalized.length >= 12) {
              newMap[normalized.slice(2)] = c.name; // Sem DDI
            }
            if (normalized.length >= 10) {
              newMap[normalized.slice(-10)] = c.name; // Últimos 10 dígitos
              newMap[normalized.slice(-8)] = c.name;  // Últimos 8 dígitos
            }
          }
        }
        setContactsMap(newMap);
        contactsMapRef.current = newMap;
      }
    } catch (err) {
      console.error('Error loading CRM contacts:', err);
    }
  }, []);

  // ==========================================
  // CARREGAR CHATS (sem dependência de crmCustomers/contactsMap via refs)
  // ==========================================
  const loadChats = useCallback(async () => {
    if (!connected) return;
    
    try {
      const rawChats = await loadChatsFromApi();
      
      if (rawChats.length > 0) {
        const currentCrm = crmCustomersRef.current;
        const currentMap = contactsMapRef.current;

        const list = rawChats.map((c: any) => {
          const { text: lastMsg, sender: lastMsgSender } = extractLastMessage(c.lastMessage);
          const phoneId = c.id?.split('@')[0] || '';
          const finalName = resolveNameLegacy(c, currentCrm, currentMap);
          const updatedAt = normalizeChatTimestamp(c);
          const timeString = formatChatDate(c.updatedAt || c.createdAt);

          return {
            id: c.id || c.jid,
            contactName: finalName,
            contactNumber: phoneId,
            unreadCount: c.unreadCount || 0,
            lastMessage: lastMsg,
            lastMessageSender: lastMsgSender,
            timestamp: timeString,
            updatedAt,
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
  }, [connected, loadChatsFromApi]);

  // ==========================================
  // EFFECTS
  // ==========================================

  // Carregar contatos do CRM
  useEffect(() => {
    loadCrmContacts();
  }, [loadCrmContacts]);

  // Carregar dados do backend quando conectado
  useEffect(() => {
    if (connected) {
      fetchFavorites();
      fetchArchived();
      fetchLabels();
      loadChats();
    }
  }, [connected, fetchFavorites, fetchArchived, fetchLabels, loadChats]);

  // Polling de chats quando conectado
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(() => {
      loadChats();
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, loadChats]);

  // ==========================================
  // HANDLER PARA NOVA CONVERSAA (via LeftIconBar)
  // ==========================================
  useEffect(() => {
    if (activeIcon === 'new-chat') {
      setSelectedConvId(null);
      setSidebarOpen(true);
      setActiveIcon('chats');
    }
  }, [activeIcon]);

  // ==========================================
  // AUTO-OPEN CONVERSATION VIA URL
  // ==========================================
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
              sendMedia(jid, pendingPdf, {
                mediatype: 'document',
                mimetype: 'application/pdf',
                caption: textParam || '',
                fileName: pendingPdfName,
              }).then(() => {
                 localStorage.removeItem('auto_attach_pdf');
                 localStorage.removeItem('auto_attach_name');
              }).catch(console.error);
           }
        } else if (textParam) {
           sendText(jid, textParam).catch(console.error);
        }
        
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('phone');
        newUrl.searchParams.delete('text');
        newUrl.searchParams.delete('autoAttach');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [searchParams, connected, crmCustomers.length, sendText, sendMedia]);

  // ==========================================
  // SELECTION LOGIC
  // ==========================================
  let selectedConversation = conversations.find(c => c.id === selectedConvId);

  // Criar conversa virtual se não existir (ex: contato do CRM sem chat previo ou via URL param)
  if (!selectedConversation && selectedConvId) {
    const phoneId = selectedConvId.split('@')[0];
    const resolvedName = resolveNameLegacy(
      { id: selectedConvId, name: null, verifiedName: null },
      crmCustomers,
      contactsMap
    );

    selectedConversation = {
      id: selectedConvId,
      contactName: resolvedName,
      contactNumber: phoneId,
      unreadCount: 0,
      lastMessage: 'Nova conversa iniciada',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // ==========================================
  // RENDER
  // ==========================================
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
        connectionStatus={connectionStatus}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        isArchived={isArchived}
        toggleArchive={toggleArchive}
        labels={labels}
        toggleLabelOnConversation={toggleLabelOnConversation}
        getLabelsForPhone={getLabelsForPhone}
        activeIcon={activeIcon}
        onIconClick={setActiveIcon}
      />

      {/* Chat Area or Welcome Screen */}
      {selectedConversation ? (
        <ChatArea 
            conversation={selectedConversation} 
            apiFetch={apiFetch}
            sendText={sendText}
            sendMedia={sendMedia}
            onCloseChat={() => setSelectedConvId(null)}
        />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
