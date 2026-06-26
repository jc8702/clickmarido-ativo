/**
 * Interfaces compartilhadas do módulo WhatsApp
 * Consolidar tipos em um único lugar para evitar duplicação
 */

export interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  avatar?: string;
  lastMessage: string;
  lastMessageSender?: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  updatedAt?: number;
}

export interface WhatsAppLabel {
  id: string;
  name: string;
  color: string;
  _count?: { conversations: number };
}

export interface WhatsAppFavorite {
  id: string;
  phone: string;
}

export interface WhatsAppArchived {
  id: string;
  phone: string;
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
  data?: any;
}

export type SendTextFn = (number: string, text: string) => Promise<SendMessageResult>;
export type SendMediaFn = (number: string, media: string, options?: {
  mediatype?: 'image' | 'video' | 'audio' | 'document';
  mimetype?: string;
  caption?: string;
  fileName?: string;
}) => Promise<SendMessageResult>;
