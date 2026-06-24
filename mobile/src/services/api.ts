import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Detecta o IP da máquina host de desenvolvimento para se conectar ao backend Next.js local
const getBackendUrl = () => {
  // Em produção ou na Vercel, use a URL de produção
  if (process.env.NODE_ENV === 'production') {
    return 'https://clickmarido-ativo-frontend.vercel.app'; 
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  // Fallbacks comuns
  return 'http://10.0.2.2:3000'; // Emulador Android padrão
};

export const BASE_URL = getBackendUrl();
export const API_URL = `${BASE_URL}/api`;

console.log('🔌 Conectando API em:', API_URL);

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

// Helper genérico para chamadas de API com injeção automática de token JWT
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const token = await AsyncStorage.getItem('@ClickMarido:token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = { error: 'Erro na requisição' };
    try {
      errorData = await response.json();
    } catch (_) {}
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Controle de Fila Offline
export interface SyncItem {
  id: string;
  action: 'start_os' | 'complete_os';
  osId: string;
  payload: any;
  timestamp: number;
}

export const OfflineStorage = {
  // Salvar OS em cache local
  saveOSListCache: async (list: any[]) => {
    try {
      await AsyncStorage.setItem('@ClickMarido:os_cache', JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao salvar cache de OS', err);
    }
  },

  // Obter OS em cache local
  getOSListCache: async (): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem('@ClickMarido:os_cache');
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  },

  // Adicionar ação na fila de sincronização
  enqueueAction: async (action: 'start_os' | 'complete_os', osId: string, payload: any) => {
    try {
      const queueData = await AsyncStorage.getItem('@ClickMarido:sync_queue');
      const queue: SyncItem[] = queueData ? JSON.parse(queueData) : [];
      
      const newItem: SyncItem = {
        id: Math.random().toString(36).substring(7),
        action,
        osId,
        payload,
        timestamp: Date.now(),
      };
      
      queue.push(newItem);
      await AsyncStorage.setItem('@ClickMarido:sync_queue', JSON.stringify(queue));
      
      // Atualizar status no cache local da OS imediatamente para feedback visual do usuário
      const osCache = await OfflineStorage.getOSListCache();
      const updatedCache = osCache.map((os: any) => {
        if (os.id === osId) {
          return {
            ...os,
            status: action === 'start_os' ? 'em_andamento' : 'concluida',
            // Se concluída offline, junta o payload
            ...(action === 'complete_os' ? { localCompleted: true, ...payload } : {})
          };
        }
        return os;
      });
      await OfflineStorage.saveOSListCache(updatedCache);

      return true;
    } catch (err) {
      console.error('Erro ao enfileirar ação offline', err);
      return false;
    }
  },

  // Obter fila de sincronização
  getSyncQueue: async (): Promise<SyncItem[]> => {
    try {
      const queueData = await AsyncStorage.getItem('@ClickMarido:sync_queue');
      return queueData ? JSON.parse(queueData) : [];
    } catch (_) {
      return [];
    }
  },

  // Limpar fila de sincronização
  clearSyncQueue: async () => {
    try {
      await AsyncStorage.removeItem('@ClickMarido:sync_queue');
    } catch (err) {
      console.error('Erro ao limpar fila de sincronização', err);
    }
  },

  // Executar sincronização da fila com o servidor
  syncOfflineActions: async (): Promise<{ success: boolean; syncedCount: number }> => {
    try {
      const queue = await OfflineStorage.getSyncQueue();
      if (queue.length === 0) return { success: true, syncedCount: 0 };

      console.log(`🔄 Sincronizando ${queue.length} ações offline com o servidor...`);
      let syncedCount = 0;

      for (const item of queue) {
        try {
          if (item.action === 'start_os') {
            await apiFetch(`/service-orders/${item.osId}/start`, { method: 'PUT' });
          } else if (item.action === 'complete_os') {
            const { photosBefore, photosAfter, ...cleanPayload } = item.payload;

            // Upload de fotos de Antes
            if (photosBefore && Array.isArray(photosBefore)) {
              for (const uri of photosBefore) {
                await uploadPhotoOffline(item.osId, uri, 'before');
              }
            }

            // Upload de fotos de Depois
            if (photosAfter && Array.isArray(photosAfter)) {
              for (const uri of photosAfter) {
                await uploadPhotoOffline(item.osId, uri, 'after');
              }
            }

            await apiFetch(`/service-orders/${item.osId}/complete`, {
              method: 'POST',
              body: JSON.stringify(cleanPayload),
            });
          }
          syncedCount++;
        } catch (err) {
          console.warn(`⚠️ Falha ao sincronizar item da fila ${item.id}:`, err);
          // Se falhar (ex: servidor indisponível), interrompe para tentar mais tarde
          return { success: false, syncedCount };
        }
      }

      await OfflineStorage.clearSyncQueue();
      return { success: true, syncedCount };
    } catch (err) {
      console.error('Erro geral ao processar sincronização', err);
      return { success: false, syncedCount: 0 };
    }
  }
};

// Helper auxiliar para upload de foto offline
async function uploadPhotoOffline(osId: string, localUri: string, type: 'before' | 'after') {
  const token = await AsyncStorage.getItem('@ClickMarido:token');
  const filename = localUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

  const formData = new FormData();
  // @ts-ignore
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  });
  formData.append('serviceOrderId', osId);
  formData.append('type', type);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Falha no upload da foto offline');
  }
}
