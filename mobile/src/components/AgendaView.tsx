import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, OfflineStorage, BASE_URL } from '../services/api';
import {
  Calendar,
  LogOut,
  MapPin,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  Play,
  ClipboardList
} from 'lucide-react-native';

interface AgendaViewProps {
  user: any;
  onLogout: () => void;
  onSelectOS: (osId: string) => void;
}

export function AgendaView({ user, onLogout, onSelectOS }: AgendaViewProps) {
  const theme = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Carregar dados de sincronização e OSs
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Checar tamanho da fila offline
      const queue = await OfflineStorage.getSyncQueue();
      setSyncQueueSize(queue.length);

      // 2. Se temos itens na fila e conseguirmos conexão, tenta sincronizar
      if (queue.length > 0) {
        try {
          // Testa ping rápido ou tenta sincronizar
          setSyncing(true);
          const syncResult = await OfflineStorage.syncOfflineActions();
          setSyncing(false);
          
          if (syncResult.syncedCount > 0) {
            Alert.alert(
              'Sincronização',
              `${syncResult.syncedCount} ações offline foram sincronizadas com sucesso!`
            );
            // Atualiza tamanho da fila
            const updatedQueue = await OfflineStorage.getSyncQueue();
            setSyncQueueSize(updatedQueue.length);
          }
        } catch (_) {
          setSyncing(false);
        }
      }

      // 3. Buscar OSs (Tenta do servidor, se falhar cai no cache local)
      let data: any = null;
      try {
        const queryParams = user.technicianId 
          ? `?technicianId=${user.technicianId}&limit=50` 
          : '?limit=50';
          
        data = await apiFetch(`/service-orders${queryParams}`);
        setIsOffline(false);
        
        // Salva no cache local para uso offline posterior
        if (data && data.data) {
          await OfflineStorage.saveOSListCache(data.data);
          setOrders(data.data);
        }
      } catch (netErr) {
        console.log('Sem conexão, carregando do cache local:', netErr);
        setIsOffline(true);
        const cachedData = await OfflineStorage.getOSListCache();
        setOrders(cachedData);
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar as ordens de serviço.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncManual = async () => {
    if (syncQueueSize === 0) return;
    setSyncing(true);
    try {
      const syncResult = await OfflineStorage.syncOfflineActions();
      setSyncQueueSize((await OfflineStorage.getSyncQueue()).length);
      if (syncResult.success) {
        Alert.alert('Sucesso', 'Sincronização concluída!');
        loadData();
      } else {
        Alert.alert('Atenção', 'Apenas parte das ações foi sincronizada. Verifique sua conexão.');
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return '#10b981'; // verde
      case 'em_andamento':
        return '#0284c7'; // azul
      case 'agendada':
      default:
        return '#f59e0b'; // laranja
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'agendada':
      default:
        return 'Agendada';
    }
  };

  const renderOSItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const dateFormatted = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        })
      : '--/--';
    const timeFormatted = item.scheduledTime
      ? new Date(item.scheduledTime).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';

    return (
      <TouchableOpacity
        style={[styles.osCard, { backgroundColor: theme.backgroundElement }]}
        onPress={() => onSelectOS(item.id)}
      >
        {/* Cabeçalho do Card */}
        <ThemedView style={styles.cardHeader}>
          <ThemedView style={styles.numberContainer}>
            <ClipboardList size={16} color={theme.text} />
            <ThemedText style={styles.osNumber}>{item.number}</ThemedText>
          </ThemedView>
          <ThemedView
            style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}
          >
            <ThemedText style={{ color: statusColor, fontSize: 11, fontWeight: 'bold' }}>
              {getStatusLabel(item.status)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Informações da OS */}
        <ThemedView style={styles.cardBody}>
          <ThemedText style={styles.clientName}>{item.customer?.name || 'Cliente Geral'}</ThemedText>
          
          <ThemedView style={styles.infoRow}>
            <MapPin size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.address || 'Sem endereço cadastrado'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoRow}>
            <Clock size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              {dateFormatted} às {timeFormatted}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Indicador de Alteração Local Offline */}
        {item.localCompleted && (
          <ThemedView style={styles.offlineCompletedIndicator}>
            <WifiOff size={12} color="#fff" />
            <ThemedText style={styles.offlineCompletedText}>Aguardando envio ao servidor</ThemedText>
          </ThemedView>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Cabeçalho do Usuário */}
      <ThemedView style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
        <ThemedView style={styles.userProfile}>
          <ThemedView style={[styles.avatar, { backgroundColor: theme.background }]}>
            <User size={20} color={theme.text} />
          </ThemedView>
          <ThemedView>
            <ThemedText style={styles.userName}>{user.name}</ThemedText>
            <ThemedText style={[styles.userRole, { color: theme.textSecondary }]}>
              Técnico Credenciado
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </ThemedView>

      {/* Barra de Status da Conexão / Sincronização */}
      <ThemedView style={styles.statusBanner}>
        {isOffline ? (
          <ThemedView style={[styles.bannerRow, { backgroundColor: '#ef444422' }]}>
            <WifiOff size={16} color="#ef4444" />
            <ThemedText style={{ color: '#ef4444', fontSize: 13, fontWeight: '500' }}>
              Modo Offline (Carregado do cache)
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={[styles.bannerRow, { backgroundColor: '#10b98122' }]}>
            <Wifi size={16} color="#10b981" />
            <ThemedText style={{ color: '#10b981', fontSize: 13, fontWeight: '500' }}>
              Conectado ao servidor
            </ThemedText>
          </ThemedView>
        )}

        {syncQueueSize > 0 && (
          <TouchableOpacity
            style={[styles.syncBanner, { backgroundColor: '#0284c7' }]}
            onPress={handleSyncManual}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedView style={styles.syncRow}>
                <RefreshCw size={14} color="#fff" />
                <ThemedText style={styles.syncText}>
                  Sincronizar {syncQueueSize} ação(ões) salvas offline
                </ThemedText>
              </ThemedView>
            )}
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Título da Agenda */}
      <ThemedView style={styles.agendaTitleContainer}>
        <Calendar size={18} color={theme.text} />
        <ThemedText style={styles.agendaTitle}>Minha Agenda</ThemedText>
      </ThemedView>

      {/* Lista de OSs */}
      {loading ? (
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <ThemedText style={{ marginTop: Spacing.two }}>Carregando agenda...</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOSItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#0284c7"
            />
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Calendar size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhuma ordem de serviço agendada para você.
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb22',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb22',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 12,
  },
  logoutButton: {
    padding: Spacing.two,
  },
  statusBanner: {
    gap: Spacing.one,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    gap: Spacing.one,
  },
  syncBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  syncText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  agendaTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  osCard: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: Spacing.two,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  osNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardBody: {
    backgroundColor: 'transparent',
    gap: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  offlineCompletedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  offlineCompletedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  },
});
