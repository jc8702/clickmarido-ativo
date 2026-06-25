'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ==========================================
// HOOK: useEvolutionApi
// Gerenciamento completo da integração com EvolutionAPI
// ==========================================

export type ConnectionStatus = 
  | 'offline'      // API inacessível
  | 'connecting'   // Conectando/Tentando obter QR
  | 'qrcode'       // QR Code pendente para leitura
  | 'connected'    // Conectado e funcional
  | 'error';       // Erro na conexão

export interface EvolutionApiConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  pollingInterval?: number; // ms (default: 5000)
  qrCooldown?: number;     // ms (default: 50000)
  apiTimeout?: number;      // ms (default: 10000)
}

export interface EvolutionApiState {
  status: ConnectionStatus;
  apiOnline: boolean;
  qrCode: string | null;
  error: string | null;
  lastConnectedAt: number | null;
  instanceExists: boolean;
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
  data?: any;
}

// ==========================================
// LOGGING
// ==========================================

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[EvolutionAPI ${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(prefix, msg, data || '');
  } else if (level === 'warn') {
    console.warn(prefix, msg, data || '');
  } else {
    console.log(prefix, msg, data || '');
  }
}

// ==========================================
// PAYLOAD NORMALIZERS
// ==========================================

function normalizeNumber(number: string): string {
  // Remove caracteres não numéricos
  let cleaned = number.replace(/\D/g, '');
  
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

function buildTextPayload(number: string, text: string) {
  return {
    number: normalizeNumber(number),
    textMessage: { text }
  };
}

function buildMediaPayload(
  number: string, 
  media: string, 
  options: {
    mediatype?: string;
    mimetype?: string;
    caption?: string;
    fileName?: string;
  } = {}
) {
  return {
    number: normalizeNumber(number),
    mediaMessage: {
      mediatype: options.mediatype || 'document',
      mimetype: options.mimetype || 'application/octet-stream',
      caption: options.caption || '',
      media: media,
      fileName: options.fileName || 'file',
    }
  };
}

function buildGroupTextPayload(groupId: string, text: string) {
  // Group IDs já vêm no formato correto (xxx@g.us)
  return {
    number: groupId,
    textMessage: { text }
  };
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

export function useEvolutionApi(config: EvolutionApiConfig) {
  const {
    apiUrl,
    apiKey,
    instanceName,
    pollingInterval = 5000,
    qrCooldown = 50000,
    apiTimeout = 10000,
  } = config;

  const [state, setState] = useState<EvolutionApiState>({
    status: 'offline',
    apiOnline: false,
    qrCode: null,
    error: null,
    lastConnectedAt: null,
    instanceExists: false,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastQrGenerationRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // ==========================================
  // API FETCH COM TIMEOUT
  // ==========================================

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiTimeout);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        ...(options.headers || {}),
      };

      const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        log('warn', `Timeout na requisição: ${path}`);
        throw new Error('API_TIMEOUT');
      }
      
      throw err;
    }
  }, [apiUrl, apiKey, apiTimeout]);

  // ==========================================
  // CRIAR INSTÂNCIA
  // ==========================================

  const createInstance = useCallback(async (): Promise<boolean> => {
    try {
      log('info', 'Criando instância...');
      
      const res = await apiFetch('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          token: apiKey,
          qrcode: true,
          webhook: {
            enabled: false,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        log('error', 'Erro ao criar instância', errData);
        return false;
      }

      const data = await res.json();
      log('info', 'Instância criada com sucesso', { instanceName });
      
      // Extrair QR Code da resposta
      const qr = data.qrcode?.base64 || data.base64 || data.qrcode || null;
      if (qr && mountedRef.current) {
        setState(prev => ({ ...prev, qrCode: qr, status: 'qrcode', instanceExists: true }));
        lastQrGenerationRef.current = Date.now();
      }

      return true;
    } catch (err: any) {
      log('error', 'Falha ao criar instância', err);
      return false;
    }
  }, [apiFetch, instanceName, apiKey]);

  // ==========================================
  // VERIFICAR ESTADO DA CONEXÃO
  // ==========================================

  const checkConnection = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      const res = await apiFetch(`/instance/connectionState/${instanceName}`);
      
      if (!res.ok) {
        // 404 = instância não existe
        if (res.status === 404) {
          log('info', 'Instância não existe, criando...');
          if (mountedRef.current) {
            setState(prev => ({ ...prev, instanceExists: false, status: 'connecting' }));
          }
          await createInstance();
          return;
        }
        
        // Outro erro HTTP
        log('warn', `Erro HTTP ${res.status} ao verificar conexão`);
        if (mountedRef.current) {
          setState(prev => ({ ...prev, status: 'error', error: `HTTP ${res.status}`, apiOnline: true }));
        }
        return;
      }

      const data = await res.json();
      
      // API está online
      if (mountedRef.current) {
        setState(prev => ({ ...prev, apiOnline: true, error: null }));
      }

      // Verificar estado da instância
      const instanceState = data.instance?.state || data.state;
      
      if (instanceState === 'open') {
        // Conectado!
        log('info', 'WhatsApp conectado');
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            status: 'connected',
            qrCode: null,
            error: null,
            instanceExists: true,
            lastConnectedAt: Date.now(),
          }));
          reconnectAttemptsRef.current = 0;
        }
      } else if (instanceState === 'close' || instanceState === 'disconnected') {
        // Desconectado - tentar reconectar
        log('info', 'WhatsApp desconectado, tentando reconectar...');
        if (mountedRef.current) {
          setState(prev => ({ ...prev, status: 'connecting', instanceExists: true }));
        }
        await reconnect();
      } else if (instanceState === 'connecting') {
        // Já está conectando
        if (mountedRef.current) {
          setState(prev => ({ ...prev, status: 'connecting', instanceExists: true }));
        }
      } else {
        // Estado desconhecido
        log('warn', `Estado desconhecido: ${instanceState}`);
        if (mountedRef.current) {
          setState(prev => ({ ...prev, status: 'error', error: `Estado: ${instanceState}`, instanceExists: true }));
        }
      }
    } catch (err: any) {
      log('error', 'Falha ao verificar conexão', err);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'offline',
          apiOnline: false,
          error: err.message || 'Erro de conexão',
        }));
      }
    }
  }, [apiFetch, instanceName, createInstance]);

  // ==========================================
  // RECONEXÃO
  // ==========================================

  const reconnect = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastGen = now - lastQrGenerationRef.current;
    
    // Cooldown para evitar loops
    if (timeSinceLastGen < qrCooldown) {
      log('info', 'Cooldown ativo, aguardando...');
      return;
    }

    // Limitar tentativas
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      log('warn', 'Máximo de tentativas de reconexão atingido');
      if (mountedRef.current) {
        setState(prev => ({ ...prev, status: 'error', error: 'Máximo de tentativas atingido' }));
      }
      return;
    }

    reconnectAttemptsRef.current++;
    lastQrGenerationRef.current = now;

    try {
      log('info', `Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      
      const res = await apiFetch(`/instance/connect/${instanceName}`, {
        method: 'POST',
      });

      if (!res.ok) {
        log('warn', 'Falha ao conectar instância');
        return;
      }

      const data = await res.json();
      
      // Extrair QR Code
      const qr = data.base64 || data.qrcode?.base64 || data.code || null;
      
      if (qr && mountedRef.current) {
        setState(prev => ({ ...prev, qrCode: qr, status: 'qrcode', instanceExists: true }));
        log('info', 'QR Code obtido, aguardando leitura');
      }
    } catch (err: any) {
      log('error', 'Falha na reconexão', err);
    }
  }, [apiFetch, instanceName, qrCooldown]);

  // ==========================================
  // POLLING
  // ==========================================

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Verificar imediatamente
    checkConnection();

    // Configurar polling
    pollingRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkConnection();
      }
    }, pollingInterval);

    log('info', `Polling iniciado (intervalo: ${pollingInterval}ms)`);
  }, [checkConnection, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      log('info', 'Polling parado');
    }
  }, []);

  // ==========================================
  // ENVIAR MENSAGEM DE TEXTO
  // ==========================================

  const sendText = useCallback(async (
    number: string, 
    text: string
  ): Promise<SendMessageResult> => {
    if (!text.trim()) {
      return { success: false, error: 'Mensagem vazia' };
    }

    try {
      const isGroup = number.includes('@g.us');
      const payload = isGroup 
        ? buildGroupTextPayload(number, text)
        : buildTextPayload(number, text);

      log('info', 'Enviando texto', { number: payload.number });

      const res = await apiFetch(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || errData.error || `HTTP ${res.status}`;
        log('error', 'Erro ao enviar texto', errData);
        return { success: false, error: errorMsg };
      }

      const data = await res.json();
      log('info', 'Texto enviado com sucesso');
      return { success: true, data };
    } catch (err: any) {
      log('error', 'Falha ao enviar texto', err);
      return { success: false, error: err.message || 'Erro desconhecido' };
    }
  }, [apiFetch, instanceName]);

  // ==========================================
  // ENVIAR MÍDIA
  // ==========================================

  const sendMedia = useCallback(async (
    number: string,
    media: string,
    options: {
      mediatype?: 'image' | 'video' | 'audio' | 'document';
      mimetype?: string;
      caption?: string;
      fileName?: string;
    } = {}
  ): Promise<SendMessageResult> => {
    if (!media) {
      return { success: false, error: 'Mídia vazia' };
    }

    try {
      const isGroup = number.includes('@g.us');
      
      // Para grupos, usar o número diretamente
      const payload = isGroup
        ? {
            number: number,
            mediaMessage: {
              mediatype: options.mediatype || 'document',
              mimetype: options.mimetype || 'application/octet-stream',
              caption: options.caption || '',
              media: media,
              fileName: options.fileName || 'file',
            }
          }
        : buildMediaPayload(number, media, options);

      log('info', 'Enviando mídia', { number: payload.number, type: options.mediatype });

      const res = await apiFetch(`/message/sendMedia/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || errData.error || `HTTP ${res.status}`;
        log('error', 'Erro ao enviar mídia', errData);
        return { success: false, error: errorMsg };
      }

      const data = await res.json();
      log('info', 'Mídia enviada com sucesso');
      return { success: true, data };
    } catch (err: any) {
      log('error', 'Falha ao enviar mídia', err);
      return { success: false, error: err.message || 'Erro desconhecido' };
    }
  }, [apiFetch, instanceName]);

  // ==========================================
  // CARREGAR CHATS
  // ==========================================

  const loadChats = useCallback(async (): Promise<any[]> => {
    try {
      const res = await apiFetch(`/chat/findChats/${instanceName}`);
      
      if (!res.ok) {
        log('warn', 'Erro ao carregar chats');
        return [];
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      log('error', 'Falha ao carregar chats', err);
      return [];
    }
  }, [apiFetch, instanceName]);

  // ==========================================
  // CARREGAR MENSAGENS
  // ==========================================

  const loadMessages = useCallback(async (chatId: string): Promise<any[]> => {
    try {
      const targetJid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
      
      const res = await apiFetch(`/chat/findMessages/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: targetJid } }),
      });

      if (!res.ok) {
        log('warn', 'Erro ao carregar mensagens');
        return [];
      }

      const data = await res.json();
      
      // Extrair mensagens de diferentes formatos
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.records)) return data.records;
      if (data.messages) {
        if (Array.isArray(data.messages)) return data.messages;
        if (Array.isArray(data.messages.records)) return data.messages.records;
      }
      if (Array.isArray(data.data)) return data.data;
      
      return [];
    } catch (err: any) {
      log('error', 'Falha ao carregar mensagens', err);
      return [];
    }
  }, [apiFetch, instanceName]);

  // ==========================================
  // DESCONECTAR
  // ==========================================

  const disconnect = useCallback(async (): Promise<boolean> => {
    try {
      stopPolling();
      
      const res = await apiFetch(`/instance/logout/${instanceName}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        log('info', 'Instância desconectada');
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            status: 'offline',
            qrCode: null,
            connected: false,
          }));
        }
        return true;
      }
      
      return false;
    } catch (err: any) {
      log('error', 'Falha ao desconectar', err);
      return false;
    }
  }, [apiFetch, instanceName, stopPolling]);

  // ==========================================
  // RESETAR ERRO
  // ==========================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    // Estado
    ...state,
    
    // Ações
    apiFetch,
    sendText,
    sendMedia,
    loadChats,
    loadMessages,
    reconnect,
    disconnect,
    clearError,
    startPolling,
    stopPolling,
    
    // Utilitários
    normalizeNumber,
  };
}
