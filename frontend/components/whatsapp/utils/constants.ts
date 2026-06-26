/**
 * Constantes compartilhadas do módulo WhatsApp
 * Evita dependências circulares entre componentes
 */

export const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
export const API_KEY = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
export const INSTANCE_NAME = 'clickmarido_instance';
