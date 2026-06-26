/**
 * Utilitários de extração e formatação de mensagens
 * Consolida lógica duplicada entre WhatsAppContainer e ConversationItem
 */

/** Resultado da extração da última mensagem */
export interface LastMessageResult {
  text: string;
  sender: string;
}

/**
 * Extrai texto e remetente da última mensagem de um chat
 * Suporta: conversation, extendedText, image, video, audio, document, sticker
 */
export function extractLastMessage(lastMessage: any): LastMessageResult {
  let text = 'Sem mensagem';
  let sender = '';

  if (!lastMessage) return { text, sender };

  const msg = lastMessage.message || lastMessage;

  if (msg.conversation) text = msg.conversation;
  else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
  else if (msg.imageMessage) text = msg.imageMessage.caption ? `📷 ${msg.imageMessage.caption}` : '📷 Foto';
  else if (msg.videoMessage) text = msg.videoMessage.caption ? `🎥 ${msg.videoMessage.caption}` : '🎥 Vídeo';
  else if (msg.audioMessage) text = '🎵 Áudio';
  else if (msg.documentMessage) text = msg.documentMessage.title ? `📄 ${msg.documentMessage.title}` : '📄 Documento';
  else if (msg.stickerMessage) text = '💟 Figurinha';

  // Extrair nome do remetente (apenas para grupos)
  const remoteJid = lastMessage.key?.remoteJid || '';
  if (remoteJid.includes('@g.us')) {
    if (lastMessage.key?.participant || lastMessage.participant || lastMessage.pushName) {
      sender = lastMessage.pushName || (lastMessage.key?.participant || lastMessage.participant || '').split('@')[0];
    }
  }

  return { text, sender };
}

/** Formata tamanho de arquivo para exibição */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
