'use client';

// ==========================================
// PARSER ROBUSTO DE MENSAGENS WHATSAPP
// Suporta: texto, imagem, vídeo, áudio, documento,
// figurinha, efêmera, citada, encaminhada, reação, sistema
// ==========================================

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'sticker' 
  | 'ephemeral' 
  | 'reaction' 
  | 'system' 
  | 'contact' 
  | 'location'
  | 'unknown';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'pending' | 'error';

export interface ParsedMessage {
  id: string;
  type: MessageType;
  text: string;
  caption: string;
  isMine: boolean;
  time: string;
  timestamp: number;
  status: MessageStatus;
  isSystem: boolean;
  isForwarded: boolean;
  isReply: boolean;
  replyTo?: {
    text: string;
    sender: string;
  };
  senderName?: string;
  senderPhone?: string;
  media?: {
    url?: string;
    mimetype?: string;
    filename?: string;
    filesize?: number;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: string;
  };
  reaction?: {
    emoji: string;
    sender: string;
  };
  raw?: any;
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function normalizeTimestamp(ts: any): number {
  if (!ts) return Math.floor(Date.now() / 1000);
  const num = typeof ts === 'number' ? ts : parseInt(ts, 10);
  // Se > 1e11, está em milissegundos
  if (num > 1e11) return Math.floor(num / 1000);
  return num;
}

function formatTime(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusFromKey(msg: any): MessageStatus {
  // 1. Status explícito do update (mais confiável)
  const explicitStatus = msg.update?.status || msg.status;
  if (explicitStatus) {
    const s = String(explicitStatus).toLowerCase();
    // Códigos numéricos EvolutionAPI: 0=SENT, 1=DELIVERED, 2=READ, 3=PLAYED
    if (s === '0' || s === 'sent') return 'sent';
    if (s === '1' || s === 'delivered') return 'delivered';
    if (s === '2' || s === 'read' || s === '3' || s === 'played') return 'read';
  }
  
  // 2. Fallback: grupos sempre marcados como lidos (comportamento EvolutionAPI)
  const remoteJid = msg.key?.remoteJid || '';
  if (remoteJid.includes('g.us')) {
    return 'read';
  }
  
  // 3. Default para mensagens individuais
  return 'sent';
}

// ==========================================
// EXTRAÇÃO DE CONTEÚDO POR TIPO
// ==========================================

function extractTextContent(msg: any): { text: string; type: MessageType } {
  const m = msg.message || msg;
  
  // Texto simples
  if (m.conversation) {
    return { text: m.conversation, type: 'text' };
  }
  
  // Texto estendido (com formatação, links, etc)
  if (m.extendedTextMessage) {
    const ext = m.extendedTextMessage;
    let text = ext.text || '';
    
    // Se tem quotedMessage, é uma resposta
    if (ext.quotedMessage) {
      const quotedText = ext.quotedMessage.conversation 
        || ext.quotedMessage.extendedTextMessage?.text
        || '[mensagem]';
      return { 
        text, 
        type: 'text' 
      };
    }
    
    return { text, type: 'text' };
  }
  
  // Imagem
  if (m.imageMessage) {
    const img = m.imageMessage;
    return { 
      text: img.caption || '', 
      type: 'image' 
    };
  }
  
  // Vídeo
  if (m.videoMessage) {
    const vid = m.videoMessage;
    return { 
      text: vid.caption || '', 
      type: 'video' 
    };
  }
  
  // Áudio
  if (m.audioMessage) {
    return { text: '', type: 'audio' };
  }
  
  // Documento
  if (m.documentMessage) {
    const doc = m.documentMessage;
    return { 
      text: doc.fileName || doc.title || '', 
      type: 'document' 
    };
  }
  
  // Figurinha
  if (m.stickerMessage) {
    return { text: '', type: 'sticker' };
  }
  
  // Contato
  if (m.contactMessage || m.contactsArrayMessage) {
    return { text: '[Contato]', type: 'contact' };
  }
  
  // Localização
  if (m.locationMessage) {
    return { text: '[Localização]', type: 'location' };
  }
  
  // Mensagem de sistema
  if (m.protocolMessage || m.messageStubType) {
    return { text: '[Mensagem de sistema]', type: 'system' };
  }
  
  // Reação
  if (m.reactionMessage) {
    return { text: '', type: 'reaction' };
  }
  
  // Mensagem efêmera (contém outra mensagem dentro)
  if (m.ephemeralMessage) {
    return extractTextContent(m.ephemeralMessage);
  }
  
  // Mensagem encaminhada
  if (m.forwardedMessage) {
    const forwarded = extractTextContent(m.forwardedMessage);
    return { ...forwarded, text: forwarded.text };
  }
  
  return { text: '[Mensagem não suportada]', type: 'unknown' };
}

function extractMedia(msg: any): ParsedMessage['media'] | undefined {
  const m = msg.message || msg;
  
  if (m.imageMessage) {
    const img = m.imageMessage;
    return {
      url: img.url,
      mimetype: img.mimetype,
      filesize: img.fileLength,
      width: img.width,
      height: img.height,
      thumbnail: img.jpegThumbnail,
    };
  }
  
  if (m.videoMessage) {
    const vid = m.videoMessage;
    return {
      url: vid.url,
      mimetype: vid.mimetype,
      filesize: vid.fileLength,
      width: vid.width,
      height: vid.height,
      duration: vid.seconds,
      thumbnail: vid.jpegThumbnail,
    };
  }
  
  if (m.audioMessage) {
    const aud = m.audioMessage;
    return {
      url: aud.url,
      mimetype: aud.mimetype,
      filesize: aud.fileLength,
      duration: aud.seconds,
    };
  }
  
  if (m.documentMessage) {
    const doc = m.documentMessage;
    return {
      url: doc.url,
      mimetype: doc.mimetype,
      filename: doc.fileName,
      filesize: doc.fileLength,
    };
  }
  
  if (m.stickerMessage) {
    const sticker = m.stickerMessage;
    return {
      url: sticker.url,
      mimetype: sticker.mimetype,
      width: sticker.width,
      height: sticker.height,
    };
  }
  
  return undefined;
}

function extractReplyInfo(msg: any): ParsedMessage['replyTo'] | undefined {
  const m = msg.message || msg;
  
  // extendedTextMessage com quotedMessage
  if (m.extendedTextMessage?.quotedMessage) {
    const quoted = m.extendedTextMessage.quotedMessage;
    const text = quoted.conversation 
      || quoted.extendedTextMessage?.text
      || quoted.imageMessage?.caption
      || quoted.videoMessage?.caption
      || '[mensagem]';
    
    return {
      text,
      sender: m.extendedTextMessage.contextInfo?.participant || '',
    };
  }
  
  // protocolMessage com extendedTextMessage
  if (m.protocolMessage?.extendedTextMessage?.quotedMessage) {
    const quoted = m.protocolMessage.extendedTextMessage.quotedMessage;
    return {
      text: quoted.conversation || quoted.extendedTextMessage?.text || '[mensagem]',
      sender: '',
    };
  }
  
  return undefined;
}

function extractReaction(msg: any): ParsedMessage['reaction'] | undefined {
  const m = msg.message || msg;
  
  if (m.reactionMessage) {
    return {
      emoji: m.reactionMessage.text || '👍',
      sender: m.reactionMessage.key?.participant || '',
    };
  }
  
  return undefined;
}

function extractSenderInfo(msg: any): { name?: string; phone?: string } {
  const key = msg.key || {};
  const participant = key.participant || key.remoteJid || '';
  const phone = participant.replace('@s.whatsapp.net', '').replace('@lid', '');
  
  // Nome do remetente (para grupos)
  const senderName = msg.pushName || msg.senderName || undefined;
  
  return {
    name: senderName,
    phone: phone.replace(/\D/g, ''),
  };
}

// ==========================================
// PARSER PRINCIPAL
// ==========================================

export function parseMessage(
  msg: any, 
  ownPhone: string = '',
  contactsMap: Record<string, string> = {}
): ParsedMessage {
  const key = msg.key || {};
  const isMine = msg.fromMe === true || key.fromMe === true;
  const remoteJid = key.remoteJid || '';
  
  // Normalizar timestamp
  const timestamp = normalizeTimestamp(msg.messageTimestamp || msg.timestamp);
  
  // Extrair conteúdo
  const { text, type } = extractTextContent(msg);
  
  // Extrair mídia
  const media = extractMedia(msg);
  
  // Extrair info de reply
  const replyTo = extractReplyInfo(msg);
  
  // Extrair reação
  const reaction = extractReaction(msg);
  
  // Extrair info do remetente
  const sender = extractSenderInfo(msg);
  
  // Determinar se é mensagem de sistema
  const isSystem = type === 'system' || 
    !!msg.messageStubType || 
    !!msg.message?.protocolMessage;
  
  // Determinar se é encaminhada
  const isForwarded = !!msg.message?.forwardedMessage || 
    !!msg.message?.extendedTextMessage?.contextInfo?.forwardingScore;
  
  // Determinar status
  const status = isMine ? getStatusFromKey(msg) : 'sent';
  
  // Verificar se é reação a outra mensagem
  if (type === 'reaction') {
    return {
      id: key.id || msg.id || `reaction-${Date.now()}`,
      type: 'reaction',
      text: '',
      caption: '',
      isMine,
      time: formatTime(timestamp),
      timestamp,
      status: 'read',
      isSystem: false,
      isForwarded: false,
      isReply: false,
      senderName: sender.name,
      senderPhone: sender.phone,
      reaction,
      raw: msg,
    };
  }
  
  // Mensagem de sistema
  if (isSystem) {
    const systemText = getSystemMessageText(msg);
    return {
      id: key.id || msg.id || `system-${Date.now()}`,
      type: 'system',
      text: systemText,
      caption: '',
      isMine: false,
      time: formatTime(timestamp),
      timestamp,
      status: 'read',
      isSystem: true,
      isForwarded: false,
      isReply: false,
      raw: msg,
    };
  }
  
  return {
    id: key.id || msg.id || `msg-${Date.now()}-${Math.random()}`,
    type,
    text,
    caption: text,
    isMine,
    time: formatTime(timestamp),
    timestamp,
    status,
    isSystem: false,
    isForwarded,
    isReply: !!replyTo,
    replyTo,
    senderName: sender.name,
    senderPhone: sender.phone,
    media,
    raw: msg,
  };
}

// ==========================================
// MENSAGENS DE SISTEMA
// ==========================================

function getSystemMessageText(msg: any): string {
  const stubType = msg.messageStubType || msg.message?.protocolMessage?.type;
  
  if (stubType !== undefined && stubType !== null) {
    // Eventos específicos de grupo
    const groupEvents: Record<number, string> = {
      27: 'Criou o grupo',
      28: 'Alterou o assunto do grupo',
      29: 'Alterou a descrição do grupo',
      30: 'Alterou o ícone do grupo',
      31: 'Alterou o nome do grupo',
      32: 'Você foi adicionado ao grupo',
      33: 'Você saiu do grupo',
      34: 'Você foi removido do grupo',
      35: 'Alguém foi adicionado ao grupo',
      36: 'Alguém saiu do grupo',
      37: 'Alguém foi removido do grupo',
    };
    if (groupEvents[stubType]) return groupEvents[stubType];
    // Tudo o resto (0-10, 40-100+) = mensagem apagada
    return 'Mensagem apagada';
  }
  
  // Protocol messages
  if (msg.message?.protocolMessage) {
    const protoType = msg.message.protocolMessage.type;
    if (protoType === 0 || protoType === 1) return 'Mensagem apagada';
    if (protoType === 3) return 'Mensagem de texto editada';
  }
  
  return 'Mensagem de sistema';
}

// ==========================================
// AGRUPAMENTO DE MENSAGENS
// ==========================================

export interface MessageGroup {
  date: string;
  messages: ParsedMessage[];
}

export function groupMessagesByDate(messages: ParsedMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentDate = '';
  
  for (const msg of messages) {
    const date = new Date(msg.timestamp * 1000).toDateString();
    
    if (date !== currentDate) {
      currentDate = date;
      groups.push({
        date: formatDateLabel(msg.timestamp),
        messages: [msg],
      });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  
  return groups;
}

function formatDateLabel(ts: number): string {
  const date = new Date(ts * 1000);
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
      year: 'numeric',
    });
  }
}

// ==========================================
// FILTRO DE MENSAGENS POR CONVERSA
// ==========================================

export function filterMessagesByChat(
  messages: any[], 
  targetJid: string
): any[] {
  const normalizedTarget = targetJid.split(':')[0];
  
  return messages.filter(m => {
    const mJid = (m.key?.remoteJid || m.remoteJid || '').split(':')[0];
    return mJid === normalizedTarget;
  });
}
