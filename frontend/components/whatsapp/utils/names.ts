/**
 * Utilitários de resolução de nomes e formatação de dados de chat
 * Consolida lógica do WhatsAppContainer em módulo reutilizável
 */

import { normalizeForComparison, formatPhoneBR, extractPhoneFromJid, isGroupJid, isGenericGroupName, getGroupParticipantCount } from './phone';

/** Interface para resultado da resolução */
export interface ResolvedName {
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
export function resolveContactName(
  chat: any,
  crmCustomers: any[],
  contactsMap: Record<string, string>
): ResolvedName {
  const jid = chat.id || '';
  const phone = extractPhoneFromJid(jid);
  const isGroup = isGroupJid(jid);

  // === GRUPOS ===
  if (isGroup) {
    if (chat.verifiedName && chat.verifiedName.trim() && !isGenericGroupName(chat.verifiedName)) {
      return { name: chat.verifiedName.trim(), source: 'evolution_verified' };
    }
    if (chat.name && chat.name.trim() && !isGenericGroupName(chat.name)) {
      return { name: chat.name.trim(), source: 'evolution_name' };
    }
    if (chat.verifiedName && chat.verifiedName.trim()) {
      return { name: chat.verifiedName.trim(), source: 'evolution_verified' };
    }
    if (chat.name && chat.name.trim()) {
      return { name: chat.name.trim(), source: 'evolution_name' };
    }
    const count = getGroupParticipantCount(chat);
    const suffix = count > 0 ? ` (${count} participantes)` : '';
    return { name: `Grupo WhatsApp${suffix}`, source: 'generic_group' };
  }

  // === CONTATOS INDIVIDUAIS ===
  if (chat.verifiedName && chat.verifiedName.trim()) {
    const verified = chat.verifiedName.trim();
    if (verified !== phone && verified.length > 2) {
      return { name: verified, source: 'evolution_verified' };
    }
  }

  if (chat.name && chat.name.trim()) {
    const name = chat.name.trim();
    if (name !== phone && name !== 'Contato' && name.length > 2 && !name.includes(phone)) {
      return { name, source: 'evolution_name' };
    }
  }

  const normalized = normalizeForComparison(phone);
  if (crmCustomers && crmCustomers.length > 0) {
    const crmMatch = crmCustomers.find((c: any) => {
      if (!c.phone) return false;
      const crmNorm = normalizeForComparison(c.phone);
      if (crmNorm === normalized) return true;
      if (normalized.length >= 8 && crmNorm.length >= 8) {
        return normalized.slice(-8) === crmNorm.slice(-8);
      }
      return false;
    });
    if (crmMatch?.name && crmMatch.name.trim()) {
      return { name: crmMatch.name.trim(), source: 'crm' };
    }
  }

  const cached = contactsMap[jid] || contactsMap[phone] || contactsMap[normalized];
  if (cached && cached.trim()) {
    return { name: cached.trim(), source: 'cache' };
  }

  return { name: formatPhoneBR(phone), source: 'formatted_phone' };
}

/** Função wrapper para manter compatibilidade */
export function resolveNameLegacy(
  chat: any,
  crmCustomers: any[],
  contactsMap: Record<string, string>
): string {
  return resolveContactName(chat, crmCustomers, contactsMap).name;
}

/** Formata data do chat para exibição (HH:mm se hoje, DD/MM senão) */
export function formatChatDate(chatDate: any): string {
  const dateObj = new Date(typeof chatDate === 'number' ? (chatDate > 1e11 ? chatDate : chatDate * 1000) : chatDate);
  const isToday = new Date().toDateString() === dateObj.toDateString();
  return isToday
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

/** Normaliza timestamp do chat para Date */
export function normalizeChatTimestamp(chat: any): number {
  let chatDate = chat.updatedAt || chat.createdAt;
  if (!chatDate && chat.lastMessage?.messageTimestamp) {
    chatDate = chat.lastMessage.messageTimestamp;
  }
  if (!chatDate) {
    chatDate = Date.now() / 1000;
  }
  const dateObj = new Date(typeof chatDate === 'number' ? (chatDate > 1e11 ? chatDate : chatDate * 1000) : chatDate);
  return dateObj.getTime();
}
