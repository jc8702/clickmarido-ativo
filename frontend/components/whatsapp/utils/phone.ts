/**
 * Utilitários compartilhados de normalização de telefones WhatsApp
 * Consolida lógica duplicada entre WhatsAppContainer e useEvolutionApi
 */

/** Remove tudo que não é dígito */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/** Normaliza para comparação (remove DDI 55, foca nos últimos 8-9 dígitos) */
export function normalizeForComparison(phone: string): string {
  const cleaned = normalizePhone(phone);
  // Remove DDI 55 se presente e tem 12+ dígitos
  if (cleaned.length >= 12 && cleaned.startsWith('55')) {
    return cleaned.slice(2);
  }
  return cleaned;
}

/** Normaliza número para envio na EvolutionAPI (adiciona DDI 55 se necessário) */
export function normalizeNumberForSend(number: string): string {
  let cleaned = normalizePhone(number);
  
  // Se começa com 55 e tem 12+ dígitos, já tem DDI
  if (cleaned.length >= 12 && cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Se tem 11 dígitos (DDD + número), adiciona DDI 55
  if (cleaned.length === 11) {
    return '55' + cleaned;
  }
  
  // Se tem 10 dígitos (DDD + número fixo), adiciona DDI 55
  if (cleaned.length === 10) {
    return '55' + cleaned;
  }
  
  // Retorna como está (pode ser internacional)
  return cleaned;
}

/** Formata telefone brasileiro para exibição */
export function formatPhoneBR(phone: string): string {
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
export function extractPhoneFromJid(jid: string): string {
  return (jid || '').split('@')[0].replace(/\D/g, '');
}

/** Verifica se é JID de grupo */
export function isGroupJid(jid: string): boolean {
  return jid?.includes('@g.us') ?? false;
}

/** Verifica se nome de grupo é genuinamente vazio/genérico */
export function isGenericGroupName(name: string): boolean {
  if (!name || !name.trim()) return true;
  const trimmed = name.trim();
  // Apenas rejeitar nomes muito curtos ou que são literalmente só números
  if (trimmed.length < 2) return true;
  if (/^\d+$/.test(trimmed)) return true;
  // Nomes como "Família", "Trabalho", "Equipe" são nomes REAIS de grupos
  // Não rejeitar - apenas rejeitar se o nome for só "Grupo" ou "Group" sem nada depois
  if (/^(grupo|group)$/i.test(trimmed)) return true;
  return false;
}

/** Conta participantes estimados de um grupo */
export function getGroupParticipantCount(chat: any): number {
  return chat?.participants?.length || chat?.participantCount || 0;
}
