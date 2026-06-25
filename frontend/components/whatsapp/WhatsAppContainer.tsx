'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LeftIconBar from './LeftIconBar';
import WhatsAppSidebar from './WhatsAppSidebar';
import WelcomeScreen from './WelcomeScreen';
import ChatArea from './chat/ChatArea';
import { useFavorites, useArchived, useLabels } from './hooks/useWhatsAppApi';

const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
export const INSTANCE_NAME = 'clickmarido_instance';

// ==========================================
// FUNÇÕES PURAS DE NORMALIZAÇÃO DE TELEFONE
// ==========================================

/** Remove tudo que não é dígito */
function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/** Normaliza para comparação (remove DDI 55, foca nos últimos 8-9 dígitos) */
function normalizeForComparison(phone: string): string {
  const cleaned = normalizePhone(phone);
  // Remove DDI 55 se presente e tem 12+ dígitos
  if (cleaned.length >= 12 && cleaned.startsWith('55')) {
    return cleaned.slice(2);
  }
  return cleaned;
}

/** Formata telefone brasileiro para exibição */
function formatPhoneBR(phone: string): string {
  const cleaned = normalizePhone(phone);
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned.slice(0,2)} ${cleaned.slice(2,4)} ${cleaned.slice(4,9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    return `+${cleaned.slice(0,2)} ${cleaned.slice(2,4)} ${cleaned.slice(4,8)}-${cleaned.slice(8)}`;
  }
  if (cleaned.length === 11) {
    return `+55 ${cleaned.slice(0,2)} ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `+55 ${cleaned.slice(0,2)} ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
  }
  return `+${cleaned}`;
}

/** Extrai telefone do JID (remove @s.whatsapp.net e @g.us) */
function extractPhoneFromJid(jid: string): string {
  return (jid || '').split('@')[0].replace(/\D/g, '');
}

/** Verifica se é JID de grupo */
function isGroupJid(jid: string): boolean {
  return jid?.includes('@g.us') ?? false;
}

/** Verifica se nome de grupo é genérico */
function isGenericGroupName(name: string): boolean {
  if (!name || !name.trim()) return true;
  const lower = name.toLowerCase().trim();
  // Nomes que indicam grupo genérico
  const genericPatterns = [
    /^grupo\s/i,
    /^group\s/i,
    /^família/i,
    /^family/i,
    /^trabalho/i,
    /^work/i,
    /^equipe/i,
    /^team/i,
  ];
  // Se é muito curto ou combina com padrões genéricos
  if (lower.length < 3) return true;
  return genericPatterns.some(p => p.test(lower));
}

/** Conta participantes estimados de um grupo (se disponível nos metadados) */
function getGroupParticipantCount(chat: any): number {
  return chat?.participants?.length || chat?.participantCount || 0;
}

// ==========================================
// RESOLUÇÃO DE NOMES COM PRIORIDADE
// ==========================================

/** Interface para resultado da resolução */
interface ResolvedName {
  name: string;
  source: 'evolution_verified' | 'evolution_name' | 'crm' | 'cache' | 'formatted_phone' | 'generic_group';
}

/**
 * Resolve nome de contato/grupo com prioridade definida:
 * 1. Nome verificado da Evolution API
 * 2. Nome do chat da Evolution API
 * 3. Nome do CRM
 * 4. Cache local (contactsMap)
 * 5. Telefone formatado (fallback)
 */
function resolveContactName(
  chat: any,
  crmCustomers: any[],
  contactsMap: Record<string, string>
): ResolvedName {
  const jid = chat.id || '';
  const phone = extractPhoneFromJid(jid);
  const isGroup = isGroupJid(jid);

  // === GRUPOS ===
  if (isGroup) {
    // 1. Nome verificado do grupo
    if (chat.verifiedName && chat.verifiedName.trim() && !isGenericGroupName(chat.verifiedName)) {
      return { name: chat.verifiedName.trim(), source: 'evolution_verified' };
    }
    // 2. Nome do chat do grupo
    if (chat.name && chat.name.trim() && !isGenericGroupName(chat.name)) {
      return { name: chat.name.trim(), source: 'evolution_name' };
    }
    // 3. Nome verificado mesmo que genérico (melhor que nada)
    if (chat.verifiedName && chat.verifiedName.trim()) {
      return { name: chat.verifiedName.trim(), source: 'evolution_verified' };
    }
    // 4. Nome do chat mesmo que genérico
    if (chat.name && chat.name.trim()) {
      return { name: chat.name.trim(), source: 'evolution_name' };
    }
    // 5. Fallback genérico para grupo
    const count = getGroupParticipantCount(chat);
    const suffix = count > 0 ? ` (${count} participantes)` : '';
    return { name: `Grupo WhatsApp${suffix}`, source: 'generic_group' };
  }

  // === CONTATOS INDIVIDUAIS ===
  
  // 1. Nome verificado da Evolution API (prioridade máxima)
  if (chat.verifiedName && chat.verifiedName.trim()) {
    const verified = chat.verifiedName.trim();
    // Ignorar se for só número ou muito genérico
    if (verified !== phone && verified.length > 2) {
      return { name: verified, source: 'evolution_verified' };
    }
  }

  // 2. Nome do chat da Evolution API
  if (chat.name && chat.name.trim()) {
    const name = chat.name.trim();
    // Ignorar se for o próprio telefone, "Contato", ou muito genérico
    if (name !== phone && name !== 'Contato' && name.length > 2 && !name.includes(phone)) {
      return { name, source: 'evolution_name' };
    }
  }

  // 3. Busca no CRM (normalizado para comparação)
  const normalized = normalizeForComparison(phone);
  if (crmCustomers && crmCustomers.length > 0) {
    const crmMatch = crmCustomers.find((c: any) => {
      if (!c.phone) return false;
      const crmNorm = normalizeForComparison(c.phone);
      // Correspondência exata
      if (crmNorm === normalized) return true;
      // Correspondência pelos últimos 8 dígitos
      if (normalized.length >= 8 && crmNorm.length >= 8) {
        return normalized.slice(-8) === crmNorm.slice(-8);
      }
      return false;
    });

    if (crmMatch?.name && crmMatch.name.trim()) {
      return { name: crmMatch.name.trim(), source: 'crm' };
    }
  }

  // 4. Cache local (contactsMap)
  const cached = contactsMap[jid] || contactsMap[phone] || contactsMap[normalized];
  if (cached && cached.trim()) {
    return { name: cached.trim(), source: 'cache' };
  }

  // 5. Telefone formatado como fallback
  return { name: formatPhoneBR(phone), source: 'formatted_phone' };
}

/** Função wrapper para manter compatibilidade com código existente */
function resolveNameLegacy(
  chat: any,
  crmCustomers: any[],
  contactsMap: Record<string, string>
): string {
  return resolveContactName(chat, crmCustomers, contactsMap).name;
}

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

  // WhatsApp Backend API hooks
  const { favorites, fetchFavorites, toggleFavorite, isFavorite } = useFavorites();
  const { archived, fetchArchived, toggleArchive, isArchived } = useArchived();
  const { labels, fetchLabels, createLabel, deleteLabel, toggleLabelOnConversation, getLabelsForPhone } = useLabels();

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

  const loadChats = useCallback(async () => {
    if (!connected) return;
    try {
      const res = await apiFetch(`/chat/findChats/${INSTANCE_NAME}`);

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
          const finalName = resolveNameLegacy(c, crmCustomers, contactsMap);

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
  }, [connected, apiFetch, crmCustomers, contactsMap]);

  // Use effects for initialization and polling
  useEffect(() => {
    loadCrmContacts();
  }, [loadCrmContacts]);

  // Carregar dados do backend quando conectado
  useEffect(() => {
    if (connected) {
      fetchFavorites();
      fetchArchived();
      fetchLabels();
    }
  }, [connected, fetchFavorites, fetchArchived, fetchLabels]);

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
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        isArchived={isArchived}
        toggleArchive={toggleArchive}
        labels={labels}
        toggleLabelOnConversation={toggleLabelOnConversation}
        getLabelsForPhone={getLabelsForPhone}
        activeIcon={activeIcon}
        onIconClick={setActiveIcon}
        onNewChat={() => {
          setSelectedConvId(null);
          setSidebarOpen(true);
        }}
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
