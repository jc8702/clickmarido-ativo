import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, OfflineStorage, BASE_URL } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Play,
  CheckCircle,
  Camera,
  Trash2,
  PenTool,
  Save,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface OSDetailViewProps {
  osId: string;
  onBack: () => void;
}

export function OSDetailView({ osId, onBack }: OSDetailViewProps) {
  const theme = useTheme();
  const [os, setOS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Estados do fluxo de execução
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Verificar local e isolamento', done: false },
    { id: '2', text: 'Realizar o reparo conforme orçamento', done: false },
    { id: '3', text: 'Limpar a área de trabalho', done: false },
    { id: '4', text: 'Testar funcionamento junto ao cliente', done: false },
  ]);
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  // Estados de Assinatura
  const [signerName, setSignerName] = useState('');
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Carregar dados da OS
  useEffect(() => {
    async function loadOS() {
      setLoading(true);
      try {
        // Tenta buscar da API
        const data = await apiFetch(`/service-orders/${osId}`);
        setOS(data);
        setIsOffline(false);
        
        // Se a OS já tem checklist gravado, restaura
        if (data.notes && data.notes.startsWith('[CHECKLIST]')) {
          try {
            const checklistData = JSON.parse(data.notes.replace('[CHECKLIST]', ''));
            setChecklist(checklistData);
          } catch (_) {}
        }
      } catch (err) {
        console.log('Erro ao buscar OS, usando dados do cache:', err);
        setIsOffline(true);
        const cachedOSs = await OfflineStorage.getOSListCache();
        const found = cachedOSs.find((item) => item.id === osId);
        if (found) {
          setOS(found);
          if (found.notes && found.notes.startsWith('[CHECKLIST]')) {
            try {
              const checklistData = JSON.parse(found.notes.replace('[CHECKLIST]', ''));
              setChecklist(checklistData);
            } catch (_) {}
          }
        } else {
          Alert.alert('Erro', 'Ordem de serviço não encontrada no cache local.');
          onBack();
        }
      } finally {
        setLoading(false);
      }
    }

    loadOS();
  }, [osId, onBack]);

  // Função para abrir o endereço no mapa do celular
  const handleOpenMap = () => {
    if (!os?.address) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(os.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(os.address)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(os.address)}`,
    });
    Linking.openURL(url);
  };

  // Iniciar a OS
  const handleStartOS = async () => {
    setUpdating(true);
    try {
      if (isOffline) {
        await OfflineStorage.enqueueAction('start_os', osId, {});
        setOS((prev: any) => ({ ...prev, status: 'em_andamento' }));
        Alert.alert('Aviso', 'OS iniciada localmente (Sem conexão). Será sincronizada depois.');
      } else {
        await apiFetch(`/service-orders/${osId}/start`, { method: 'PUT' });
        setOS((prev: any) => ({ ...prev, status: 'em_andamento' }));
        Alert.alert('Sucesso', 'Ordem de serviço iniciada!');
      }
    } catch (error: any) {
      // Fallback offline se a chamada falhar
      await OfflineStorage.enqueueAction('start_os', osId, {});
      setOS((prev: any) => ({ ...prev, status: 'em_andamento' }));
      Alert.alert('Offline', 'Servidor indisponível. OS iniciada localmente.');
    } finally {
      setUpdating(false);
    }
  };

  // Controle de Checklist
  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Capturar Foto
  const handleTakePhoto = async (type: 'before' | 'after') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão', 'Precisamos de acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      if (type === 'before') {
        setPhotosBefore((prev) => [...prev, uri]);
      } else {
        setPhotosAfter((prev) => [...prev, uri]);
      }
    }
  };

  const handleRemovePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setPhotosBefore((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotosAfter((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Manipuladores da lousa de assinatura digital em SVG
  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath(`M ${locationX.toFixed(0)} ${locationY.toFixed(0)}`);
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prev) => `${prev} L ${locationX.toFixed(0)} ${locationY.toFixed(0)}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath('');
    }
  };

  const handleClearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  // Helper auxiliar para upload de fotos no modo online
  const uploadPhoto = async (photoUri: string, type: 'before' | 'after') => {
    const token = await AsyncStorage.getItem('@ClickMarido:token');
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: photoUri,
      name: filename,
      type: mimeType,
    });
    formData.append('serviceOrderId', osId);
    formData.append('type', type);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha no upload de uma das fotos.');
    }
  };

  // Enviar / Concluir OS
  const handleCompleteOS = async () => {
    if (checklist.some((item) => !item.done)) {
      Alert.alert('Pendência', 'Por favor, execute todos os itens do checklist antes de finalizar.');
      return;
    }

    if (!signerName.trim()) {
      Alert.alert('Identificação', 'Por favor, preencha o nome de quem está assinando.');
      return;
    }

    if (paths.length === 0) {
      Alert.alert('Assinatura', 'A assinatura do cliente é obrigatória.');
      return;
    }

    setUpdating(true);
    try {
      const signatureSvg = paths.join(' ');
      const payload = {
        signerName: signerName.trim(),
        signatureData: signatureSvg, // Salva o caminho vetorial SVG
        notes: `[CHECKLIST]${JSON.stringify(checklist)}`,
      };

      if (isOffline) {
        // Enfileira com as URIs locais para sincronizar fotos depois
        const offlinePayload = {
          ...payload,
          photosBefore,
          photosAfter,
        };
        await OfflineStorage.enqueueAction('complete_os', osId, offlinePayload);
        Alert.alert('Sucesso', 'Ordem de serviço finalizada localmente! Sincronize quando tiver sinal.');
        onBack();
      } else {
        // Fazer upload das fotos de Antes
        for (const uri of photosBefore) {
          await uploadPhoto(uri, 'before');
        }

        // Fazer upload das fotos de Depois
        for (const uri of photosAfter) {
          await uploadPhoto(uri, 'after');
        }

        // Envia conclusão
        await apiFetch(`/service-orders/${osId}/complete`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('Sucesso', 'Ordem de serviço concluída com sucesso!');
        onBack();
      }
    } catch (error: any) {
      // Fallback offline
      const signatureSvg = paths.join(' ');
      const payload = {
        signerName: signerName.trim(),
        signatureData: signatureSvg,
        notes: `[CHECKLIST]${JSON.stringify(checklist)}`,
        photosBefore,
        photosAfter,
      };
      await OfflineStorage.enqueueAction('complete_os', osId, payload);
      Alert.alert('Offline', 'Servidor fora do ar. OS finalizada localmente com sucesso.');
      onBack();
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <ThemedText style={{ marginTop: Spacing.two }}>Buscando detalhes da OS...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Cabeçalho */}
      <ThemedView style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>OS #{os?.number}</ThemedText>
        <ThemedView style={{ width: 24 }} />
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Painel Geral da OS */}
        <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.clientName}>{os?.customer?.name}</ThemedText>
          
          <TouchableOpacity onPress={handleOpenMap} style={styles.addressRow}>
            <MapPin size={18} color="#0284c7" />
            <ThemedText style={styles.addressText}>{os?.address}</ThemedText>
          </TouchableOpacity>

          {os?.customer?.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${os.customer.phone}`)}
              style={styles.addressRow}
            >
              <Phone size={18} color="#10b981" />
              <ThemedText style={styles.addressText}>{os.customer.phone}</ThemedText>
            </TouchableOpacity>
          )}

          <ThemedView style={styles.divider} />
          
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Descrição do Serviço</ThemedText>
          <ThemedText style={styles.notesText}>{os?.notes || 'Nenhuma observação informada.'}</ThemedText>
          
          <ThemedView style={styles.divider} />
          
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Valor do Orçamento</ThemedText>
          <ThemedText style={styles.priceText}>R$ {os?.finalTotal?.toFixed(2)}</ThemedText>
        </ThemedView>

        {/* Status: AGENDADA (Fluxo para Iniciar) */}
        {os?.status === 'agendada' && (
          <ThemedView style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#0284c7' }]}
              onPress={handleStartOS}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Play size={20} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>Iniciar Atendimento</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Status: EM ANDAMENTO (Checklist, Fotos e Assinatura) */}
        {os?.status === 'em_andamento' && (
          <>
            {/* Checklist */}
            <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Checklist Operacional</ThemedText>
              {checklist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  {item.done ? (
                    <CheckSquare size={22} color="#0284c7" />
                  ) : (
                    <Square size={22} color={theme.textSecondary} />
                  )}
                  <ThemedText style={[styles.checklistText, item.done && styles.checklistTextDone]}>
                    {item.text}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>

            {/* Galeria de Fotos Antes/Depois */}
            <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Evidências Fotográficas</ThemedText>
              
              {/* Fotos de ANTES */}
              <ThemedView style={styles.photoHeader}>
                <ThemedText style={styles.photoTitle}>Fotos: Antes do Reparo</ThemedText>
                <TouchableOpacity
                  style={styles.photoAddButton}
                  onPress={() => handleTakePhoto('before')}
                >
                  <Camera size={16} color="#0284c7" />
                  <ThemedText style={{ color: '#0284c7', fontSize: 12, fontWeight: 'bold' }}>Tirar Foto</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                {photosBefore.map((uri, index) => (
                  <ThemedView key={index} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoDelete}
                      onPress={() => handleRemovePhoto(index, 'before')}
                    >
                      <Trash2 size={12} color="#fff" />
                    </TouchableOpacity>
                  </ThemedView>
                ))}
                {photosBefore.length === 0 && (
                  <ThemedText style={[styles.photoEmpty, { color: theme.textSecondary }]}>
                    Nenhuma foto de "Antes" adicionada.
                  </ThemedText>
                )}
              </ScrollView>

              {/* Fotos de DEPOIS */}
              <ThemedView style={[styles.photoHeader, { marginTop: Spacing.three }]}>
                <ThemedText style={styles.photoTitle}>Fotos: Depois do Reparo</ThemedText>
                <TouchableOpacity
                  style={styles.photoAddButton}
                  onPress={() => handleTakePhoto('after')}
                >
                  <Camera size={16} color="#0284c7" />
                  <ThemedText style={{ color: '#0284c7', fontSize: 12, fontWeight: 'bold' }}>Tirar Foto</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                {photosAfter.map((uri, index) => (
                  <ThemedView key={index} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoDelete}
                      onPress={() => handleRemovePhoto(index, 'after')}
                    >
                      <Trash2 size={12} color="#fff" />
                    </TouchableOpacity>
                  </ThemedView>
                ))}
                {photosAfter.length === 0 && (
                  <ThemedText style={[styles.photoEmpty, { color: theme.textSecondary }]}>
                    Nenhuma foto de "Depois" adicionada.
                  </ThemedText>
                )}
              </ScrollView>
            </ThemedView>

            {/* Assinatura e Encerramento */}
            <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.sectionTitle}>Aceite do Cliente</ThemedText>
              
              <ThemedText style={styles.label}>Nome do Assinante *</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: '#e5e7eb22' },
                ]}
                placeholder="Ex: José da Silva (Próprio cliente)"
                placeholderTextColor={theme.textSecondary}
                value={signerName}
                onChangeText={setSignerName}
              />

              <ThemedView style={styles.signatureHeader}>
                <ThemedText style={styles.label}>Assinatura Digital *</ThemedText>
                <TouchableOpacity onPress={handleClearSignature}>
                  <ThemedText style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Limpar</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Lousa de Desenho de Assinatura */}
              <ThemedView
                style={[styles.canvas, { backgroundColor: '#fff', borderColor: theme.textSecondary }]}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((path, index) => (
                    <Path key={index} d={path} stroke="#0f172a" strokeWidth={3} fill="none" />
                  ))}
                  {currentPath ? (
                    <Path d={currentPath} stroke="#0f172a" strokeWidth={3} fill="none" />
                  ) : null}
                </Svg>
                {paths.length === 0 && (
                  <ThemedView style={styles.canvasPlaceholder}>
                    <PenTool size={24} color="#9ca3af" />
                    <ThemedText style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
                      Desenhe a assinatura aqui
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            {/* Botão Concluir */}
            <ThemedView style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                onPress={handleCompleteOS}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>Finalizar e Entregar OS</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </ThemedView>
          </>
        )}

        {/* Status: CONCLUIDA (Visualização Estática) */}
        {os?.status === 'concluida' && (
          <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement, alignItems: 'center', padding: Spacing.four }]}>
            <CheckCircle size={48} color="#10b981" />
            <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.two, marginBottom: 0 }]}>
              OS Concluída
            </ThemedText>
            <ThemedText style={[styles.infoText, { textAlign: 'center', color: theme.textSecondary, marginTop: Spacing.one }]}>
              Esta ordem de serviço já foi entregue e finalizada.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  section: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb22',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb22',
    marginVertical: Spacing.one,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  actionSection: {
    marginBottom: Spacing.four,
  },
  actionButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  checklistText: {
    fontSize: 14,
    flex: 1,
  },
  checklistTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0284c722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoList: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  photoContainer: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoDelete: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444cc',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: Spacing.one,
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  canvas: {
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 14,
  },
});
